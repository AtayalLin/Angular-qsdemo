// survey-question.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyService } from '../../survey.service';

@Component({
  selector: 'app-survey-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-question.component.html',
  styleUrl: './survey-question.component.scss',
})
export class SurveyQuestionComponent implements OnInit {
  isLoading = true; // ← 這行必須存在
  loadError = false; // ← 這行必須存在
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  id: string | null = null;
  isSubmitting = false;
  surveyData: any = null;

  showModal = false;
  modalStep: 'confirm' | 'thanks' = 'confirm';
  tempAnswers: any = null;
  answers: any = {};

  userInfo = { name: '', phone: '', email: '', age: 0 };

  basicInfoConfig = {
    name: false,
    phone: false,
    email: false,
    requireAge: false,
  };

  get visibleProjectCount(): number {
    return Object.values(this.basicInfoConfig).filter((v) => v).length;
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id = routeId;

    // 恢復從預覽頁返回的狀態
    const nav = this.router.getCurrentNavigation();
    const previousData = nav?.extras.state?.['data'];
    if (previousData) {
      if (previousData.userInfo) this.userInfo = previousData.userInfo;
      Object.keys(previousData).forEach((key) => {
        if (key.startsWith('q')) this.answers[key] = previousData[key];
      });
    }

    if (routeId) {
      this.surveyService.getSurveyById(Number(routeId)).subscribe({
        next: (result: any) => {
          console.log('API 回傳原始資料：', result);
          this.isLoading = false;

          // ✅ 後端回傳 { code, message, questionList }，沒有包 quiz 物件
          // 所以從 questionList 第一筆取 quiz_id，再去比對已知問卷資訊
          if (result?.code !== 200) {
            console.error('API 回傳失敗：', result);
            this.loadError = true;
            return;
          }

          const questionList =
            result?.questionList ??
            result?.QuestionList ??
            result?.questions ??
            [];

          // ✅ 改用兩支 API：先呼叫 getAll 取問卷基本資料
          this.surveyService.getSurveys().subscribe({
            next: (allRes: any) => {
              console.log('getAll 回傳：', allRes);
              const allQuizzes: any[] =
                allRes?.quizList ?? allRes?.QuizList ?? allRes?.data ?? [];

              const quizId = Number(this.id);
              const qz = allQuizzes.find((q: any) => q.id === quizId);

              if (!qz) {
                console.error('找不到問卷基本資料，quizId:', quizId);
                this.loadError = true;
                return;
              }

              const isPublished = qz.published ?? qz.is_published ?? false;
              if (!isPublished) {
                alert('此問卷尚未發佈，敬請稍候');
                this.router.navigate(['/surveys']);
                return;
              }

              const endDateStr = qz.end_date ?? qz.endDate;
              if (endDateStr && new Date(endDateStr) < new Date()) {
                alert('此問卷已過期，無法填寫');
                this.router.navigate(['/surveys']);
                return;
              }

              this.surveyData = {
                id: qz.id,
                title: qz.title ?? '未命名問卷',
                description: qz.intro ?? qz.description ?? '',
                startDate: qz.start_date ?? qz.startDate,
                endDate: qz.end_date ?? qz.endDate,
                questions: questionList.map((q: any) => ({
                  id: q.question_id ?? q.id,
                  title: q.question ?? q.title,
                  type:
                    q.type === 'multiple' || q.type === 'multi'
                      ? 'multiple'
                      : q.type === 'single'
                        ? 'single'
                        : 'text',
                  options: q.options
                    ? q.options
                        .split(';')
                        .map((o: string) => o.trim())
                        .filter(Boolean)
                    : [],
                  isRequired: q.required ?? q.isRequired ?? false,
                  isDependent: q.is_dependent ?? q.isDependent ?? false,
                  parentId: q.parent_id ?? q.parentId ?? null,
                })),
              };

              this.basicInfoConfig = {
                name: qz.collect_name ?? qz.collectName ?? false,
                phone: qz.collect_phone ?? qz.collectPhone ?? false,
                email: qz.collect_email ?? qz.collectEmail ?? false,
                requireAge: qz.require_age ?? qz.requireAge ?? false,
              };
            },
            error: () => {
              this.loadError = true;
            },
          });
        },
        error: (err) => {
          console.error('抓取問卷失敗', err);
          this.isLoading = false;
          this.loadError = true;
        },
      });
    }
  }

  isOptionChecked(questId: number, option: string): boolean {
    const ans = this.answers['q' + questId];
    if (!ans) return false;
    return Array.isArray(ans) ? ans.includes(option) : ans === option;
  }

  getTextValue(questId: number): string {
    return this.answers['q' + questId] || '';
  }

  isQuestionDisabled(q: any): boolean {
    if (!q.isDependent || !q.parentId) return false;
    const parentAnswer = this.answers['q' + q.parentId];
    const hasValue = Array.isArray(parentAnswer)
      ? parentAnswer.length > 0
      : !!parentAnswer && String(parentAnswer).trim() !== '';
    return !hasValue;
  }

  onAnswerChange(questId: number, event: any, type: string): void {
    const key = 'q' + questId;
    if (type === 'single' || type === 'text') {
      this.answers[key] = event.target.value;
    } else if (type === 'multiple') {
      this.answers[key] = Array.from(
        document.querySelectorAll(`input[name="${key}"]:checked`),
      ).map((el: any) => el.value);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.surveyData) return;

    if (this.basicInfoConfig.name && !this.userInfo.name.trim()) {
      alert('請填寫姓名');
      return;
    }
    if (this.basicInfoConfig.phone && !this.userInfo.phone.trim()) {
      alert('請填寫電話');
      return;
    }
    if (this.basicInfoConfig.email && !this.userInfo.email.trim()) {
      alert('請填寫信箱');
      return;
    }

    // 必填題檢查
    for (const q of this.surveyData.questions) {
      if (q.isRequired && !this.isQuestionDisabled(q)) {
        const ans = this.answers['q' + q.id];
        const empty =
          !ans ||
          (Array.isArray(ans) ? ans.length === 0 : String(ans).trim() === '');
        if (empty) {
          alert(`第 ${q.id} 題為必填，請完成後再送出`);
          return;
        }
      }
    }

    this.tempAnswers = this.collectAnswers();
    this.modalStep = 'confirm';
    this.showModal = true;
  }

  finalSubmit(): void {
    this.goToPreview();
  }

  goToPreview(): void {
    this.showModal = false;
    this.surveyService.setUserInfo(this.userInfo);

    // ✅ 同時帶入 q1, q2... 格式供返回時恢復，以及 answerVoList 供送出用
    const stateData = {
      ...this.tempAnswers, // quizId, email, name, phone, age, answerVoList
      ...this.answers, // ✅ 補上 q1, q2... 格式的答案
      userInfo: { ...this.userInfo },
      status: 'previewing',
    };

    this.router.navigate(['/surveys', this.id, 'preview'], {
      state: { data: stateData },
    });
  }

  goBack(): void {
    this.router.navigate(['/surveys']);
  }

  private collectAnswers(): any {
    const answerVoList =
      this.surveyData?.questions.map((q: any) => {
        const key = 'q' + q.id;
        const raw = this.answers[key]; // ✅ 從 answers 物件讀，不從 DOM 抓

        let answer = '';
        if (Array.isArray(raw)) {
          answer = raw.join(';');
        } else if (raw !== undefined && raw !== null) {
          answer = String(raw);
        }

        return {
          question: {
            quiz_id: Number(this.id),
            question_id: q.id,
            question: q.title,
            type: q.type === 'multiple' ? 'multi' : q.type,
            required: q.isRequired,
            options: q.options?.join(';') || '',
            is_dependent: q.isDependent,
            parent_id: q.parentId ?? null,
          },
          answer: answer,
        };
      }) ?? [];

    return {
      quizId: Number(this.id),
      email: this.userInfo.email,
      name: this.userInfo.name,
      phone: this.userInfo.phone,
      age: this.userInfo.age ?? 0,
      answerVoList: answerVoList,
    };
  }
}
