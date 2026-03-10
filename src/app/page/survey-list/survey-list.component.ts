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
    this.fetchSurveys(); // 初始化載入：元件建立時立即向後端請求問卷清單資料

    // 檢查登入狀態持久化 - 原理：從 LocalStorage 讀取權限資訊，確保重新整理後登入狀態不遺失
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

  // 分頁切片邏輯 - 原理：根據當前頁碼與每頁筆數，從篩選後的陣列中切出要顯示的部分
  get paginatedSurveys() {
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
    const startPage = Math.floor((this.currentPage - 1) / windowSize) * windowSize + 1;
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

  // 向 Service 抓取所有問卷資料 - 原理：訂閱 Observable 以接收後端回傳的 JSON 列表並存入本地陣列
  fetchSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.surveys = res.quizList || [];
          this.onSearch(); // 取得資料後立即執行預設搜尋/過濾
        } else {
          console.error('抓取問卷失敗', res.message);
        }
      },
      error: (err) => console.error('API 異常', err)
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

  // 動態判定問卷顯示狀態 - 原理：比對當前系統時間與問卷截止日，結合發佈標記回傳文字描述
  getDisplayStatus(survey: Survey): string {
    const now = new Date();
    const end = new Date(survey.endDate);
    if (survey.published && end < now) {
      return '已過期';
    }
    if (this.isAdmin) return survey.published ? '已發佈' : '未發佈';
    return survey.published ? '已發佈' : '未開放填寫';
  }

  // 多重條件搜尋過濾 - 原理：在前端針對標題、類型、狀態與日期範圍對 surveys 陣列進行 filter 篩選
  onSearch() {
    this.currentPage = 1; // 搜尋時重置分頁至第一頁
    const keyword = (this.searchText || '').trim().toLowerCase();
    this.filteredSurveys = this.surveys.filter((s) => {
      const matchText = !keyword || s.title.toLowerCase().includes(keyword);
      const matchType = this.searchType === '' || s.type === this.searchType;
      
      const statusText = s.published ? '已發佈' : '未發佈';
      const matchStatus = this.searchStatus === '' || statusText === this.searchStatus;
      
      let matchDate = true;
      if (this.startDate)
        matchDate = matchDate && s.startDate >= this.startDate;
      if (this.endDate) matchDate = matchDate && s.endDate <= this.endDate;
      return matchText && matchType && matchStatus && matchDate;
    });
    this.selectedIds.clear();
  }

  // 進入填寫問卷頁面 - 原理：檢查權限與效期後，透過 Angular Router 導覽至指定 ID 的題目元件
  startSurvey(id: number) {
    const s = this.surveys.find((x) => x.id === id);
    if (s) {
      const now = new Date();
      const end = new Date(s.endDate);
      if (end < now && !this.isAdmin) {
        this.triggerToast('無法進入填寫', '此問卷已過期無法填寫');
        return;
      }
    }
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

  // 發佈問卷功能 - 原理：調用 Service 變更問卷狀態並通知後端，隨後刷新列表顯示
  publishSurvey(id: number) {
    if (!confirm('確定要發佈嗎？')) return;
    this.surveyService.publishSurvey(id).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.triggerToast('發佈成功', '該問卷已對外開放');
          this.fetchSurveys();
        }
      },
      error: (err) => console.error('發佈失敗', err)
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

  // 執行刪除動作 - 原理：區分單筆與批次刪除，發送請求至後端從資料庫移除對應記錄
  confirmDelete() {
    if (this.isBatchDeleting) {
      const ids = Array.from(this.selectedIds);
      this.surveyService.deleteBatchSurveys(ids).subscribe({
        next: (res) => {
          this.selectedIds.clear();
          this.fetchSurveys();
          this.closeDeleteModal();
        },
        error: (err) => console.error('批次刪除失敗', err),
      });
    } else if (this.targetSurvey) {
      this.surveyService.deleteSingleSurvey(this.targetSurvey.id).subscribe({
        next: (res) => {
          this.fetchSurveys();
          this.closeDeleteModal();
        },
        error: (err) => console.error('單筆刪除失敗', err),
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
    if (s && s.published) {
      this.targetEditId = id;
      this.showEditModal = true;
    } else {
      this.router.navigate(['/admin'], { queryParams: { id: id } });
    }
  }

  confirmEdit() {
    if (this.targetEditId) {
      this.router.navigate(['/admin'], {
        queryParams: { id: this.targetEditId },
      });
      this.closeEditModal();
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.targetEditId = null;
  }

  logout() {
    this.showLogoutModal = true;
  }

  // 登出帳號 - 原理：清空 LocalStorage 中的身份憑證並重置全域變數，強制切換為訪客視角
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

  // 處理使用者登入邏輯 - 原理：發送帳密至後端驗證，成功後將角色資訊寫入持久化儲存 (LocalStorage)
  handleLogin() {
    if (!this.loginForm.account || !this.loginForm.password) {
      alert('請輸入帳號與密碼');
      return;
    }

    this.surveyService.login(this.loginForm.account, this.loginForm.password).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.isLoggedIn = true;
          this.isAdmin = res.role === 'admin';
          this.currentUser = res.user;
          
          localStorage.setItem('currentUser', JSON.stringify(res.user));
          localStorage.setItem('isAdmin', this.isAdmin ? 'true' : 'false');
          localStorage.setItem('userRole', res.role);

          this.triggerToast('登入成功', `歡迎回來，${res.user.name}`);
          this.closeLoginModal();
          this.onSearch();
        } else {
          alert(res.message || '帳號或密碼錯誤');
        }
      },
      error: (err) => {
        console.error('登入 API 異常', err);
        alert('連線失敗，請檢查後端伺服器');
      }
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
