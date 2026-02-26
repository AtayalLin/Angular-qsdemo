import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Survey, SurveyService } from '../../survey.service'; // 匯入 Survey 介面與服務，功用：修正 TS2304 錯誤

export interface AdminQuestion {
  id: number;
  title: string;
  type: 'single' | 'multi' | 'text';
  options: string[];
  isRequired: boolean;
  // 擴充屬性
  maxSelectable?: number;   // 多選限制
  maxCharacters?: number;   // 簡答限制
  logicConfig?: {           // 單選邏輯
    triggerOption: string;
    targetId: number;
  };
}

@Component({
  selector: 'app-survey-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './survey-admin.component.html',
  styleUrl: './survey-admin.component.scss'
})
export class SurveyAdminComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private surveyService = inject(SurveyService); // 注入問卷服務以取得資料

  // 目前啟動的頁籤
  activeTab: 'survey' | 'questions' | 'feedback' | 'stats' = 'survey';
  adminSubStep: 'edit' | 'preview' = 'edit';

  // 問卷設定模型
  currentSurvey = {
    id: 0,            // 存儲問卷 ID
    title: '',
    type: '',
    description: '',
    startDate: '',
    endDate: ''
  };

  // --- [新增] 題目編輯相關變數 ---
  
  // 使用者個資收集設定 (功用：決定填寫頁面是否顯示並強制填寫)
  basicInfoConfig = {
    name: true,   // [決策] 預設啟用且必填
    phone: false, // 預設關閉
    email: false  // 預設關閉
  };

  // 動態題目列表
  questions: AdminQuestion[] = [];

  ngOnInit(): void {
    // 取得路由參數中的問卷 ID (若為編輯模式)
    this.route.queryParams.subscribe(params => {
      const id = +params['id']; // 將字串轉為數字
      if (id) {
        this.loadSurveyData(id);
      }
    });
  }

  /**
   * 載入特定問卷資料並進行格式轉換
   * 功用：將符合 MySQL 規格的資料轉化為編輯器專用的互動格式。
   */
  private loadSurveyData(id: number): void {
    this.surveyService.getSurveyById(id).subscribe((survey: Survey | undefined) => {
      if (survey) {
        // --- [功能實現：問卷說明自動填入規劃] ---
        // 說明：目前 Eclipse/MySQL 尚未定義 description 欄位，故先採用假資料顯示。
        // 未來若要接軌正式資料，只需調整下方賦值邏輯。
        const initialDescription = '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。';
        
        // 1. 映射問卷層級資料 (完全對齊 Eclipse 既有 JSON 格式)
        this.currentSurvey = {
          id: survey.id,
          title: survey.title,
          type: survey.type,
          
          /* ============================================================
             [問卷說明 - 資料讀取邏輯預留區]
             目前狀態：手動填入假資料說明 (initialDescription)
             未來狀態：解除下方註解並移除 initialDescription 以對接 MySQL
             ============================================================ */
          description: initialDescription, 
          // description: survey.description || '', // 未來對接 Eclipse 的正確基本類型與欄位格式
          
          startDate: survey.startDate,
          endDate: survey.endDate
        };

        // [新增] 模擬加載基本資料配置 (未來從 DB 讀取)
        this.basicInfoConfig = {
          name: true,
          phone: survey.id % 2 === 0, // 僅作示範：偶數 ID 開啟電話
          email: false
        };

        // 2. 映射題目層級資料 (對齊 MySQL 扁平化轉前端結構化邏輯)
        if (survey.questions && survey.questions.length > 0) {
          this.questions = survey.questions.map(q => {
            // 處理選項：若為字串則依分號拆分，若已是陣列則直接使用
            let decodedOptions: string[] = [];
            if (Array.isArray(q.options)) {
              decodedOptions = [...q.options];
            } else if (typeof q.options === 'string' && q.options) {
              decodedOptions = (q.options as string).split(';');
            } else {
              decodedOptions = q.type === 'text' ? [] : ['選項 1'];
            }

            const mappedQuest: AdminQuestion = {
              id: q.id,
              title: q.title,
              // 類型對齊：確保後端 'multi' 正確映射至前端 'multi'
              type: q.type === 'multiple' ? 'multi' : (q.type as any),
              options: decodedOptions,
              // [修正] 讀取資料庫中的必填狀態，若無則預設為 false
              isRequired: (q as any).isRequired ?? false 
            };

            // 針對特定題型載入預設限制
            if (mappedQuest.type === 'multi') mappedQuest.maxSelectable = decodedOptions.length;
            if (mappedQuest.type === 'text') mappedQuest.maxCharacters = 100;

            return mappedQuest;
          });
        }

        console.log(`問卷「${survey.title}」資料轉換完成，已自動填充至欄位並同步必填狀態。`);
      }
    });
  }

  /**
   * 切換頁籤
   */
  switchTab(tab: 'survey' | 'questions' | 'feedback' | 'stats'): void {
    this.activeTab = tab;
    this.adminSubStep = 'edit';
  }

  /**
   * 新增題目
   * 功用：根據類型產生卡片，[決策] 所有題目預設為「不必填」。
   */
  addQuestion(type: 'single' | 'multi' | 'text'): void {
    const newId = this.questions.length > 0 
      ? Math.max(...this.questions.map(q => q.id)) + 1 
      : 1;

    const newQuest: AdminQuestion = {
      id: newId,
      title: '',
      type: type,
      options: type === 'text' ? [] : ['選項 1'],
      isRequired: false // [決策] 預設為不必填
    };

    // 多選預設限制為 1
    if (type === 'multi') newQuest.maxSelectable = 1;
    // 簡答預設字數限制
    if (type === 'text') newQuest.maxCharacters = 100;

    this.questions.push(newQuest);
  }

  /**
   * 移除題目
   */
  removeQuestion(id: number): void {
    this.questions = this.questions.filter(q => q.id !== id);
  }

  /**
   * 新增選項 (單選/多選專用)
   */
  addOption(questIndex: number): void {
    this.questions[questIndex].options.push(`選項 ${this.questions[questIndex].options.length + 1}`);
  }

  /**
   * 移除選項
   */
  removeOption(questIndex: number, optIndex: number): void {
    if (this.questions[questIndex].options.length > 1) {
      this.questions[questIndex].options.splice(optIndex, 1);
    }
  }

  /**
   * 清除問卷設定表單
   */
  clearSurveySettings(): void {
    if (confirm('確定要清除所有填寫內容嗎？')) {
      // 補上 id 欄位，功用：修正 TS2741 錯誤
      this.currentSurvey = { id: 0, title: '', type: '', description: '', startDate: '', endDate: '' };
    }
  }

  /**
   * 進入預覽
   */
  goToPreview(): void {
    const { title, type, description, startDate, endDate } = this.currentSurvey;
    if (!title || !type || !description || !startDate || !endDate) {
      alert('請填寫所有必填欄位！');
      return;
    }
    this.adminSubStep = 'preview';
  }

  backToEdit(): void {
    this.adminSubStep = 'edit';
  }

  /**
   * 確認儲存 (目前為模擬)
   * 功用：未來將與後端 API 串接，目前僅顯示成功訊息。
   */
  confirmSave(): void {
    alert('問卷設定已確認！現在請開始編輯題目。');
    // 自動跳轉到第二個頁籤「題目編輯」
    this.activeTab = 'questions';
    this.adminSubStep = 'edit';
  }
}
