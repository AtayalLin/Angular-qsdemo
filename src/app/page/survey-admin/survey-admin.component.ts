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
  isDependent: boolean;
  parentId: number | null;
  maxSelectable?: number;
  maxCharacters?: number;
}

@Component({
  selector: 'app-survey-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './survey-admin.component.html',
  styleUrl: './survey-admin.component.scss',
})
export class SurveyAdminComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  activeTab: 'survey' | 'questions' | 'feedback' | 'stats' = 'survey';
  adminSubStep: 'edit' | 'preview' = 'edit';

  currentSurvey = {
    id: 0,
    title: '',
    type: '',
    description: '',
    startDate: '',
    endDate: '',
    published: false,
  };
  basicInfoConfig = {
    name: true,
    phone: false,
    email: false,
    requireAge: false,
  };
  questions: AdminQuestion[] = [];
  draftSurveys: Survey[] = [];

  ngOnInit(): void {
    // 檢查是否從survey-list通過state傳遞問卷資訊
    const navigation = this.router.getCurrentNavigation();
    const editSurvey = navigation?.extras.state?.['survey'];

    this.route.queryParams.subscribe((params) => {
      const id = +params['id'];
      if (id) {
        this.loadSurveyData(id, editSurvey);
      }
    });
    this.refreshWorkstation();
  }

  refreshWorkstation(): void {
    this.surveyService.getSurveys().subscribe((res: any) => {
      // [修正] 處理後端回傳的 GetQuizRes 物件
      const list = res.quizList || [];
      this.draftSurveys = list.filter((s: any) => !s.published);
    });
  }

  loadEdit(id: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: id },
      queryParamsHandling: 'merge',
    });
    this.loadSurveyData(id);
    this.activeTab = 'survey';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private loadSurveyData(id: number, preloadedSurvey?: any): void {
    // 1. 先從列表獲取問卷基本資訊
    this.surveyService.getSurveys().subscribe((res: any) => {
      const allSurveys = res.quizList || [];
      let found = allSurveys.find((s: any) => s.id === id);

      // 如果有預加載的問卷資訊，優先使用
      if (preloadedSurvey) {
        found = preloadedSurvey;
      }

      if (found) {
        this.currentSurvey = {
          id: found.id,
          title: found.title,
          type: found.type,
          description: found.intro || found.description || '',
          startDate: found.start_date || found.startDate,
          endDate: found.end_date || found.endDate,
          published: found.is_published || found.published,
        };

        // 同步個資收集設定
        this.basicInfoConfig = {
          name: found.collectName ?? true,
          phone: found.collectPhone ?? false,
          email: found.collectEmail ?? false,
          requireAge: found.require_age ?? found.requireAge ?? false,
        };

        // 2. 接著抓取題目詳情
        this.surveyService.getSurveyById(id).subscribe((qRes: any) => {
          const qList = qRes.questionList || [];
          this.questions = qList.map((q: any) => ({
            id: q.question_id || q.id,
            title: q.question || q.title,
            type: q.type === 'multiple' ? 'multi' : q.type,
            options: q.options ? q.options.split(';') : [],
            isRequired: q.required !== undefined ? q.required : q.isRequired,
            isDependent: q.is_dependent || q.isDependent || false,
            parentId: q.parent_id || q.parentId || null,
          }));
        });
      }
    });
  }

  toggleDependency(index: number): void {
    const q = this.questions[index];
    if (q.isDependent) q.isRequired = false;
    else q.parentId = null;
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
    const newId =
      this.questions.length > 0
        ? Math.max(...this.questions.map((q) => q.id)) + 1
        : 1;
    this.questions.push({
      id: newId,
      title: '',
      type: type,
      options: type === 'text' ? [] : ['選項 1'],
      isRequired: false,
      isDependent: false,
      parentId: null,
    });
  }

  removeQuestion(id: number): void {
    this.questions = this.questions.filter((q) => q.id !== id);
  }
  addOption(i: number): void {
    this.questions[i].options.push(
      `選項 ${this.questions[i].options.length + 1}`,
    );
  }
  removeOption(i: number, oi: number): void {
    if (this.questions[i].options.length > 1)
      this.questions[i].options.splice(oi, 1);
  }
  switchTab(t: any): void {
    this.activeTab = t;
    this.adminSubStep = 'edit';
  }
  clearSurveySettings(): void {
    if (confirm('確定清除？'))
      this.currentSurvey = {
        id: 0,
        title: '',
        type: '',
        description: '',
        startDate: '',
        endDate: '',
        published: false,
      };
  }
  goToPreview(): void {
    if (!this.currentSurvey.title) return alert('請填寫標題');
    this.adminSubStep = 'preview';
  }
  backToEdit(): void {
    this.adminSubStep = 'edit';
  }

  confirmSave(): void {
    if (!this.currentSurvey.title) return alert('請填寫問卷標題');
    if (!this.currentSurvey.description) return alert('請填寫問卷說明');
    if (this.questions.length === 0) return alert('請至少新增一個題目');

    const formattedQuestions = this.questions.map((q) => ({
      quiz_id: Number(this.currentSurvey.id) || 0,
      question_id: Number(q.id),
      question: q.title,
      type: q.type === 'multi' ? 'multi' : q.type,
      required: q.isRequired,
      options: q.options.join(';'),
      is_dependent: q.isDependent,
      parent_id: q.parentId ? Number(q.parentId) : null,
    }));

    const payload = {
      id: Number(this.currentSurvey.id) || 0,
      title: this.currentSurvey.title,
      type: this.currentSurvey.type,
      description: this.currentSurvey.description,
      startDate: this.currentSurvey.startDate,
      endDate: this.currentSurvey.endDate,
      is_published: this.currentSurvey.published, // 動態發佈狀態
      collectName: this.basicInfoConfig.name,
      collectPhone: this.basicInfoConfig.phone,
      collectEmail: this.basicInfoConfig.email,
      requireAge: this.basicInfoConfig.requireAge,
      questionsList: formattedQuestions,
    };

    const request =
      Number(this.currentSurvey.id) > 0
        ? this.surveyService.updateSurvey(payload)
        : this.surveyService.createSurvey(payload);

    request.subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          alert('問卷已成功儲存至 MySQL！');
          this.router.navigate(['/surveys']);
        } else {
          alert(`儲存失敗: ${res.message}`);
        }
      },
      error: (err) => alert('儲存失敗，請檢查後端連線'),
    });
  }
}
