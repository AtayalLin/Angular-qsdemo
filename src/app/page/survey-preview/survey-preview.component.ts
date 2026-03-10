import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SurveyService } from '../../survey.service';

@Component({
  selector: 'app-survey-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-preview.component.html',
  styleUrl: './survey-preview.component.scss',
})
export class SurveyPreviewComponent implements OnInit {
  previewData: any;
  surveyStructure: any;
  showToast = false;
  toastMsg = '';
  isReadOnly = false;

  constructor(
    private router: Router,
    private surveyService: SurveyService,
  ) {}

  ngOnInit(): void {
    const navigation = window.history.state;
    if (navigation && navigation.data) {
      this.previewData = navigation.data;
      console.log('answerVoList：', this.previewData?.answerVoList);
      console.log('previewData 完整內容：', this.previewData); // ✅ 除錯用

      if (
        this.previewData.status === 'submitted' ||
        this.previewData.status === 'expired'
      ) {
        this.isReadOnly = true;
      }

      const quizId = this.previewData.quizId ?? this.previewData.id; // ✅ quizId 優先
      console.log('預覽頁 quizId：', quizId); // ✅ 除錯用

      if (quizId) {
        this.surveyService.getSurveys().subscribe((allRes: any) => {
          console.log('preview getSurveys 回傳：', allRes); // ✅ 除錯用
          const allQuizzes = allRes?.quizList ?? [];
          const qz = allQuizzes.find((q: any) => q.id === Number(quizId));
          console.log('找到的 qz：', qz); // ✅ 除錯用

          this.surveyService.getSurveyById(Number(quizId)).subscribe({
            next: (res: any) => {
              console.log('preview getSurveyById 回傳：', res); // ✅ 除錯用
              const questionList = res?.questionList ?? [];
              this.surveyStructure = {
                id: qz?.id ?? quizId,
                title: qz?.title ?? '問卷預覽',
                description: qz?.intro ?? qz?.description ?? '',
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
                })),
              };
              console.log('surveyStructure 組好了：', this.surveyStructure); // ✅ 除錯用
            },
            error: (err) => console.error('預覽模式獲取結構失敗', err),
          });
        });
      }
    }

    if (!this.previewData) {
      this.triggerToast('無有效預覽資料');
    }
  }

  isOptionSelected(questId: number, option: string): boolean {
    if (!this.previewData) return false;

    // 優先從 q1, q2... 格式找
    const key = 'q' + questId;
    const directAnswer = this.previewData[key];
    if (
      directAnswer !== undefined &&
      directAnswer !== null &&
      directAnswer !== ''
    ) {
      return this.matchAnswer(directAnswer, option);
    }

    // 從 answerVoList 找
    const answerVoList: any[] = this.previewData?.answerVoList ?? [];
    const vo = answerVoList.find(
      (a: any) => (a.question?.question_id ?? a.question?.id) === questId,
    );
    if (!vo) return false;

    return this.matchAnswer(vo.answer, option);
  }

  private matchAnswer(answer: any, option: string): boolean {
    if (answer === undefined || answer === null || answer === '') return false;
    if (Array.isArray(answer)) {
      return answer.some((a) => String(a).trim() === option.trim());
    }
    if (typeof answer === 'string') {
      if (answer.includes(';')) {
        return answer
          .split(';')
          .map((s) => s.trim())
          .includes(option.trim());
      }
      return answer.trim() === option.trim();
    }
    return String(answer).trim() === option.trim();
  }

  getTextAnswer(questId: number): string {
    const key = 'q' + questId;
    if (this.previewData?.[key]) return this.previewData[key];

    const answerVoList: any[] = this.previewData?.answerVoList ?? [];
    const vo = answerVoList.find(
      (a: any) => (a.question?.question_id ?? a.question?.id) === questId,
    );
    return vo?.answer ?? '';
  }

  triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }

  goBack() {
    if (this.isReadOnly) {
      this.router.navigate(['/member']);
    } else {
      const quizId = this.previewData?.quizId ?? this.previewData?.id;
      this.router.navigate(['/surveys', quizId, 'question'], {
        state: { data: this.previewData },
      });
    }
  }

  isSubmitting = false;
  submitSurvey() {
    if (this.isReadOnly || this.isSubmitting) return;
    this.isSubmitting = true;

    this.surveyService.submitFillin(this.previewData).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          alert('問卷已成功送出！');
          this.router.navigate(['/surveys']);
        } else {
          alert(res.message || '送出失敗');
        }
      },
      error: (err) => alert('連線異常，請稍後再試'),
    });
  }
}
