import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SurveyService, Survey } from '../../survey.service';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
}

interface SurveyHistory {
  id: number;
  title: string;
  type: string;
  filledDate: string;
  status: 'submitted' | 'draft' | 'expired';
  progress?: number;
  hasData?: boolean;
}

@Component({
  selector: 'app-survey-member',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './survey-member.component.html',
  styleUrl: './survey-member.component.scss',
})
export class SurveyMemberComponent implements OnInit {
  user: UserProfile = {
    name: '林曉齊',
    email: 'atayal.lin@example.com',
    phone: '0912-345-678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    joinDate: '2025-01-20',
  };

  allHistories: SurveyHistory[] = [];

  // [新增] 六筆問卷的模擬填答假資料
  private mockAnswersMap: { [key: number]: any } = {
    1: {
      id: 1,
      title: 'iHome 第514代使用者滿意度調查',
      userInfo: {
        name: '林曉齊',
        phone: '0912-345-678',
        email: 'atayal.lin@example.com',
      },
      q1: '非常滿意',
      q2: '硬體外觀;系統流暢度',
      q3: '是',
      q4: '每天使用',
      q5: '希望下一代能增加更多配色。',
    },
    2: {
      id: 2,
      title: 'iHome 新功能回饋意見',
      userInfo: {
        name: '林曉齊',
        phone: '0912-345-678',
        email: 'atayal.lin@example.com',
      },
      q1: '很有幫助',
      q2: '自定義桌面;語音控制',
      q3: '會',
      q4: '週一至週五',
      q5: '語音辨識在吵雜環境可以再優化。',
    },
    3: {
      id: 3,
      title: '鄉里活動中心活動選拔投票',
      userInfo: {
        name: '林曉齊',
        phone: '0912-345-678',
        email: 'atayal.lin@example.com',
      },
      q1: '社區歌唱大賽',
      q2: '下午時段',
      q3: '2人',
      q4: '步行',
      q5: '希望能多辦一些長輩也能參與的活動。',
    },
    4: {
      id: 4,
      title: '「第24屆天下第一武道大會場地」各家建商標案',
      userInfo: {
        name: '林曉齊',
        phone: '0912-345-678',
        email: 'atayal.lin@example.com',
      },
      q1: '膠囊公司',
      q2: '防禦工事;場地大小',
      q3: '極高',
      q4: '提供仙豆',
      q5: '建議在觀眾席加裝重力力場保護罩。',
    },
    5: {
      id: 5,
      title: '鬼殺隊巡邏滿意度調查',
      userInfo: {
        name: '林曉齊',
        phone: '0912-345-678',
        email: 'atayal.lin@example.com',
      },
      q1: '非常安心',
      q2: '巡邏頻率;隊員態度',
      q3: '是',
      q4: '深夜',
      q5: '感謝辛勞，希望藤花香的範圍能再擴大。',
    },
    6: {
      id: 6,
      title: '87世紀遊戲主機／平台市場調查',
      userInfo: {
        name: '林曉齊',
        phone: '0912-345-678',
        email: 'atayal.lin@example.com',
      },
      q1: 'PlayStation 系列',
      q2: '遊戲陣陣容與獨佔作品;主機效能與畫面表現',
      q3: '非常願意',
      q4: '角色扮演（RPG）',
      q5: '希望主機體積能更輕巧，並支援全像投影。',
    },
  };

  showToast = false;
  toastMsg = '';
  searchText = '';
  statusFilter = 'all';
  currentPage = 1;
  pageSize = 4;

  isEditing = false;
  editUser: UserProfile = { ...this.user };

  // [新增] 密碼修改相關欄位與顯示切換
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordData = {
    current: '',
    new: '',
    confirm: '',
  };

  // [新增] 刪除確認彈窗相關
  showDeleteModal = false;
  targetHistoryItem: SurveyHistory | null = null;

  constructor(
    private router: Router,
    private surveyService: SurveyService,
  ) {}

  ngOnInit(): void {
    this.syncSurveysToHistory();
  }

  syncSurveysToHistory() {
    this.surveyService.getSurveys().subscribe((surveys) => {
      this.allHistories = surveys.map((s, index) => {
        // 設定模擬狀態：除了第3筆設為 expired (無資料) 外，其餘都有資料
        let status: 'submitted' | 'draft' | 'expired' = 'submitted';
        if (index === 0) status = 'draft';
        if (index === 2) status = 'expired';

        return {
          id: s.id,
          title: s.title,
          type: s.type,
          filledDate: s.startDate,
          status: status,
          progress: status === 'draft' ? 65 : undefined,
          hasData: true, // 全部允許檢視
        };
      });
    });
  }

  handleAction(item: SurveyHistory) {
    if (item.status === 'draft') {
      this.router.navigate(['/surveys', item.id, 'question']);
    } else {
      // [關鍵] 取得對應的模擬填答假資料並跳轉，同時帶入 status
      const fakeData = this.mockAnswersMap[item.id] || {
        id: item.id,
        title: item.title,
        userInfo: this.user,
      };
      this.router.navigate(['/surveys', item.id, 'preview'], {
        state: { data: { ...fakeData, status: item.status } },
      });
    }
  }

  // [新增] 刪除處理方法
  openDeleteModal(item: SurveyHistory) {
    this.targetHistoryItem = item;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.targetHistoryItem = null;
  }

  confirmDelete() {
    if (this.targetHistoryItem) {
      this.allHistories = this.allHistories.filter(h => h.id !== this.targetHistoryItem!.id);
      this.triggerToast('已成功刪除該筆問卷紀錄');
      this.closeDeleteModal();
    }
  }

  // 其餘方法保持不變...
  get filteredTotal() {
    return this.allHistories.filter((item) => {
      const matchText = item.title
        .toLowerCase()
        .includes(this.searchText.toLowerCase());
      const matchStatus =
        this.statusFilter === 'all' || item.status === this.statusFilter;
      return matchText && matchStatus;
    });
  }
  get paginatedHistories() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredTotal.slice(startIndex, startIndex + this.pageSize);
  }
  get pageNumbers(): number[] {
    const total = Math.ceil(this.filteredTotal.length / this.pageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2500);
  }
  onSearchChange() {
    this.currentPage = 1;
  }
  setPage(page: number) {
    this.currentPage = page;
  }
  goBack() {
    this.router.navigate(['/surveys']);
  }
  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.editUser = { ...this.user };
      this.passwordData = { current: '', new: '', confirm: '' };
      this.showCurrentPassword = false;
      this.showNewPassword = false;
      this.showConfirmPassword = false;
    }
  }
  saveProfile() {
    this.user = { ...this.editUser };
    this.isEditing = false;
  }
  changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.user.avatar = event.target.result;
          this.editUser.avatar = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }
  getStatusLabel(status: string): string {
    switch (status) {
      case 'submitted':
        return '已送出';
      case 'draft':
        return '暫存中';
      case 'expired':
        return '已過期';
      default:
        return '';
    }
  }
}
