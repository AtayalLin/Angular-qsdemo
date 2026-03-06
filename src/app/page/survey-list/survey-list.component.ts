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

  /**
   * 向 Service 抓取所有問卷資料
   */
  fetchSurveys(): void {
    this.surveyService.getSurveys().subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.surveys = res.quizList || [];
          this.onSearch();
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

  getDisplayStatus(survey: Survey): string {
    const now = new Date();
    const end = new Date(survey.endDate);
    if (survey.published && end < now) {
      return '已過期';
    }
    if (this.isAdmin) return survey.published ? '已發佈' : '未發佈';
    return survey.published ? '已發佈' : '未開放填寫';
  }

  onSearch() {
    this.currentPage = 1;
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

  publishSurvey(id: number) {
    if (!confirm('確定要發佈嗎？')) return;
    // 這裡應呼叫 API，暫時模擬狀態變更
    const s = this.surveys.find((x) => x.id === id);
    if (s) {
      s.published = true;
      this.onSearch();
    }
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
