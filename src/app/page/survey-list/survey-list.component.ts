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
    const endPage = startPage + windowSize - 1;
    const pages: number[] = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.navMaxPage) {
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

  ngOnInit(): void {
    this.fetchSurveys();
    
    // 檢查登入狀態持久化
    const savedLogin = localStorage.getItem('isAdmin');
    const savedUser = localStorage.getItem('currentUser');
    if (savedLogin === 'true') { this.isAdmin = true; this.isLoggedIn = true; }
    if (savedUser) { this.currentUser = JSON.parse(savedUser); this.isLoggedIn = true; }

    this.route.queryParams.subscribe((params) => {
      if (params['login'] === 'true') { this.openLoginModal(); }
    });
  }

  /**
   * 向 Service 抓取所有問卷資料
   * 功用：確保與管理中心的工作台資料來源一致。
   */
  fetchSurveys(): void {
    this.surveyService.getSurveys().subscribe(list => {
      this.surveys = list;
      this.onSearch();
    });
  }

  onImportTestData(): void {
    if (!confirm('是否將假資料「87世紀遊戲主機」導入 MySQL 資料庫？')) return;
    this.surveyService.importMockDataToDatabase().subscribe({
      next: (res: any) => { if (res.code === 200) alert('成功'); else alert('失敗'); },
      error: () => alert('連線失敗'),
    });
  }

  getDisplayStatus(status: string): string {
    if (this.isAdmin) return status;
    return status === '已發佈' ? '已發佈' : '未開放填寫';
  }

  onSearch() {
    this.currentPage = 1;
    const keyword = (this.searchText || '').trim().toLowerCase();
    this.filteredSurveys = this.surveys.filter((s) => {
      const matchText = !keyword || s.title.toLowerCase().includes(keyword);
      const matchType = this.searchType === '' || s.type === this.searchType;
      const matchStatus = this.searchStatus === '' || s.publishStatus === this.searchStatus;
      let matchDate = true;
      if (this.startDate) matchDate = matchDate && s.startDate >= this.startDate;
      if (this.endDate) matchDate = matchDate && s.endDate <= this.endDate;
      return matchText && matchType && matchStatus && matchDate;
    });
  }

  startSurvey(id: number) { this.router.navigate(['/surveys', id, 'question']); }

  publishSurvey(id: number) {
    if (!confirm('確定要發佈嗎？')) return;
    const s = this.surveys.find((x) => x.id === id);
    if (s) { s.publishStatus = '已發佈'; this.onSearch(); }
  }

  deleteSurvey(id: number) {
    const s = this.surveys.find(x => x.id === id);
    if (s) { this.targetSurvey = s; this.showDeleteModal = true; }
  }

  confirmDelete() {
    if (this.targetSurvey) {
      this.surveys = this.surveys.filter((s) => s.id !== this.targetSurvey?.id);
      this.onSearch();
      this.closeDeleteModal();
    }
  }

  closeDeleteModal() { this.showDeleteModal = false; this.targetSurvey = null; }

  editSurvey(id: number) {
    const s = this.surveys.find(x => x.id === id);
    if (s && s.publishStatus === '已發佈') {
      this.targetEditId = id;
      this.showEditModal = true;
    } else {
      this.router.navigate(['/admin'], { queryParams: { id: id } });
    }
  }

  confirmEdit() {
    if (this.targetEditId) {
      this.router.navigate(['/admin'], { queryParams: { id: this.targetEditId } });
      this.closeEditModal();
    }
  }

  closeEditModal() { this.showEditModal = false; this.targetEditId = null; }

  logout() { this.showLogoutModal = true; }

  confirmLogout() {
    this.isAdmin = false; this.isLoggedIn = false; this.currentUser = null;
    localStorage.removeItem('isAdmin'); localStorage.removeItem('currentUser');
    this.showLogoutModal = false; this.onSearch();
  }

  closeLogoutModal() { this.showLogoutModal = false; }

  goToAdmin() { if (this.isAdmin) this.logout(); else this.openLoginModal(); }

  openLoginModal() { this.showLoginModal = true; this.showPassword = false; }

  closeLoginModal() { this.showLoginModal = false; this.loginForm = { account: '', password: '' }; }

  togglePasswordVisibility(): void { this.showPassword = !this.showPassword; }

  handleLogin() {
    // 定義全域通用的超級管理員憑證
    const ADMIN_CREDENTIALS = { account: 'test@gmail.com', password: '123456789' };

    // 1. 優先檢查是否為超級管理員
    if (this.loginForm.account === ADMIN_CREDENTIALS.account && this.loginForm.password === ADMIN_CREDENTIALS.password) {
      const adminUser = { account: ADMIN_CREDENTIALS.account, name: '超級管理員', password: ADMIN_CREDENTIALS.password };
      this.isLoggedIn = true;
      this.isAdmin = true;
      this.currentUser = adminUser;
      localStorage.setItem('currentUser', JSON.stringify(adminUser));
      localStorage.setItem('isAdmin', 'true');
      this.closeLoginModal();
      this.onSearch();
      return;
    }

    // 2. 若非超級管理員，則檢查一般註冊會員 (LocalStorage)
    const users = JSON.parse(localStorage.getItem('survey_users') || '[]');
    const u = users.find((x: any) => x.account === this.loginForm.account && x.password === this.loginForm.password);
    
    if (u) {
      this.isLoggedIn = true;
      this.currentUser = u;
      localStorage.setItem('currentUser', JSON.stringify(u));
      // 雙重保險：如果一般使用者列表裡剛好有 test@gmail.com 也給予管理員權限
      if (u.account === ADMIN_CREDENTIALS.account) {
        this.isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
      }
      this.closeLoginModal();
      this.onSearch();
    } else {
      alert('帳號或密碼錯誤');
    }
  }

  forgotPassword() { alert('請查看 LocalStorage'); }

  registerAdmin() { this.closeLoginModal(); this.router.navigate(['/register']); }
}
