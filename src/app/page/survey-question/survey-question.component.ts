import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SurveyService, Survey } from '../../survey.service';

@Component({
  selector: 'app-survey-question',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-question.component.html',
  styleUrl: './survey-question.component.scss',
})
export class SurveyQuestionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  id: string | null = null;
  isSubmitting = false;
  surveyData: any; // [修正] 使用 any 以解決範本中 description 屬性的辨識錯誤

  showModal = false;
  modalStep: 'confirm' | 'thanks' = 'confirm';
  tempAnswers: any = null;
  answers: any = {}; // [補上] 宣告 answers 屬性，用於追蹤即時答題狀態以支援承上題邏輯

  userInfo = {
    name: '',
    phone: '',
    email: '',
  };

  // [關鍵屬性] 基本資料動態配置，功用：由管理者設定決定填寫頁面顯示哪些欄位
  basicInfoConfig = {
    name: true,   // 預設姓名為必填
    phone: false,
    email: false
  };

  /**
   * [關鍵方法] 取得當前啟用的基本資料項目數量
   * 功用：協助 HTML 範本判斷應套用哪種 Grid 佈局類別 (cols-1, cols-2, cols-3)
   */
  get visibleProjectCount(): number {
    return Object.values(this.basicInfoConfig).filter(v => v).length;
  }

  ngOnInit(): void {
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id = routeId;

    if (routeId) {
      this.surveyService.getSurveyById(Number(routeId)).subscribe({
        next: (result) => {
          this.surveyData = result;
          // [實作] 根據管理員設定同步欄位顯示狀態 (目前採模擬邏輯，未來由 API 決定)
          if (result) {
            this.basicInfoConfig = {
              name: true,
              phone: result.id % 2 === 0, // 模擬：偶數問卷需填手機
              email: result.id === 6      // 模擬：特定問卷需填信箱
            };
          }
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
   * 提交按鈕觸發：進行驗證並彈出確認視窗
   */
  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.surveyData || !this.surveyData.questions) return;

    // [動態驗證]：僅針對管理員要求的欄位進行檢查
    const { name, phone, email } = this.basicInfoConfig;
    if (name && !this.userInfo.name) { alert('請填寫姓名'); return; }
    if (phone && !this.userInfo.phone) { alert('請填寫電話'); return; }
    if (email && !this.userInfo.email) { alert('請填寫信箱'); return; }

    this.tempAnswers = this.collectAnswers();
    this.modalStep = 'confirm';
    this.showModal = true;
  }

  /**
   * 判定題目是否應被禁用 (承上題邏輯)
   * 功用：檢查該題是否依賴於前一題，且前一題是否尚未完成作答。
   */
  isQuestionDisabled(q: any): boolean {
    if (!q.isDependent || !q.parentId) return false;

    // 取得父題目的答案
    const parentAnswer = this.answers['q' + q.parentId];

    // 檢查父題目是否有值 (支援陣列或字串)
    const hasValue = Array.isArray(parentAnswer) 
      ? parentAnswer.length > 0 
      : !!parentAnswer && parentAnswer.trim() !== '';

    return !hasValue; // 若無值則禁用
  }

  /**
   * 處理輸入變更
   * 功用：當使用者作答時，更新答案物件以觸發承上題的即時解鎖。
   */
  onAnswerChange(questId: number, event: any, type: string): void {
    const key = 'q' + questId;
    if (type === 'single' || type === 'text') {
      this.answers[key] = event.target.value;
    } else if (type === 'multiple') {
      // 處理多選：使用 document 原生抓取，因為目前的資料流較為分散
      this.answers[key] = Array.from(document.querySelectorAll(`input[name="${key}"]:checked`)).map((el: any) => el.value);
    }
  }

  finalSubmit() {
    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      this.modalStep = 'thanks';
      setTimeout(() => {
        this.goToPreview();
      }, 1500);
    }, 800);
  }

  goToPreview() {
    this.showModal = false;
    this.surveyService.setUserInfo(this.userInfo);
    this.router.navigate(['/surveys', this.id, 'preview'], {
      state: { data: this.tempAnswers },
    });
  }

  private collectAnswers() {
    if (!this.surveyData || !this.surveyData.questions) return {};

    const answers: any = {
      id: this.id,
      title: this.surveyData.title,
      userInfo: { ...this.userInfo },
    };

    this.surveyData.questions.forEach((q: any) => {
      const inputName = 'q' + q.id;
      if (q.type === 'single') {
        answers[inputName] = (document.querySelector(`input[name="${inputName}"]:checked`) as HTMLInputElement)?.value || '';
      } else if (q.type === 'multiple') {
        answers[inputName] = Array.from(document.querySelectorAll(`input[name="${inputName}"]:checked`)).map((el) => (el as HTMLInputElement).value);
      } else if (q.type === 'text') {
        answers[inputName] = (document.querySelector(`textarea[name="${inputName}"]`) as HTMLTextAreaElement)?.value || '';
      }
    });
    return answers;
  }

  goBack() {
    this.router.navigate(['/surveys']);
  }
}
