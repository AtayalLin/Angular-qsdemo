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

  // 身分切換：true = 管理者 / false = 使用者
  isAdmin: boolean = false;

  searchText = '';
  searchType = '';
  searchStatus = '';
  startDate = ''; // [新增] 搜尋開始日期
  endDate = '';   // [新增] 搜尋結束日期

  // --- 分頁相關變數 ---
  currentPage = 1;  // 當前頁碼
  pageSize = 10;    // 每頁顯示筆數

  surveys: Survey[] = [];
  filteredSurveys: Survey[] = [];

  /**
   * 取得當前分頁後的問卷列表
   * 功用：根據當前頁碼與每頁筆數，從過濾後的列表中切分出顯示區塊。
   */
  get paginatedSurveys() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const items = this.filteredSurveys.slice(startIndex, startIndex + this.pageSize);
    return items;
  }

  /**
   * 計算總頁數 (實際有資料的頁數)
   */
  get actualTotalPages(): number {
    return Math.ceil(this.filteredSurveys.length / this.pageSize) || 1;
  }

  /**
   * 導航用的最大頁數 (至少顯示 10 頁)
   * 功用：確保使用者可以看見 1-10 頁標籤，若實際資料超過則隨之增加。
   */
  get navMaxPage(): number {
    return Math.max(10, this.actualTotalPages);
  }

  /**
   * 產生頁碼陣列 (固定顯示 10 個頁籤的窗口)
   * 功用：根據當前頁碼計算出應顯示的 10 個頁碼範圍。
   */
  get pageNumbers(): number[] {
    // 計算當前 10 頁窗口的起始頁
    const windowSize = 10;
    const startPage = Math.floor((this.currentPage - 1) / windowSize) * windowSize + 1;
    
    // 計算結束頁 (至少到 10，或根據 navMaxPage 延伸)
    const endPage = startPage + windowSize - 1;
    
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  /**
   * 切換頁碼
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.navMaxPage) {
      this.currentPage = page;
    }
  }

  // --- 彈窗相關變數 ---
  showLoginModal = false;
  showPassword = false; // [新增] 控制密碼顯示/隱藏的狀態

  loginForm = {
    account: '',
    password: '',
  };

  ngOnInit(): void {
    // 1. 初始化列表
    this.fetchSurveys();

    // 2. 檢查登入狀態持久化
    const savedLogin = localStorage.getItem('isAdmin');
    if (savedLogin === 'true') {
      this.isAdmin = true;
      this.onSearch();
    }

    // 3. 監聽 URL 參數
    this.route.queryParams.subscribe((params) => {
      if (params['login'] === 'true') {
        this.openLoginModal();
      }
    });
  }

  fetchSurveys(): void {
    // 模擬資料 (保持不變)
    const tempSurveys: Survey[] = [
      {
        id: 1,
        title: 'iHome 第514代使用者滿意度調查',
        type: '滿意度',
        startDate: '2175-11-23',
        endDate: '2175-12-23',
        participants: 120,
        publishStatus: '已發佈',
        questions: [],
      },
      {
        id: 2,
        title: 'iHome 新功能回饋意見',
        type: '問卷',
        startDate: '2175-07-08',
        endDate: '2175-09-15',
        participants: 45,
        publishStatus: '已發佈',
        questions: [],
      },
      {
        id: 3,
        title: '鄉里活動中心活動選拔投票',
        type: '活動',
        startDate: '2024-09-11',
        endDate: '2024-09-31',
        participants: 85,
        publishStatus: '已發佈',
        questions: [],
      },
      {
        id: 4,
        title: '「第24屆天下第一武道大會場地」各家建商標案',
        type: '回饋',
        startDate: '767-04-25',
        endDate: '767-05-01',
        participants: 77,
        publishStatus: '草稿',
        questions: [],
      },
      {
        id: 5,
        title: '鬼殺隊巡邏滿意度調查',
        type: '滿意度',
        startDate: '1918-01-14',
        endDate: '1918-02-14',
        participants: 200,
        publishStatus: '已儲存尚未發佈',
        questions: [],
      },
      {
        id: 6,
        title: '87世紀遊戲主機／平台市場調查',
        type: '市場調查',
        startDate: '2026-02-15',
        endDate: '2026-12-31',
        participants: 1200,
        publishStatus: '已發佈',
        // [新增] 為了讓測試有題目可以存入，我們這裡手動補上幾題
        questions: [
          {
            id: 1,
            title: '最常使用的平台？',
            type: 'single',
            options: ['PS5', 'PC', 'Switch'],
          },
          { id: 2, title: '建議回饋', type: 'text' },
        ],
      },
    ];
    this.surveys = tempSurveys;
    this.onSearch();
  }

  onImportTestData(): void {
    if (!confirm('是否將假資料「87世紀遊戲主機」導入 MySQL 資料庫？')) return;

    this.surveyService.importMockDataToDatabase().subscribe({
      next: (res: any) => {
        console.log('後端回應:', res);
        if (res.code === 200) {
          alert('資料導入成功！請檢查 MySQL 資料庫。');
        } else {
          alert('導入失敗，後端訊息：' + res.message);
        }
      },
      error: (err) => {
        console.error('HTTP 錯誤:', err);
        alert('連線失敗，請確認 Eclipse 是否已啟動伺服器 (8080)。');
      },
    });
  }

  getDisplayStatus(status: string): string {
    if (this.isAdmin) return status;
    return status === '已發佈' ? '已發佈' : '未開放填寫';
  }

  /**
   * 搜尋問卷方法
   * 功用：根據關鍵字、類型、狀態、以及日期區間過濾問卷列表。
   */
  onSearch() {
    this.currentPage = 1; // 每次搜尋條件變動，重置回第一頁
    const keyword = (this.searchText || '').trim().toLowerCase();
    this.filteredSurveys = this.surveys.filter((s) => {
      // 1. 關鍵字比對
      const matchText = !keyword || s.title.toLowerCase().includes(keyword);
      // 2. 類型比對
      const matchType = this.searchType === '' || s.type === this.searchType;
      // 3. 狀態比對
      const matchStatus =
        this.searchStatus === '' || s.publishStatus === this.searchStatus;
      
      // 4. [新增] 日期區間比對：問卷的 startDate 與 endDate 必須落在搜尋區間內
      let matchDate = true;
      if (this.startDate) {
        matchDate = matchDate && s.startDate >= this.startDate;
      }
      if (this.endDate) {
        matchDate = matchDate && s.endDate <= this.endDate;
      }

      return matchText && matchType && matchStatus && matchDate;
    });
  }

  // --- 功能按鈕 ---
  startSurvey(id: number) {
    this.router.navigate(['/surveys', id, 'question']);
  }

  publishSurvey(id: number) {
    if (!confirm('確定要發佈這份問卷嗎？')) return;
    const survey = this.surveys.find((s) => s.id === id);
    if (survey) {
      survey.publishStatus = '已發佈';
      this.onSearch();
    }
  }

  deleteSurvey(id: number) {
    if (!confirm('確定要刪除這份問卷嗎？')) return;
    this.surveys = this.surveys.filter((s) => s.id !== id);
    this.onSearch();
  }

  editSurvey(id: number) {
    console.log('編輯問卷 ID:', id);
  }

  goToAdmin() {
    if (this.isAdmin) {
      this.logout();
    } else {
      this.openLoginModal();
    }
  }

  trackById(index: number, item: Survey) {
    return item.id;
  }

  // --- 彈窗控制邏輯 ---
  openLoginModal() {
    this.showLoginModal = true;
    this.showPassword = false; // 開啟時預設隱藏密碼
  }

  closeLoginModal() {
    this.showLoginModal = false;
    this.showPassword = false; // 關閉時重置狀態
    this.loginForm = { account: '', password: '' };
  }

  // [新增] 切換密碼可見性的方法
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  handleLogin() {
    const storedUsers = JSON.parse(
      localStorage.getItem('survey_users') || '[]',
    );
    const user = storedUsers.find(
      (u: any) =>
        u.account === this.loginForm.account &&
        u.password === this.loginForm.password,
    );

    if (user) {
      alert(`歡迎回來，${user.name} 管理員！`);
      this.isAdmin = true;
      localStorage.setItem('isAdmin', 'true');
      this.closeLoginModal();
      this.onSearch();
    } else {
      alert('帳號或密碼錯誤，請重新輸入。');
    }
  }

  forgotPassword() {
    alert('測試模式：請直接查看瀏覽器 LocalStorage 或重新註冊帳號。');
  }

  registerAdmin() {
    this.closeLoginModal();
    this.router.navigate(['/register']);
  }

  logout() {
    if (confirm('確定要登出管理員身分嗎？')) {
      this.isAdmin = false;
      localStorage.removeItem('isAdmin');
      this.onSearch();
      alert('已登出');
    }
  }
}
