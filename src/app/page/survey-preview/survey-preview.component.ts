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
  // 功能：儲存從上一頁（填寫頁或會員中心）透過 router state 傳入的資料
  // 包含：quizId、填答者基本資料（name/phone/email）、answerVoList、status
  previewData: any;

  // 功能：儲存從後端撈回的問卷結構（題目清單、標題、描述）
  // 原理：因為填答資料不含題目文字與選項，需另外呼叫 API 取得對照結構
  surveyStructure: any;

  // 功能：控制右上角 Toast 提示訊息的顯示與隱藏
  showToast = false;
  toastMsg = '';

  // 功能：判斷目前是否為「唯讀模式」
  // 原理：從會員中心進入時 status 為 submitted/expired，此時禁止送出，只能查看
  isReadOnly = false;

  constructor(
    private router: Router,
    private surveyService: SurveyService,
  ) {}

  ngOnInit(): void {
    // 原理：Angular 路由跳轉時可透過 state 夾帶資料，這裡從 window.history.state 取得
    // 使用情境1：從填寫頁（survey-question）點「預覽」跳轉過來
    // 使用情境2：從會員中心點「檢視填答」跳轉過來
    const navigation = window.history.state;
    if (navigation && navigation.data) {
      this.previewData = navigation.data;

      // 除錯用：確認 answerVoList 的結構是否正確（可上線後移除）
      console.log('answerVoList：', this.previewData?.answerVoList);
      console.log('previewData 完整內容：', this.previewData);

      // 原理：submitted = 已送出、expired = 已過期，這兩種狀態只能查看不能修改
      if (
        this.previewData.status === 'submitted' ||
        this.previewData.status === 'expired'
      ) {
        this.isReadOnly = true;
      }

      // 原理：quizId 由會員中心明確帶入，id 為填寫頁傳入的備援欄位，優先取 quizId
      const quizId = this.previewData.quizId ?? this.previewData.id;
      console.log('預覽頁 quizId：', quizId);

      if (quizId) {
        // 步驟1：先呼叫 getAll 取得問卷基本資料（標題、描述）
        // 原理：getSurveyById 只回傳題目列表，不含問卷標題，所以需要兩支 API 合併
        this.surveyService.getSurveys().subscribe((allRes: any) => {
          console.log('preview getSurveys 回傳：', allRes);
          const allQuizzes = allRes?.quizList ?? [];

          // 從全部問卷中找到對應的這一份，用來取標題與描述
          const qz = allQuizzes.find((q: any) => q.id === Number(quizId));
          console.log('找到的 qz：', qz);

          // 步驟2：再呼叫 getSurveyById 取得題目清單
          this.surveyService.getSurveyById(Number(quizId)).subscribe({
            next: (res: any) => {
              console.log('preview getSurveyById 回傳：', res);
              const questionList = res?.questionList ?? [];

              // 組裝 surveyStructure：將後端格式統一轉為前端渲染所需格式
              this.surveyStructure = {
                id: qz?.id ?? quizId,
                title: qz?.title ?? '問卷預覽',
                description: qz?.intro ?? qz?.description ?? '',
                questions: questionList.map((q: any) => ({
                  // 原理：後端題目 ID 欄位可能是 question_id 或 id，做相容處理
                  id: q.question_id ?? q.id,
                  title: q.question ?? q.title,
                  // 原理：後端 type 為 'multi'，前端統一用 'multiple'
                  type:
                    q.type === 'multiple' || q.type === 'multi'
                      ? 'multiple'
                      : q.type === 'single'
                        ? 'single'
                        : 'text',
                  // 原理：後端選項用分號 ';' 串接為字串，前端需拆成陣列才能渲染
                  options: q.options
                    ? q.options
                        .split(';')
                        .map((o: string) => o.trim())
                        .filter(Boolean)
                    : [],
                })),
              };
              console.log('surveyStructure 組好了：', this.surveyStructure);
            },
            error: (err) => console.error('預覽模式獲取結構失敗', err),
          });
        });
      }
    }

    // 若沒有傳入任何資料，顯示提示訊息（通常是直接輸入網址進入此頁）
    if (!this.previewData) {
      this.triggerToast('無有效預覽資料');
    }
  }

  /**
   * 功能：判斷某題的某個選項是否為使用者的選擇
   * 原理：支援兩種資料格式：
   *   格式1 - 填寫頁傳來的 q1, q2... 直接鍵值
   *   格式2 - 後端回傳的 answerVoList 陣列（由 getFeedback API 提供）
   * @param questId 題目的 question_id
   * @param option  選項文字
   */
  isOptionSelected(questId: number, option: string): boolean {
    if (!this.previewData) return false;

    // 優先嘗試格式1：從 previewData.q1, q2... 取值
    const key = 'q' + questId;
    const directAnswer = this.previewData[key];
    if (
      directAnswer !== undefined &&
      directAnswer !== null &&
      directAnswer !== ''
    ) {
      return this.matchAnswer(directAnswer, option);
    }

    // 嘗試格式2：從 answerVoList 找到對應題目的答案物件
    const answerVoList: any[] = this.previewData?.answerVoList ?? [];
    const vo = answerVoList.find(
      (a: any) => (a.question?.question_id ?? a.question?.id) === questId,
    );
    if (!vo) return false;

    return this.matchAnswer(vo.answer, option);
  }

  /**
   * 功能：統一比對答案字串是否包含指定選項
   * 原理：後端答案可能是「陣列」、「分號串接字串」或「單一字串」三種形式，這裡統一處理
   * @param answer 使用者的原始答案
   * @param option 要比對的選項文字
   */
  private matchAnswer(answer: any, option: string): boolean {
    if (answer === undefined || answer === null || answer === '') return false;

    // 陣列格式（前端複選題直接存成陣列）
    if (Array.isArray(answer)) {
      return answer.some((a) => String(a).trim() === option.trim());
    }

    if (typeof answer === 'string') {
      // 分號串接格式（後端回傳的複選答案）：例如 "選項A;選項B"
      if (answer.includes(';')) {
        return answer
          .split(';')
          .map((s) => s.trim())
          .includes(option.trim());
      }
      // 單一字串格式（單選題）
      return answer.trim() === option.trim();
    }

    return String(answer).trim() === option.trim();
  }

  /**
   * 功能：取得簡答題（text 類型）的文字答案
   * 原理：同樣支援 q1/q2 格式與 answerVoList 格式，確保兩種來源都能正確顯示
   * @param questId 題目的 question_id
   */
  getTextAnswer(questId: number): string {
    // 格式1：直接鍵值
    const key = 'q' + questId;
    if (this.previewData?.[key]) return this.previewData[key];

    // 格式2：從 answerVoList 找
    const answerVoList: any[] = this.previewData?.answerVoList ?? [];
    const vo = answerVoList.find(
      (a: any) => (a.question?.question_id ?? a.question?.id) === questId,
    );
    return vo?.answer ?? '';
  }

  /**
   * 功能：顯示右上角浮動提示訊息（Toast）
   * 原理：設定 showToast = true 觸發 HTML 渲染，2.5 秒後自動隱藏
   */
  triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }

  /**
   * 功能：返回上一頁
   * 原理：
   *   唯讀模式（從會員中心來）→ 返回會員中心 /member
   *   預覽模式（從填寫頁來）→ 帶著目前填答狀態返回填寫頁，以便使用者繼續修改
   */
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

  // 功能：防止重複送出的旗標，點擊送出後立即設為 true 鎖住按鈕
  isSubmitting = false;

  /**
   * 功能：正式送出問卷
   * 原理：將 previewData（含 quizId、answerVoList 等）POST 至後端 /fillin
   *   成功後跳回問卷列表；唯讀模式或已送出中時禁止觸發
   */
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
