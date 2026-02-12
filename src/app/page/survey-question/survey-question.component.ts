import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyService, Survey } from '../../survey.service';

@Component({
  selector: 'app-survey-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // 注意：providers 通常在 AppModule 或 Service 本身宣告即可，
  // 若這裡重複宣告可能會導致 Service 變成多個實例(Instance)，共用數據會失效。
  templateUrl: './survey-question.component.html',
  styleUrl: './survey-question.component.scss',
})
export class SurveyQuestionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  id: string | null = null;
  isSubmitting = false;
  surveyData?: Survey;

  showModal = false;
  modalStep: 'confirm' | 'thanks' = 'confirm';
  tempAnswers: any = null;

  userInfo = {
    name: '',
    phone: '',
    email: '',
  };

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id = routeId;

    if (routeId) {
      this.surveyService.getSurveyById(Number(routeId)).subscribe({
        next: (result) => {
          this.surveyData = result;
        },
        error: (err) => console.error('抓取問卷失敗', err),
      });
    }

    const navigation = this.router.getCurrentNavigation();
    const previousData = navigation?.extras.state?.['data'];
    if (previousData && previousData.userInfo) {
      this.userInfo = previousData.userInfo;
    }
  }

  /**
   * 1. 提交按鈕觸發：進行驗證並彈出「確認視窗」
   */
  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.surveyData || !this.surveyData.questions) return;

    // 前端驗證：聯絡資訊
    if (!this.userInfo.name || !this.userInfo.phone || !this.userInfo.email) {
      alert('請填寫完整聯絡人資訊');
      return;
    }

    // [新增] 檢查答案必填邏輯 (可視需求加入)

    // 先收集數據並暫存
    this.tempAnswers = this.collectAnswers();

    // 進入確認步驟
    this.modalStep = 'confirm';
    this.showModal = true;
  }

  /**
   * 2. 在 Modal 中點擊「確認送出」
   * 若要測試「存入資料庫」，應在此處呼叫 service.importMockDataToDatabase()
   */
  finalSubmit() {
    this.isSubmitting = true;

    // 模擬 API 傳輸延遲
    setTimeout(() => {
      this.isSubmitting = false;
      this.modalStep = 'thanks';

      // 自動執行導向邏輯
      setTimeout(() => {
        this.goToPreview();
      }, 1500);
    }, 800);
  }

  /**
   * 3. 最終導向預覽頁
   */
  goToPreview() {
    this.showModal = false;
    this.surveyService.setUserInfo(this.userInfo);
    this.router.navigate(['/surveys', this.id, 'preview'], {
      state: { data: this.tempAnswers },
    });
  }

  /**
   * 輔助方法：統一收集所有答案
   * 注意：此處抓取的是 DOM 裡面的使用者填寫內容
   */
  private collectAnswers() {
    if (!this.surveyData || !this.surveyData.questions) {
      return {};
    }

    const answers: any = {
      id: this.id,
      title: this.surveyData.title,
      userInfo: { ...this.userInfo },
    };

    this.surveyData.questions.forEach((q) => {
      const inputName = 'q' + q.id;
      // [修正對照] 这里的 q.type 必须跟 SurveyService 的假資料 type 一致
      if (q.type === 'single') {
        answers[inputName] =
          (
            document.querySelector(
              `input[name="${inputName}"]:checked`,
            ) as HTMLInputElement
          )?.value || '';
      } else if (q.type === 'multiple') {
        // 多選題邏輯
        answers[inputName] = Array.from(
          document.querySelectorAll(`input[name="${inputName}"]:checked`),
        ).map((el) => (el as HTMLInputElement).value);
      } else if (q.type === 'text') {
        answers[inputName] =
          (
            document.querySelector(
              `textarea[name="${inputName}"]`,
            ) as HTMLTextAreaElement
          )?.value || '';
      }
    });
    return answers;
  }

  onSaveDraft() {
    alert('問卷已暫存');
  }

  goBack() {
    this.router.navigate(['/surveys']);
  }

  // 顏色 CSS Class 邏輯保持不變
  getQ1ColorClass(index: number): string {
    const classes = [
      'ps-color',
      'xbox-color',
      'switch-color',
      'pc-color',
      'mobile-color',
    ];
    return classes[index] || 'color-q2';
  }
}
