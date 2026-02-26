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

  // --- 題目編輯相關變數 ---
  
  // 使用者個資收集設定 (必填)
  basicInfoConfig = {
    name: true,
    phone: false,
    email: false
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
   * 載入特定問卷資料
   * 功用：從 Service 取得資料並填充至編輯模型中。
   */
  private loadSurveyData(id: number): void {
    this.surveyService.getSurveyById(id).subscribe((survey: Survey | undefined) => { // 指定回傳型別，功用：修正 TS7006 錯誤
      if (survey) {
        this.currentSurvey = {
          id: survey.id,
          title: survey.title,
          type: survey.type,
          description: '', // 假資料目前無說明，預留空值
          startDate: survey.startDate,
          endDate: survey.endDate
        };
        // 若問卷已有題目，也一併載入 (目前先初始化空陣列)
        this.questions = []; 
        console.log(`已載入問卷：${survey.title}`);
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
   * 功用：根據類型產生初始化的題目卡片。
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
      isRequired: true
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

  confirmSave(): void {
    alert('問卷設定已確認！現在請開始編輯題目。');
    this.activeTab = 'questions';
    this.adminSubStep = 'edit';
  }
}
