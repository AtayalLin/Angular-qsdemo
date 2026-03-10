import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SurveyService, Survey } from '../../survey.service';

// 功能：定義會員個人資料的型別結構
interface UserProfile {
  name: string;
  email: string;
  phone: string;
  avatar: string; // 儲存 Base64 字串或圖片 URL
  joinDate: string;
}

// 功能：定義填答歷史紀錄的型別結構
interface SurveyHistory {
  id: number;
  title: string;
  type: string;
  filledDate: string;
  status: 'submitted' | 'draft' | 'expired'; // 已送出 / 暫存中 / 已過期
  progress?: number; // 暫存中時顯示填寫進度百分比
  hasData?: boolean; // 是否有對應的填答資料（供後續擴充用）
}

@Component({
  selector: 'app-survey-member',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './survey-member.component.html',
  styleUrl: './survey-member.component.scss',
})
export class SurveyMemberComponent implements OnInit {
  // 功能：目前登入會員的個人資料，頁面預設值（會被 localStorage 覆蓋）
  user: UserProfile = {
    name: '林曉齊',
    email: 'atayal.lin@example.com',
    phone: '0912-345-678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    joinDate: '2025-01-20',
  };

  // 功能：儲存從後端撈回的填答歷史紀錄清單
  allHistories: SurveyHistory[] = [];

  // 功能：開發測試用的假資料，對應 6 份問卷的模擬填答內容
  // 原理：key 為問卷 ID，value 為對應的填答資料物件
  // 注意：正式環境已改為從後端 getFeedback API 取得，此區塊可保留備用
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

  // 功能：控制右上角 Toast 提示訊息
  showToast = false;
  toastMsg = '';

  // 功能：問卷紀錄的關鍵字搜尋文字
  searchText = '';

  // 功能：目前選取的狀態過濾條件（all / submitted / draft / expired）
  statusFilter = 'all';

  // 功能：目前頁碼與每頁顯示筆數
  currentPage = 1;
  pageSize = 4;

  // 功能：控制個人資料是否進入編輯模式
  isEditing = false;

  // 功能：編輯中的暫存資料，儲存模式才會寫回 user
  editUser: UserProfile = { ...this.user };

  // 功能：控制密碼欄位的顯示/隱藏切換
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  // 功能：密碼修改的三個欄位（目前密碼、新密碼、確認密碼）
  passwordData = {
    current: '',
    new: '',
    confirm: '',
  };

  // 功能：控制刪除確認彈窗的顯示
  showDeleteModal = false;

  // 功能：暫存待刪除的問卷紀錄，用於彈窗顯示標題與確認刪除
  targetHistoryItem: SurveyHistory | null = null;

  constructor(
    private router: Router,
    private surveyService: SurveyService,
  ) {}

  ngOnInit(): void {
    // 原理：從 localStorage 讀取登入時存入的使用者資料，恢復會員資訊
    // 若未登入（沒有 currentUser），則維持元件預設值
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      this.editUser = { ...this.user };
    }

    // 初始化時立即從後端拉取填答歷史紀錄
    this.syncSurveysToHistory();
  }

  /**
   * 功能：向後端撈取目前登入會員的填答歷史清單
   * 原理：呼叫 getUserHistory(email) API，後端查詢 fillin 表找出該 email 曾填答的問卷
   *   並依據每份問卷的 endDate 判斷狀態（過期 or 已送出）
   */
  syncSurveysToHistory() {
    if (!this.user.email) return;

    this.surveyService.getUserHistory(this.user.email.trim()).subscribe({
      next: (res: any) => {
        // 後端回傳格式：{ code, message, quizList: [...] }
        const surveys = res.quizList ?? res ?? [];
        this.allHistories = surveys.map((s: any) => {
          return {
            id: s.id,
            title: s.title,
            type: s.type,
            filledDate: s.startDate ?? s.start_date,
            status: this.determineStatus(s),
            hasData: true,
          };
        });
      },
      error: (err) => {
        console.error('撈取歷史紀錄失敗', err);
        this.triggerToast('無法讀取填答紀錄，請稍後再試');
      },
    });
  }

  /**
   * 功能：根據問卷截止日判定該筆填答的狀態
   * 原理：比對今日與 endDate，過期就標記 expired，其餘預設為 submitted
   * 擴充方向：若後端支援暫存功能，可在此加入 draft 狀態的判斷邏輯
   */
  private determineStatus(s: any): 'submitted' | 'draft' | 'expired' {
    const now = new Date();
    const end = new Date(s.endDate);
    if (end < now) return 'expired';
    return 'submitted';
  }

  /**
   * 功能：根據紀錄狀態決定點擊按鈕後的行為
   * 原理：
   *   draft → 導向填寫頁繼續作答
   *   submitted / expired → 呼叫 getFeedback 取得該筆填答資料，跳轉至預覽頁唯讀檢視
   */
  handleAction(item: SurveyHistory) {
    if (item.status === 'draft') {
      this.router.navigate(['/surveys', item.id, 'question']);
    } else {
      this.surveyService.getFeedback(item.id, this.user.email).subscribe({
        next: (res: any) => {
          // 除錯用 log（確認後端回傳的資料結構與 code）
          console.log('feedback 傳入參數：', item.id, this.user.email);
          console.log('feedback res：', res);
          console.log('res.code type：', typeof res.code, res.code);

          if (res.code === 200) {
            // 原理：將後端回傳資料與 quizId、status 一起透過 router state 帶往預覽頁
            // quizId 需明確帶入，因為後端 FeedbackRes 中不一定包含此欄位
            this.router.navigate(['/surveys', item.id, 'preview'], {
              state: {
                data: {
                  ...res,
                  quizId: item.id,
                  status: item.status,
                },
              },
            });
          } else {
            this.triggerToast(res.message || '無法讀取資料');
          }
        },
        error: () => this.triggerToast('連線異常，無法檢視紀錄'),
      });
    }
  }

  /**
   * 功能：開啟刪除確認彈窗
   * 原理：將目標問卷紀錄存入 targetHistoryItem，彈窗中顯示標題供使用者確認
   */
  openDeleteModal(item: SurveyHistory) {
    this.targetHistoryItem = item;
    this.showDeleteModal = true;
  }

  /** 功能：關閉刪除彈窗並清空暫存目標 */
  closeDeleteModal() {
    this.showDeleteModal = false;
    this.targetHistoryItem = null;
  }

  /**
   * 功能：確認刪除後執行的方法
   * 原理：目前為前端本地刪除（filter 掉對應 id），不呼叫後端
   * 擴充方向：可改為呼叫後端 API 真正刪除 fillin 資料表中的記錄
   */
  confirmDelete() {
    if (this.targetHistoryItem) {
      this.allHistories = this.allHistories.filter(
        (h) => h.id !== this.targetHistoryItem!.id,
      );
      this.triggerToast('已成功刪除該筆問卷紀錄');
      this.closeDeleteModal();
    }
  }

  /**
   * 功能：依搜尋文字與狀態過濾器篩選後的總筆數陣列
   * 原理：getter 每次被模板存取時重新計算，確保即時響應篩選條件變化
   */
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

  /**
   * 功能：依目前頁碼切出要顯示的問卷紀錄（分頁邏輯）
   * 原理：從 filteredTotal 中根據 currentPage 與 pageSize 計算起始索引後切片
   */
  get paginatedHistories() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredTotal.slice(startIndex, startIndex + this.pageSize);
  }

  /**
   * 功能：計算總頁數並產生頁碼陣列（供模板 ngFor 渲染分頁按鈕）
   */
  get pageNumbers(): number[] {
    const total = Math.ceil(this.filteredTotal.length / this.pageSize);
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  /** 功能：顯示 Toast 提示，2.5 秒後自動消失 */
  triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 2500);
  }

  /** 功能：搜尋條件變更時重置回第一頁，避免顯示空白頁 */
  onSearchChange() {
    this.currentPage = 1;
  }

  /** 功能：切換至指定頁碼 */
  setPage(page: number) {
    this.currentPage = page;
  }

  /** 功能：返回問卷首頁 */
  goBack() {
    this.router.navigate(['/surveys']);
  }

  /**
   * 功能：切換個人資料的編輯模式開關
   * 原理：進入編輯時將 user 複製到 editUser，避免取消時直接污染原始資料
   */
  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.editUser = { ...this.user };
      // 重置密碼欄位與眼睛切換狀態
      this.passwordData = { current: '', new: '', confirm: '' };
      this.showCurrentPassword = false;
      this.showNewPassword = false;
      this.showConfirmPassword = false;
    }
  }

  /**
   * 功能：儲存個人資料變更
   * 原理：呼叫後端 update_profile API，成功後同步更新 localStorage 與本地 user 物件
   */
  saveProfile() {
    this.surveyService.updateUserProfile(this.editUser).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          this.user = { ...this.editUser };
          // 同步寫回 localStorage，確保重新整理後資料不遺失
          localStorage.setItem('currentUser', JSON.stringify(this.user));
          this.isEditing = false;
          this.triggerToast('個人資料已成功儲存');
        } else {
          this.triggerToast(res.message || '更新失敗');
        }
      },
      error: (err) => this.triggerToast('連線失敗，請檢查後端'),
    });
  }

  /**
   * 功能：修改密碼
   * 原理：前端先驗證三個欄位都有填寫、新密碼與確認密碼一致，
   *   再呼叫後端 change_password API 進行舊密碼驗證與更新
   */
  handlePasswordChange() {
    if (
      !this.passwordData.current ||
      !this.passwordData.new ||
      !this.passwordData.confirm
    ) {
      this.triggerToast('請填寫完整密碼欄位');
      return;
    }
    if (this.passwordData.new !== this.passwordData.confirm) {
      this.triggerToast('新密碼與確認密碼不符');
      return;
    }

    this.surveyService
      .changePassword(
        this.user.email,
        this.passwordData.current,
        this.passwordData.new,
      )
      .subscribe({
        next: (res: any) => {
          if (res.code === 200) {
            this.triggerToast('密碼已成功修改');
            this.passwordData = { current: '', new: '', confirm: '' };
            this.isEditing = false;
          } else {
            this.triggerToast(res.message || '密碼修改失敗');
          }
        },
        error: (err) => this.triggerToast('連線失敗，無法變更密碼'),
      });
  }

  /**
   * 功能：更換會員頭像
   * 原理：
   *   1. 動態建立 file input 觸發系統選檔視窗
   *   2. 選取後先用 FileReader 讀成 Base64 做本地即時預覽
   *   3. 同時以 FormData 上傳至後端 /upload_avatar
   *   4. 後端儲存後，更新 localStorage 以保持下次登入的頭像一致
   */
  changeAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // 前端限制上傳大小（5MB），避免 Base64 字串過長造成後端 DB 截斷錯誤
        if (file.size > 5 * 1024 * 1024) {
          this.triggerToast('圖片大小不能超過 5MB');
          return;
        }

        // 本地預覽：使用 FileReader 將圖片轉為 Base64 data URL 直接顯示
        const reader = new FileReader();
        reader.onload = (event: any) => {
          this.user.avatar = event.target.result;
          this.editUser.avatar = event.target.result;
        };
        reader.readAsDataURL(file);

        // 上傳至後端：使用 FormData 傳送原始 File 物件與 email
        this.surveyService.uploadAvatar(file, this.user.email).subscribe({
          next: (res: any) => {
            if (res.code === 200) {
              this.triggerToast('頭像已成功上傳');
              localStorage.setItem('currentUser', JSON.stringify(this.user));
            } else {
              this.triggerToast(res.message || '上傳失敗');
            }
          },
          error: (err) => {
            this.triggerToast('無法上傳頭像，請重試');
            console.error('Avatar upload failed:', err);
          },
        });
      }
    };
    // 觸發瀏覽器選檔視窗
    input.click();
  }

  /**
   * 功能：將 status 英文代碼轉為中文顯示標籤
   * 原理：switch 對應三種狀態值，供模板直接呼叫顯示
   */
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
