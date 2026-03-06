import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Survey, SurveyService } from '../../survey.service';

export interface AdminQuestion {
  id: number;
  title: string;
  type: 'single' | 'multi' | 'text';
  options: string[];
  isRequired: boolean;
  // --- 承上題擴充欄位 ---
  isDependent: boolean;     // [新增] 是否為承上題
  parentId: number | null;  // [新增] 依賴的父題目 ID
  maxSelectable?: number;
  maxCharacters?: number;
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

  activeTab: 'survey' | 'questions' | 'feedback' | 'stats' = 'survey';
  adminSubStep: 'edit' | 'preview' = 'edit';

  currentSurvey = { id: 0, title: '', type: '', description: '', startDate: '', endDate: '' };
  basicInfoConfig = { name: true, phone: false, email: false };
  questions: AdminQuestion[] = [];
  draftSurveys: Survey[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const id = +params['id']; 
      if (id) { this.loadSurveyData(id); }
    });
    this.refreshWorkstation();
  }

  refreshWorkstation(): void {
    this.surveyService.getSurveys().subscribe(list => {
      this.draftSurveys = list.filter(s => s.publishStatus !== '已發佈');
    });
  }

  loadEdit(id: number): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { id: id }, queryParamsHandling: 'merge' });
    this.loadSurveyData(id);
    this.activeTab = 'survey';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadSurveyData(id: number): void {
    this.surveyService.getSurveyById(id).subscribe((survey: Survey | undefined) => {
      if (survey) {
        this.currentSurvey = {
          id: survey.id,
          title: survey.title,
          type: survey.type,
          description: survey.description || '請分享您的看法，我們將依據回饋打造更好的體驗。', 
          startDate: survey.startDate,
          endDate: survey.endDate
        };

        if (survey.questions && survey.questions.length > 0) {
          this.questions = survey.questions.map(q => ({
            id: q.id,
            title: q.title,
            type: q.type === 'multiple' ? 'multi' : (q.type as any),
            options: Array.isArray(q.options) ? [...q.options] : (typeof q.options === 'string' ? (q.options as string).split(';') : []),
            isRequired: (q as any).isRequired ?? false,
            // [補全] 載入時初始化承上題狀態
            isDependent: (q as any).isDependent ?? false,
            parentId: (q as any).parentId ?? null
          }));
        }
      }
    });
  }

  /**
   * 切換承上題勾選狀態
   * 功用：實作防呆互斥邏輯。勾選承上題時，強制取消必填並禁用該選項。
   */
  toggleDependency(index: number): void {
    const q = this.questions[index];
    if (q.isDependent) {
      q.isRequired = false; // 強制設為不必填
    } else {
      q.parentId = null;    // 取消勾選時清除關聯
    }
  }

  moveQuestion(index: number, direction: number): void {
    const targetIndex = index + direction;
    if (targetIndex >= 0 && targetIndex < this.questions.length) {
      const temp = this.questions[index];
      this.questions[index] = this.questions[targetIndex];
      this.questions[targetIndex] = temp;
    }
  }

  addQuestion(type: 'single' | 'multi' | 'text'): void {
    const newId = this.questions.length > 0 ? Math.max(...this.questions.map(q => q.id)) + 1 : 1;
    this.questions.push({
      id: newId,
      title: '',
      type: type,
      options: type === 'text' ? [] : ['選項 1'],
      isRequired: false,
      isDependent: false, // 預設非承上題
      parentId: null
    });
  }

  removeQuestion(id: number): void { this.questions = this.questions.filter(q => q.id !== id); }
  addOption(i: number): void { this.questions[i].options.push(`選項 ${this.questions[i].options.length + 1}`); }
  removeOption(i: number, oi: number): void { if (this.questions[i].options.length > 1) this.questions[i].options.splice(oi, 1); }
  switchTab(t: any): void { this.activeTab = t; this.adminSubStep = 'edit'; }
  clearSurveySettings(): void { if (confirm('確定清除？')) this.currentSurvey = { id: 0, title: '', type: '', description: '', startDate: '', endDate: '' }; }
  goToPreview(): void { if (!this.currentSurvey.title) return alert('請填寫標題'); this.adminSubStep = 'preview'; }
  backToEdit(): void { this.adminSubStep = 'edit'; }

  confirmSave(): void {
    if (!this.currentSurvey.title) return alert('請填寫問卷標題');

    // [修正] 建構符合 Java CreateReq.java 結構的 Payload
    const payload = {
      id: this.currentSurvey.id,
      title: this.currentSurvey.title,
      type: this.currentSurvey.type,
      description: this.currentSurvey.description,
      startDate: this.currentSurvey.startDate,
      endDate: this.currentSurvey.endDate,
      // 對齊 @JsonProperty("is_published")
      is_published: true, 
      // 對齊 @JsonProperty("collectName") 等個資開關
      collectName: this.basicInfoConfig.name,
      collectPhone: this.basicInfoConfig.phone,
      collectEmail: this.basicInfoConfig.email,
      // 對齊 @JsonProperty("questionsList")
      questionsList: this.questions.map(q => ({
        question_id: q.id, // 對應 Java Questions.java 的 question_id
        question: q.title, // 對應 Java Questions.java 的 question
        type: q.type === 'multi' ? 'multiple' : q.type,
        is_required: q.isRequired,
        options: q.options.join(';'),
        is_dependent: q.isDependent,
        parent_id: q.parentId
      }))
    };

    console.log('--- 傳送至後端 Payload ---', payload);

    // 根據是否有 ID 判定是建立還是更新
    const request = this.currentSurvey.id ? 
      this.surveyService.updateSurvey(payload) : 
      this.surveyService.createSurvey(payload);

    request.subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          alert('問卷已成功儲存至資料庫！');
          this.router.navigate(['/surveys']);
        } else {
          alert(res.message || '儲存失敗');
        }
      },
      error: (err) => alert('連線 Eclipse 失敗，請檢查後端是否啟動')
    });
  }
}
