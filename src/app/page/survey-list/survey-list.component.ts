import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Survey, SurveyService } from '../../survey.service';

@Component({
  selector: 'app-survey-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './survey-list.component.html',
  styleUrl: './survey-list.component.scss',
})
export class SurveyListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private surveyService = inject(SurveyService);

  // 身分切換
  isAdmin: boolean = false;
  isLoggedIn: boolean = false;
  currentUser: any = null;

  searchText = '';
  searchType = '';
  searchStatus = '';
  startDate = '';
  endDate = '';

  // --- 分頁相關變數 ---
  currentPage = 1;
  pageSize = 10;

  surveys: Survey[] = [];
  filteredSurveys: Survey[] = [];

  // --- 選取邏輯 ---
  selectedIds = new Set<number>();
  isBatchDeleting = false;
  isManageMode = false;

  constructor() {}

  ngOnInit(): void {
    this.fetchSurveys();

    // 檢查登入狀態持久化
    const savedLogin = localStorage.getItem('isAdmin');
    const savedUser = localStorage.getItem('currentUser');
    if (savedLogin === 'true') {
      this.isAdmin = true;
      this.isLoggedIn = true;
    }
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      this.isLoggedIn = true;
    }

    this.route.queryParams.subscribe((params) => {
      if (params['login'] === 'true') {
        this.openLoginModal();
      }
    });
  }

  toggleManageMode() {
    this.isManageMode = !this.isManageMode;
    if (!this.isManageMode) {
      this.selectedIds.clear();
    }
  }

  cancelManageMode() {
    this.isManageMode = false;
    this.selectedIds.clear();
  }

  get paginatedSurveys(): Survey[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredSurveys.slice(startIndex, startIndex + this.pageSize);
  }

  get actualTotalPages(): number {
    return Math.ceil(this.filteredSurveys.length / this.pageSize) || 1;
  }

  get navMaxPage(): number {
    return Math.max(10, this.actualTotalPages);
  }

  get pageNumbers(): number[] {
    const windowSize = 10;
    const startPage =
      Math.floor((this.currentPage - 1) / windowSize) * windowSize + 1;
    const total = this.actualTotalPages;
    const endPage = Math.min(startPage + windowSize - 1, total);

    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.actualTotalPages) {
      this.currentPage = page;
    }
  }

  // --- 彈窗相關變數 ---
  showLoginModal = false;
  showLogoutModal = false;
  showPassword = false;

  loginForm = {
    account: '',
    password: '',
  };

  showDeleteModal = false;
  targetSurvey: Survey | null = null;

  showEditModal = false;
  targetEditId: number | null = null;

  // --- Toast 提示 ---
  toast = {
    show: false,
    title: '',
    message: '',
  };

  /**
   * 初始化問卷清單
   * 原理：組件啟動時呼叫此方法，從 SurveyService 取得所有問卷資料。
   * 包含欄位格式化（如日期與發佈狀態），確保前端顯示的一致性。
   */
  fetchSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          // 獲取問卷列表並確保欄位正確對應
          this.surveys = (res.quizList || []).map((survey: any) => {
            // 判定發佈狀態 (相容後端回傳的 boolean 或 0/1)
            const isPublished =
              survey.published === true ||
              survey.published === 1 ||
              survey.is_published === true ||
              survey.is_published === 1;

            return {
              ...survey,
              // 統一欄位名稱，方便後續在 HTML 中讀取
              published: isPublished,
              // 如果後端沒給 publishStatus，則根據 boolean 自動轉義為文字狀態
              publishStatus: survey.publishStatus || (isPublished ? '已發佈' : '草稿'),
              // 統一日期欄位名稱，避免 backend snake_case 與 frontend camelCase 衝突
              startDate: survey.startDate || survey.start_date,
              endDate: survey.endDate || survey.end_date,
            };
          });
          
          this.onSearch(); // 載入完後執行一次篩選
        } else {
          this.triggerToast('錯誤', '無法載入問卷列表');
        }
      },
      error: (err) => {
        this.triggerToast('錯誤', '連線異常，請檢查網路');
      },
    });
  }

  // --- 選取邏輯方法 ---
  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.paginatedSurveys.forEach((s) => this.selectedIds.add(s.id));
    } else {
      this.selectedIds.clear();
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  isAllSelected(): boolean {
    return (
      this.paginatedSurveys.length > 0 &&
      this.paginatedSurveys.every((s) => this.selectedIds.has(s.id))
    );
  }

  getDisplayStatus(survey: Survey | null | undefined): string {
    if (!survey) return '未知';
    const now = new Date();
    const endDateStr = survey.endDate || '';
    const end = new Date(endDateStr);
    const publishStatus = survey.publishStatus || '未發佈';

    if (publishStatus === '已發佈' && endDateStr && end < now) {
      return '已過期';
    }
    if (this.isAdmin) return publishStatus;
    return publishStatus === '已發佈' ? '已發佈' : '未開放填寫';
  }

  onSearch() {
    this.currentPage = 1;
    const keyword = (this.searchText || '').trim().toLowerCase();
    this.filteredSurveys = this.surveys.filter((s: Survey) => {
      const matchText = !keyword || s.title.toLowerCase().includes(keyword);
      const matchType = this.searchType === '' || s.type === this.searchType;

      const matchStatus =
        this.searchStatus === '' ||
        (s.publishStatus || '') === this.searchStatus;

      // 修正日期比較邏輯 - 兼容 startDate/start_date 和 endDate/end_date
      let matchDate = true;
      if (this.startDate && (s.startDate || s.start_date)) {
        const surveyDate = s.startDate || s.start_date || '';
        matchDate = matchDate && surveyDate >= this.startDate;
      }
      if (this.endDate && (s.endDate || s.end_date)) {
        const surveyDate = s.endDate || s.end_date || '';
        matchDate = matchDate && surveyDate <= this.endDate;
      }
      return matchText && matchType && matchStatus && matchDate;
    });
    this.selectedIds.clear();
  }
  startSurvey(id: number) {
    const s = this.surveys.find((x) => x.id === id);

    // 檢查問卷是否已發佈
    if (!s?.published && !this.isAdmin) {
      this.triggerToast('無法進入填寫', '此問卷尚未發佈，敬請稍候');
      return;
    }

    // 檢查問卷是否過期
    if (s && s.endDate) {
      const now = new Date();
      const end = new Date(s.endDate);
      if (end < now && !this.isAdmin) {
        this.triggerToast('無法進入填寫', '此問卷已過期無法填寫');
        return;
      }
    }

    // 進入問卷填寫頁面
    this.router.navigate(['/surveys', id, 'question']);
  }

  viewResult(id: number) {
    this.router.navigate(['/surveys', id, 'result']);
  }

  triggerToast(title: string, message: string) {
    this.toast = { show: true, title, message };
    setTimeout(() => {
      this.toast.show = false;
    }, 3000);
  }

  publishSurvey(id: number) {
    const survey = this.surveys.find((x) => x.id === id);
    if (!survey) {
      this.triggerToast('錯誤', '無法找到該問卷');
      return;
    }

    if (!confirm('確定要發佈此問卷嗎？發佈後使用者即可進行填寫。')) return;

    // 先更新本地狀態 (樂觀更新)
    const originalStatus = survey.published;
    survey.published = true;
    this.onSearch();

    // 調用 API 發佈問卷
    this.surveyService.publishSurvey(id).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.triggerToast('發佈成功', `問卷「${survey.title}」已開放填寫`);
          this.fetchSurveys();
          this.onSearch();
        } else {
          // 恢復原狀態
          survey.published = originalStatus;
          this.onSearch();
          this.triggerToast('發佈失敗', res.message || '無法發佈問卷');
        }
      },
      error: (err) => {
        console.error('發佈 API 異常 - 詳細信息:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          errorMessage: err.error?.message,
          url: err.url,
          headers: err.headers,
        });
        // 恢復原狀態
        survey.published = originalStatus;
        this.onSearch();

        // 根據錯誤類型提供更詳細的提示
        let errorMsg = '發佈過程中發生錯誤';
        if (err.status === 500) {
          errorMsg = '伺服器內部錯誤，請檢查後端日誌';
        } else if (err.status === 404) {
          errorMsg = '無法找到該端點，可能不存在或位址錯誤';
        } else if (err.status === 403) {
          errorMsg = '權限不足，無法發佈';
        }
        this.triggerToast('錯誤', errorMsg);
      },
    });
  }

  unpublishSurvey(id: number) {
    const survey = this.surveys.find((x) => x.id === id);
    if (!survey) {
      this.triggerToast('錯誤', '無法找到該問卷');
      return;
    }

    if (!confirm('確定要取消發佈此問卷嗎？取消發佈後使用者無法填寫。')) return;

    // 先更新本地狀態 (樂觀更新)
    const originalStatus = survey.published;
    survey.published = false;
    this.onSearch();

    // 調用 API 取消發佈問卷
    this.surveyService.unpublishSurvey(id).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.triggerToast('取消成功', `問卷「${survey.title}」已關閉填寫`);
          this.fetchSurveys();
          this.onSearch();
        } else {
          // 恢復原狀態
          survey.published = originalStatus;
          this.onSearch();
          this.triggerToast('取消失敗', res.message || '無法取消發佈問卷');
        }
      },
      error: (err) => {
        console.error('取消發佈 API 異常 - 詳細信息:', {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          errorMessage: err.error?.message,
          url: err.url,
          headers: err.headers,
        });
        // 恢復原狀態
        survey.published = originalStatus;
        this.onSearch();

        // 根據錯誤類型提供更詳細的提示
        let errorMsg = '取消發佈過程中發生錯誤';
        if (err.status === 500) {
          errorMsg = '伺服器內部錯誤，請檢查後端日誌';
        } else if (err.status === 404) {
          errorMsg = '無法找到該端點，可能不存在或位址錯誤';
        } else if (err.status === 403) {
          errorMsg = '權限不足，無法取消發佈';
        }
        this.triggerToast('錯誤', errorMsg);
      },
    });
  }

  deleteSurvey(id: number) {
    const s = this.surveys.find((x) => x.id === id);
    if (s) {
      this.targetSurvey = s;
      this.isBatchDeleting = false;
      this.showDeleteModal = true;
    }
  }

  openBatchDeleteModal() {
    if (this.selectedIds.size === 0) return;
    this.isBatchDeleting = true;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.isBatchDeleting) {
      const ids = Array.from(this.selectedIds);
      this.surveyService.deleteBatchSurveys(ids).subscribe({
        next: (res: any) => {
          if (res.code === 200) {
            this.triggerToast('刪除成功', `已成功刪除 ${ids.length} 份問卷`);
            this.selectedIds.clear();
            this.fetchSurveys();
            this.closeDeleteModal();
          } else {
            this.triggerToast('刪除失敗', res.message || '批次刪除失敗');
          }
        },
        error: (err) => {
          console.error('批次刪除失敗', err);
          this.triggerToast('錯誤', '批次刪除過程中發生錯誤');
        },
      });
    } else if (this.targetSurvey) {
      this.surveyService.deleteSingleSurvey(this.targetSurvey.id).subscribe({
        next: (res: any) => {
          if (res.code === 200) {
            this.triggerToast(
              '刪除成功',
              `問卷「${this.targetSurvey?.title}」已被刪除`,
            );
            this.fetchSurveys();
            this.closeDeleteModal();
          } else {
            this.triggerToast('刪除失敗', res.message || '無法刪除問卷');
          }
        },
        error: (err) => {
          console.error('單筆刪除失敗', err);
          this.triggerToast('錯誤', '刪除過程中發生錯誤');
        },
      });
    }
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.targetSurvey = null;
    this.isBatchDeleting = false;
  }

  editSurvey(id: number) {
    const s = this.surveys.find((x) => x.id === id);
    if (s) {
      this.targetSurvey = { ...s }; // 深拷貝，避免直接修改原始數據
      this.targetEditId = id;
      this.showEditModal = true;
    } else {
      this.triggerToast('錯誤', '無法找到指定問卷');
    }
  }

  confirmEdit() {
    if (this.targetEditId && this.targetSurvey) {
      // 傳遞完整的問卷資訊到管理中心
      this.router
        .navigate(['/admin'], {
          queryParams: { id: this.targetEditId },
          state: { survey: this.targetSurvey },
        })
        .then((success) => {
          if (success) {
            this.closeEditModal();
            this.triggerToast(
              '轉跳中',
              `正在編輯「${this.targetSurvey?.title}」...`,
            );
          } else {
            this.triggerToast('錯誤', '無法跳轉到編輯頁面');
          }
        })
        .catch((err) => {
          console.error('導航失敗', err);
          this.triggerToast('錯誤', '跳轉過程中發生錯誤');
        });
    } else {
      this.triggerToast('錯誤', '問卷信息不完整，無法進行編輯');
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.targetEditId = null;
    this.targetSurvey = null; // 清空目標問卷數據
  }

  logout() {
    this.showLogoutModal = true;
  }

  confirmLogout() {
    this.isAdmin = false;
    this.isLoggedIn = false;
    this.currentUser = null;
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    this.showLogoutModal = false;
    this.onSearch();
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  openLoginModal() {
    this.showLoginModal = true;
    this.showPassword = false;
  }

  closeLoginModal() {
    this.showLoginModal = false;
    this.loginForm = { account: '', password: '' };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * 處理使用者登入
   * 原理：透過 SurveyService 發送帳密至後端驗證。
   * 包含「測試模式」邏輯：若帳密匹配特定的開發者憑證 (test@gmail.com / 123456789)，
   * 即使 API 回傳錯誤 (例如後端未啟動)，仍允許以管理員身份進入系統，確保前端功能的展示不受後端狀態限制。
   */
  handleLogin() {
    const { account, password } = this.loginForm;
    if (!account || !password) {
      alert('請輸入帳號與密碼');
      return;
    }

    // 管理員測試帳號邏輯 (開發展示與緊急調錯用)
    const isTestAdmin =
      account === 'test@gmail.com' && password === '123456789';

    this.surveyService.login(account, password).subscribe({
      next: (res: any) => {
        // 只要後端驗證通過 (code 200) 或符合硬編碼的測試憑證，皆執行登入程序
        if (res.code === 200 || isTestAdmin) {
          this.isLoggedIn = true;
          this.isAdmin = isTestAdmin || res.role === 'admin';
          // 優先採用後端回傳的使用者資料，否則使用測試預設值
          this.currentUser = res.user || {
            name: '系統管理員',
            email: 'test@gmail.com',
            phone: '0900-000-000',
          };

          // 將登入狀態寫入 LocalStorage 實現持久化，避免重新整理頁面後掉線
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          localStorage.setItem('isAdmin', this.isAdmin ? 'true' : 'false');
          localStorage.setItem(
            'userRole',
            this.isAdmin ? 'admin' : res.role || 'member',
          );

          this.triggerToast('登入成功', `歡迎回來，${this.currentUser.name}`);
          this.closeLoginModal();
          this.onSearch();
        } else {
          alert(res.message || '帳號或密碼錯誤');
        }
      },
      error: (err) => {
        // [強化] 離線測試模式：若 API 噴錯但帳密符合測試憑證，仍強制登入
        if (isTestAdmin) {
          this.isLoggedIn = true;
          this.isAdmin = true;
          this.currentUser = {
            name: '系統管理員(測試模式)',
            email: 'test@gmail.com',
            phone: '0900-000-000',
          };
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('userRole', 'admin');
          this.triggerToast('測試模式', '已使用管理員憑證登入');
          this.closeLoginModal();
          this.onSearch();
        } else {
          console.error('登入 API 異常', err);
          alert('連線失敗，請檢查後端伺服器是否啟動');
        }
      },
    });
  }

  forgotPassword() {
    alert('請查看 LocalStorage');
  }

  registerAdmin() {
    this.closeLoginModal();
    this.router.navigate(['/register']);
  }
}
