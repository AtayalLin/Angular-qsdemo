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
  // 原理：使用 Angular inject() 函式取得服務實例（等同 constructor 注入）
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private surveyService = inject(SurveyService);

  // 功能：判斷目前登入者是否為管理員，控制管理功能的顯示與隱藏
  isAdmin: boolean = false;

  // 功能：判斷是否有使用者已登入
  isLoggedIn: boolean = false;

  // 功能：儲存目前登入使用者的完整資訊（name, email 等）
  currentUser: any = null;

  // 功能：問卷篩選條件的雙向綁定變數
  searchText = ''; // 關鍵字搜尋
  searchType = ''; // 問卷類型過濾
  searchStatus = ''; // 發佈狀態過濾
  startDate = ''; // 開始日期區間
  endDate = ''; // 結束日期區間

  // 功能：分頁相關變數
  currentPage = 1; // 目前頁碼
  pageSize = 10; // 每頁顯示筆數

  // 功能：原始問卷資料（從後端取回後不再修改）
  surveys: Survey[] = [];

  // 功能：經過篩選條件過濾後的問卷陣列（渲染分頁時使用這份）
  filteredSurveys: Survey[] = [];

  // 功能：批次管理模式下，記錄目前被勾選的問卷 ID 集合
  selectedIds = new Set<number>();

  // 功能：標記目前是否為批次刪除模式（影響刪除彈窗的文字顯示）
  isBatchDeleting = false;

  // 功能：控制批次管理側邊欄的顯示
  isManageMode = false;

  constructor() {}

  ngOnInit(): void {
    // 元件初始化時立即向後端拉取問卷清單
    this.fetchSurveys();

    // 原理：登入後將身份寫入 localStorage，重新整理後從這裡還原登入狀態
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

    // 功能：若 URL 帶有 ?login=true 查詢參數，自動開啟登入彈窗
    // 使用情境：從其他頁面（如填寫頁）要求登入後跳轉回來
    this.route.queryParams.subscribe((params) => {
      if (params['login'] === 'true') {
        this.openLoginModal();
      }
    });
  }

  /** 功能：切換批次管理模式，離開時清空勾選 */
  toggleManageMode() {
    this.isManageMode = !this.isManageMode;
    if (!this.isManageMode) {
      this.selectedIds.clear();
    }
  }

  /** 功能：取消批次管理模式並清空勾選 */
  cancelManageMode() {
    this.isManageMode = false;
    this.selectedIds.clear();
  }

  /**
   * 功能：取得目前頁要顯示的問卷（分頁切片）
   * 原理：根據 currentPage 與 pageSize 計算起始 index，從 filteredSurveys 切出子陣列
   */
  get paginatedSurveys() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredSurveys.slice(startIndex, startIndex + this.pageSize);
  }

  /** 功能：計算實際總頁數（至少為 1 頁） */
  get actualTotalPages(): number {
    return Math.ceil(this.filteredSurveys.length / this.pageSize) || 1;
  }

  /**
   * 功能：分頁導覽的最大頁碼上限
   * 原理：取 10 與實際總頁數的最大值，確保導覽按鈕至少有 10 頁的空間
   */
  get navMaxPage(): number {
    return Math.max(10, this.actualTotalPages);
  }

  /**
   * 功能：產生目前視窗內的頁碼陣列（每次最多顯示 10 個頁碼按鈕）
   * 原理：依 currentPage 計算所在的「十頁區塊」，例如第 1~10 頁、第 11~20 頁...
   */
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

  /** 功能：跳轉至指定頁碼（邊界保護：不超出 1 ~ totalPages） */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.actualTotalPages) {
      this.currentPage = page;
    }
  }

  // ─── 彈窗控制變數 ───────────────────────────
  showLoginModal = false; // 登入彈窗
  showLogoutModal = false; // 登出確認彈窗
  showPassword = false; // 登入表單的密碼顯示切換

  loginForm = {
    account: '',
    password: '',
  };

  showDeleteModal = false; // 刪除確認彈窗
  targetSurvey: Survey | null = null; // 單筆刪除的目標問卷

  showEditModal = false; // 編輯確認彈窗（已發佈問卷編輯前警示）
  targetEditId: number | null = null;

  // Toast 提示的資料物件（title = 標題，message = 副文字）
  toast = {
    show: false,
    title: '',
    message: '',
  };

  /**
   * 功能：從後端取得所有問卷清單
   * 原理：訂閱 getSurveys() Observable，回傳後寫入 surveys，立即執行搜尋過濾
   */
  fetchSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.surveys = res.quizList || [];
          this.onSearch(); // 取得資料後立即套用篩選條件
        } else {
          console.error('抓取問卷失敗', res.message);
        }
      },
      error: (err: any) => console.error('API 異常', err),
    });
  }

  // ─── 批次選取邏輯 ────────────────────────────

  /** 功能：全選/取消全選目前頁的所有問卷 */
  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.paginatedSurveys.forEach((s) => this.selectedIds.add(s.id));
    } else {
      this.selectedIds.clear();
    }
    // 原理：重新賦值觸發 Angular 的變更偵測（Set 的 mutation 不會自動觸發）
    this.selectedIds = new Set(this.selectedIds);
  }

  /** 功能：切換單一問卷的勾選狀態 */
  toggleSelect(id: number) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    this.selectedIds = new Set(this.selectedIds);
  }

  /** 功能：判斷目前頁是否已全選（用於全選 checkbox 的 checked 狀態） */
  isAllSelected(): boolean {
    return (
      this.paginatedSurveys.length > 0 &&
      this.paginatedSurveys.every((s) => this.selectedIds.has(s.id))
    );
  }

  /**
   * 功能：動態計算問卷的顯示狀態文字
   * 原理：
   *   傳入 null 時（編輯彈窗尚未選取目標）→ 回傳空字串，避免 TS 型別錯誤
   *   已發佈且過期 → '已過期'
   *   管理員視角：published 決定 '已發佈' / '未發佈'
   *   一般用戶視角：未發佈一律顯示 '未開放填寫'
   */
  getDisplayStatus(survey: Survey | null): string {
    if (!survey) return ''; // ✅ 防止 targetSurvey 為 null 時模板報錯
    const now = new Date();
    const end = new Date(survey.endDate);
    if (survey.published && end < now) return '已過期';
    if (this.isAdmin) return survey.published ? '已發佈' : '未發佈';
    return survey.published ? '已發佈' : '未開放填寫';
  }

  /**
   * 功能：多重條件篩選問卷
   * 原理：對 surveys 陣列進行 filter，同時比對關鍵字、類型、狀態、日期區間
   *   搜尋時重置回第一頁，避免停留在已無資料的頁碼
   */
  onSearch() {
    this.currentPage = 1;
    const keyword = (this.searchText || '').trim().toLowerCase();
    this.filteredSurveys = this.surveys.filter((s) => {
      const matchText = !keyword || s.title.toLowerCase().includes(keyword);
      const matchType = this.searchType === '' || s.type === this.searchType;

      const statusText = s.published ? '已發佈' : '未發佈';
      const matchStatus =
        this.searchStatus === '' || statusText === this.searchStatus;

      let matchDate = true;
      if (this.startDate)
        matchDate = matchDate && s.startDate >= this.startDate;
      if (this.endDate) matchDate = matchDate && s.endDate <= this.endDate;

      return matchText && matchType && matchStatus && matchDate;
    });
    this.selectedIds.clear();
  }

  /**
   * 功能：進入問卷填寫頁面
   * 原理：一般使用者點擊後先檢查問卷是否過期，過期則顯示提示不導航
   *   管理員不受限制，可進入任何問卷
   */
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

  /** 功能：進入問卷統計結果頁面 */
  viewResult(id: number) {
    this.router.navigate(['/surveys', id, 'result']);
  }

  /**
   * 功能：顯示右上角 Toast 通知，3 秒後自動消失
   */
  triggerToast(title: string, message: string) {
    this.toast = { show: true, title, message };
    setTimeout(() => {
      this.toast.show = false;
    }, 3000);
  }

  /**
   * 功能：發佈問卷
   * 原理：呼叫後端 /publish，成功後刷新列表以更新顯示狀態
   */
  publishSurvey(id: number) {
    if (!confirm('確定要發佈嗎？')) return;
    this.surveyService.publishSurvey(id).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.triggerToast('發佈成功', '該問卷已對外開放');
          this.fetchSurveys();
        }
      },
      error: (err: any) => console.error('發佈失敗', err),
    });
  }

  /**
   * 功能：取消發佈問卷
   * 原理：呼叫後端 /unpublish，成功後刷新列表
   */
  unpublishSurvey(id: number) {
    if (!confirm('確定要取消發佈嗎？')) return;
    this.surveyService.unpublishSurvey(id).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.triggerToast('已取消發佈', '該問卷已暫停開放');
          this.fetchSurveys();
        }
      },
      error: (err: any) => console.error('取消發佈失敗', err),
    });
  }

  /** 功能：開啟單筆刪除確認彈窗，暫存目標問卷 */
  deleteSurvey(id: number) {
    const s = this.surveys.find((x) => x.id === id);
    if (s) {
      this.targetSurvey = s;
      this.isBatchDeleting = false;
      this.showDeleteModal = true;
    }
  }

  /** 功能：開啟批次刪除確認彈窗（需先勾選至少一筆） */
  openBatchDeleteModal() {
    if (this.selectedIds.size === 0) return;
    this.isBatchDeleting = true;
    this.showDeleteModal = true;
  }

  /**
   * 功能：執行刪除（單筆或批次）
   * 原理：根據 isBatchDeleting 旗標決定呼叫哪支 API
   *   成功後清空勾選、刷新列表、關閉彈窗
   */
  confirmDelete() {
    if (this.isBatchDeleting) {
      const ids = Array.from(this.selectedIds);
      this.surveyService.deleteBatchSurveys(ids).subscribe({
        next: (res: any) => {
          this.selectedIds.clear();
          this.fetchSurveys();
          this.closeDeleteModal();
        },
        error: (err: any) => console.error('批次刪除失敗', err),
      });
    } else if (this.targetSurvey) {
      this.surveyService.deleteSingleSurvey(this.targetSurvey.id).subscribe({
        next: (res: any) => {
          this.fetchSurveys();
          this.closeDeleteModal();
        },
        error: (err: any) => console.error('單筆刪除失敗', err),
      });
    }
  }

  /** 功能：關閉刪除彈窗並清空暫存目標 */
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.targetSurvey = null;
    this.isBatchDeleting = false;
  }

  /**
   * 功能：進入問卷編輯頁面
   * 原理：已發佈的問卷先彈出警示彈窗確認，未發佈的直接導向編輯頁
   */
  editSurvey(id: number) {
    const s = this.surveys.find((x) => x.id === id);
    if (s && s.published) {
      this.targetEditId = id;
      this.showEditModal = true;
    } else {
      this.router.navigate(['/admin'], { queryParams: { id: id } });
    }
  }

  /** 功能：確認後進入編輯頁（已發佈問卷的第二步確認） */
  confirmEdit() {
    if (this.targetEditId) {
      this.router.navigate(['/admin'], {
        queryParams: { id: this.targetEditId },
      });
      this.closeEditModal();
    }
  }

  /** 功能：關閉編輯確認彈窗 */
  closeEditModal() {
    this.showEditModal = false;
    this.targetEditId = null;
  }

  /** 功能：開啟登出確認彈窗 */
  logout() {
    this.showLogoutModal = true;
  }

  /**
   * 功能：確認登出
   * 原理：清除 localStorage 中的所有身份資訊，重置元件狀態為訪客模式
   *   同時刷新問卷列表（訪客視角不顯示管理功能）
   */
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

  /** 功能：關閉登出確認彈窗 */
  closeLogoutModal() {
    this.showLogoutModal = false;
  }

  /** 功能：開啟登入彈窗，重置密碼顯示狀態 */
  openLoginModal() {
    this.showLoginModal = true;
    this.showPassword = false;
  }

  /** 功能：關閉登入彈窗並清空表單 */
  closeLoginModal() {
    this.showLoginModal = false;
    this.loginForm = { account: '', password: '' };
  }

  /** 功能：切換登入表單密碼欄位的顯示/隱藏 */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * 功能：處理登入送出
   * 原理：
   *   1. 前端基本驗證（帳號密碼不可為空）
   *   2. 呼叫後端 /login API 驗證帳密
   *   3. 成功後根據 role 判斷是否為管理員，並將資訊持久化至 localStorage
   *   4. 顯示歡迎 Toast 並關閉彈窗、刷新列表
   */
  handleLogin() {
    if (!this.loginForm.account || !this.loginForm.password) {
      alert('請輸入帳號與密碼');
      return;
    }

    this.surveyService
      .login(this.loginForm.account, this.loginForm.password)
      .subscribe({
        next: (res: any) => {
          if (res.code === 200) {
            this.isLoggedIn = true;
            this.isAdmin = res.role === 'admin';
            this.currentUser = res.user;

            // 持久化至 localStorage，確保重新整理後登入狀態不遺失
            localStorage.setItem('currentUser', JSON.stringify(res.user));
            localStorage.setItem('isAdmin', this.isAdmin ? 'true' : 'false');
            localStorage.setItem('userRole', res.role);

            this.triggerToast('登入成功', `歡迎回來，${res.user.name}`);
            this.closeLoginModal();
            this.onSearch(); // 刷新列表以顯示對應角色的操作按鈕
          } else {
            alert(res.message || '帳號或密碼錯誤');
          }
        },
        error: (err: any) => {
          console.error('登入 API 異常', err);
          alert('連線失敗，請檢查後端伺服器');
        },
      });
  }

  /** 功能：忘記密碼提示（目前為開發中占位功能） */
  forgotPassword() {
    alert('請查看 LocalStorage');
  }

  /** 功能：關閉登入彈窗並跳轉至註冊頁 */
  registerAdmin() {
    this.closeLoginModal();
    this.router.navigate(['/register']);
  }
}
