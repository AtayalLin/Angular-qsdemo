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

  surveys: Survey[] = [];
  filteredSurveys: Survey[] = [];

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
        startDate: '1918-1-14',
        endDate: '1918-2-14',
        participants: 200,
        publishStatus: '已儲存尚未發佈',
        questions: [],
      },
      {
        id: 6,
        title: '87世紀遊戲主機／平台市場調查',
        type: '市場調查',
        startDate: '8033-11-25',
        endDate: '8033-12-31',
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

  onSearch() {
    const keyword = (this.searchText || '').trim().toLowerCase();
    this.filteredSurveys = this.surveys.filter((s) => {
      const matchText = !keyword || s.title.toLowerCase().includes(keyword);
      const matchType = this.searchType === '' || s.type === this.searchType;
      const matchStatus =
        this.searchStatus === '' || s.publishStatus === this.searchStatus;
      return matchText && matchType && matchStatus;
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
