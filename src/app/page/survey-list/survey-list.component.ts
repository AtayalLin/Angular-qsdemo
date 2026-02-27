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
    const items = this.filteredSurveys.slice(startIndex, startIndex + this.pageSize);
    return items;
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

  // --- [新增] 刪除確認彈窗相關變數 ---
  showDeleteModal = false; 
  targetSurvey: Survey | null = null; 

  // --- [新增] 編輯確認彈窗相關變數 ---
  showEditModal = false;   
  targetEditId: number | null = null; 

  ngOnInit(): void {
    this.fetchSurveys();
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
    this.onSearch();
    this.route.queryParams.subscribe((params) => {
      if (params['login'] === 'true') {
        this.openLoginModal();
      }
    });
  }

  fetchSurveys(): void {
    const tempSurveys: Survey[] = [
      { id: 1, title: 'iHome 第514代使用者滿意度調查', type: '滿意度', startDate: '2175-11-23', endDate: '2175-12-23', participants: 120, publishStatus: '已發佈', questions: [], description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。' },
      { id: 2, title: 'iHome 新功能回饋意見', type: '問卷', startDate: '2175-07-08', endDate: '2175-09-15', participants: 45, publishStatus: '已發佈', questions: [], description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。' },
      { id: 3, title: '鄉里活動中心活動選拔投票', type: '活動', startDate: '2024-09-11', endDate: '2024-09-31', participants: 85, publishStatus: '已發佈', questions: [], description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。' },
      { id: 4, title: '「第24屆天下第一武道大會場地」各家建商標案', type: '回饋', startDate: '767-04-25', endDate: '767-05-01', participants: 77, publishStatus: '草稿', questions: [], description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。' },
      { id: 5, title: '鬼殺隊巡邏滿意度調查', type: '滿意度', startDate: '1918-01-14', endDate: '1918-02-14', participants: 200, publishStatus: '已儲存尚未發佈', questions: [], description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。' },
      { id: 6, title: '87世紀遊戲主機／平台市場調查', type: '市場調查', startDate: '2026-02-15', endDate: '2026-12-31', participants: 1200, publishStatus: '已發佈', description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。', questions: [{ id: 1, title: '最常使用的平台？', type: 'single', options: ['PS5', 'PC', 'Switch'] }, { id: 2, title: '建議回饋', type: 'text' }] },
    ];
    this.surveys = tempSurveys;
    this.onSearch();
  }

  onImportTestData(): void {
    if (!confirm('是否將假資料「87世紀遊戲主機」導入 MySQL 資料庫？')) return;
    this.surveyService.importMockDataToDatabase().subscribe({
      next: (res: any) => { if (res.code === 200) alert('成功！'); else alert('失敗'); },
      error: (err) => alert('連線失敗'),
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
    const users = JSON.parse(localStorage.getItem('survey_users') || '[]');
    const u = users.find((x: any) => x.account === this.loginForm.account && x.password === this.loginForm.password);
    if (u) {
      this.isLoggedIn = true; this.currentUser = u;
      localStorage.setItem('currentUser', JSON.stringify(u));
      if (u.account === 'test@gmail.com') { this.isAdmin = true; localStorage.setItem('isAdmin', 'true'); }
      this.closeLoginModal(); this.onSearch();
    } else alert('錯誤');
  }

  forgotPassword() { alert('請查看 LocalStorage'); }

  registerAdmin() { this.closeLoginModal(); this.router.navigate(['/register']); }
}
