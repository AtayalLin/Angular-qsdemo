import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Survey, SurveyService } from '../../survey.service'; // 匯入 Survey 介面與服務

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
  private router = inject(Router); 
  private surveyService = inject(SurveyService); 

  // 目前啟動的頁籤
  activeTab: 'survey' | 'questions' | 'feedback' | 'stats' = 'survey';
  adminSubStep: 'edit' | 'preview' = 'edit';

  // 問卷設定模型
  currentSurvey = {
    id: 0,
    title: '',
    type: '',
    description: '',
    startDate: '',
    endDate: ''
  };

  // --- 題目編輯相關變數 ---
  basicInfoConfig = {
    name: true,   // 預設姓名為必填
    phone: false,
    email: false
  };

  // 動態題目列表
  questions: AdminQuestion[] = [];

  // 待處理工作台問卷清單
  draftSurveys: Survey[] = [];

  ngOnInit(): void {
    // 1. 取得路由參數中的問卷 ID (若為編輯模式)
    this.route.queryParams.subscribe(params => {
      const id = +params['id']; 
      if (id) {
        this.loadSurveyData(id);
      }
    });

    // 2. 載入工作台資料
    this.refreshWorkstation();
  }

  /**
   * 重新整理工作台列表
   */
  refreshWorkstation(): void {
    this.surveyService.getSurveys().subscribe(list => {
      this.draftSurveys = list.filter(s => s.publishStatus !== '已發佈');
    });
  }

  /**
   * 工作台載入編輯方法
   */
  loadEdit(id: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: id },
      queryParamsHandling: 'merge'
    });
    this.loadSurveyData(id);
    this.activeTab = 'survey';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 載入特定問卷資料並進行格式轉換 (DB -> UI)
   */
  private loadSurveyData(id: number): void {
    this.surveyService.getSurveyById(id).subscribe((survey: Survey | undefined) => {
      if (survey) {
        const initialDescription = survey.description || '請分享您的看法，我們將依據回饋打造更好的體驗。';
        this.currentSurvey = {
          id: survey.id,
          title: survey.title,
          type: survey.type,
          description: initialDescription, 
          startDate: survey.startDate,
          endDate: survey.endDate
        };

        // 模擬基本資料配置
        this.basicInfoConfig = {
          name: true,
          phone: survey.id % 2 === 0,
          email: survey.id === 6
        };

        if (survey.questions && survey.questions.length > 0) {
          this.questions = survey.questions.map(q => {
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
              type: q.type === 'multiple' ? 'multi' : (q.type as any),
              options: decodedOptions,
              isRequired: (q as any).isRequired ?? false 
            };

            if (mappedQuest.type === 'multi') mappedQuest.maxSelectable = decodedOptions.length;
            if (mappedQuest.type === 'text') mappedQuest.maxCharacters = 100;

            return mappedQuest;
          });
        }
      }
    });
  }

  switchTab(tab: 'survey' | 'questions' | 'feedback' | 'stats'): void {
    this.activeTab = tab;
    this.adminSubStep = 'edit';
  }

  addQuestion(type: 'single' | 'multi' | 'text'): void {
    const newId = this.questions.length > 0 ? Math.max(...this.questions.map(q => q.id)) + 1 : 1;
    const newQuest: AdminQuestion = {
      id: newId,
      title: '',
      type: type,
      options: type === 'text' ? [] : ['選項 1'],
      isRequired: false 
    };
    if (type === 'multi') newQuest.maxSelectable = 1;
    if (type === 'text') newQuest.maxCharacters = 100;
    this.questions.push(newQuest);
  }

  removeQuestion(id: number): void {
    this.questions = this.questions.filter(q => q.id !== id);
  }

  addOption(questIndex: number): void {
    this.questions[questIndex].options.push(`選項 ${this.questions[questIndex].options.length + 1}`);
  }

  removeOption(questIndex: number, optIndex: number): void {
    if (this.questions[questIndex].options.length > 1) {
      this.questions[questIndex].options.splice(optIndex, 1);
    }
  }

  clearSurveySettings(): void {
    if (confirm('確定要清除所有填寫內容嗎？')) {
      this.currentSurvey = { id: 0, title: '', type: '', description: '', startDate: '', endDate: '' };
    }
  }

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
   * 執行出庫資料序列化並模擬儲存 (UI -> DB)
   * 功用：將編輯器中的結構化資料，轉換回符合 MySQL 與 Eclipse 規範的 JSON 格式。
   */
  confirmSave(): void {
    // 1. 執行出庫轉換 (Serialization)
    const payload = {
      id: this.currentSurvey.id,
      title: this.currentSurvey.title,
      description: this.currentSurvey.type, // 映射邏輯：類型存入 description
      intro: this.currentSurvey.description, // 詳細說明
      startDate: this.currentSurvey.startDate,
      endDate: this.currentSurvey.endDate,
      
      // 轉換基本資料配置為 JSON 字串
      basic_info_config: JSON.stringify(this.basicInfoConfig),
      
      // 轉換題目列表
      questionsList: this.questions.map(q => ({
        question_id: q.id,
        question: q.title,
        type: q.type === 'multi' ? 'multiple' : q.type,
        is_required: q.isRequired,
        options: q.options ? q.options.join(';') : '',
        max_selectable: q.maxSelectable || null,
        max_characters: q.maxCharacters || null
      }))
    };

    console.log('--- [Eclipse/MySQL 對接 Payload 輸出] ---');
    console.log(payload);
    console.log('------------------------------------------');

    alert('問卷資料已成功序列化！格式已對齊 MySQL 規範，請查看控制台 (F12) 的輸出內容。');
    
    this.activeTab = 'questions';
    this.adminSubStep = 'edit';
  }
}
