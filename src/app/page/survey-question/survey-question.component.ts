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
  // 功能：控制載入中動畫的顯示，API 回傳前保持 true
  isLoading = true;

  // 功能：API 發生錯誤時設為 true，觸發錯誤提示畫面
  loadError = false;

  // 原理：使用 Angular inject() 函式取得 DI 實例，等同於 constructor 注入
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  // 功能：從路由參數取得的問卷 ID（字串型別，使用前需轉 Number）
  id: string | null = null;

  // 功能：防止重複送出的旗標
  isSubmitting = false;

  // 功能：儲存從後端組裝好的問卷資料（標題、描述、題目清單）
  surveyData: any = null;

  // 功能：控制送出確認彈窗的顯示
  showModal = false;

  // 功能：彈窗目前所在步驟，confirm = 確認送出，thanks = 感謝頁
  modalStep: 'confirm' | 'thanks' = 'confirm';

  // 功能：暫存組裝好的答案物件，等待使用者點「確認送出」才真正跳轉至預覽頁
  tempAnswers: any = null;

  // 功能：儲存使用者對每道題的作答，key 為 q1/q2/q3...，value 為答案字串或陣列
  answers: any = {};

  // 功能：儲存填答者的基本資料（姓名、電話、信箱、年齡）
  userInfo = { name: '', phone: '', email: '', age: 0 };

  // 功能：從後端問卷設定中讀取此份問卷需要收集哪些資料
  // 原理：後端 Quiz 物件中 collectName/collectPhone/collectEmail/requireAge 為 boolean
  basicInfoConfig = {
    name: false,
    phone: false,
    email: false,
    requireAge: false,
  };

  /**
   * 功能：計算目前問卷需要填寫幾個基本資料欄位
   * 原理：將 basicInfoConfig 的值過濾出 true 的數量，用於動態調整版面寬度
   */
  get visibleProjectCount(): number {
    return Object.values(this.basicInfoConfig).filter((v) => v).length;
  }

  ngOnInit(): void {
    // 從路由取得問卷 ID（URL 路徑中的 :id 參數）
    const routeId = this.route.snapshot.paramMap.get('id');
    this.id = routeId;

    // 功能：從預覽頁點「返回修改」時，恢復先前填寫的答案
    // 原理：Angular 路由跳轉可透過 extras.state 帶入資料，這裡讀取並還原狀態
    const nav = this.router.getCurrentNavigation();
    const previousData = nav?.extras.state?.['data'];
    if (previousData) {
      if (previousData.userInfo) this.userInfo = previousData.userInfo;
      // 將 q1, q2... 格式的答案重新寫回 answers 物件
      Object.keys(previousData).forEach((key) => {
        if (key.startsWith('q')) this.answers[key] = previousData[key];
      });
    }

    if (routeId) {
      // 步驟1：呼叫 getSurveyById 取得題目清單
      this.surveyService.getSurveyById(Number(routeId)).subscribe({
        next: (result: any) => {
          console.log('API 回傳原始資料：', result);
          this.isLoading = false;

          // 後端回傳格式為 { code, message, questionList }，先檢查 code
          if (result?.code !== 200) {
            console.error('API 回傳失敗：', result);
            this.loadError = true;
            return;
          }

          // 相容多種後端欄位命名（questionList / QuestionList / questions）
          const questionList =
            result?.questionList ??
            result?.QuestionList ??
            result?.questions ??
            [];

          // 步驟2：再呼叫 getSurveys 取得問卷基本資料（標題、發佈狀態、收集設定）
          // 原理：getSurveyById 只有題目，沒有問卷 meta 資料，需要兩支 API 合併
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

              // 原理：未發佈的問卷一般使用者不應進入，直接導回首頁
              const isPublished = qz.published ?? qz.is_published ?? false;
              if (!isPublished) {
                alert('此問卷尚未發佈，敬請稍候');
                this.router.navigate(['/surveys']);
                return;
              }

              // 原理：過期問卷同樣禁止填寫，比對 endDate 與今天日期
              const endDateStr = qz.end_date ?? qz.endDate;
              if (endDateStr && new Date(endDateStr) < new Date()) {
                alert('此問卷已過期，無法填寫');
                this.router.navigate(['/surveys']);
                return;
              }

              // 組裝 surveyData：統一轉換後端多種命名格式為前端統一格式
              this.surveyData = {
                id: qz.id,
                title: qz.title ?? '未命名問卷',
                description: qz.intro ?? qz.description ?? '',
                startDate: qz.start_date ?? qz.startDate,
                endDate: qz.end_date ?? qz.endDate,
                questions: questionList.map((q: any) => ({
                  id: q.question_id ?? q.id,
                  title: q.question ?? q.title,
                  // 原理：後端 type 為 'multi'，統一轉為前端 'multiple'
                  type:
                    q.type === 'multiple' || q.type === 'multi'
                      ? 'multiple'
                      : q.type === 'single'
                        ? 'single'
                        : 'text',
                  // 原理：後端選項用 ';' 串接，需拆成陣列供 ngFor 渲染
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

              // 從問卷設定讀取需要收集的基本資料欄位
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

  /**
   * 功能：判斷某題的某個選項是否已被選取（用於渲染選取狀態）
   * 原理：從 answers 物件中讀取對應題目的答案，陣列格式用 includes，字串格式直接比較
   */
  isOptionChecked(questId: number, option: string): boolean {
    const ans = this.answers['q' + questId];
    if (!ans) return false;
    return Array.isArray(ans) ? ans.includes(option) : ans === option;
  }

  /**
   * 功能：取得簡答題目前的輸入文字
   */
  getTextValue(questId: number): string {
    return this.answers['q' + questId] || '';
  }

  /**
   * 功能：判斷某題是否應該被禁用（灰階顯示、無法填寫）
   * 原理：承上題邏輯 - 若該題設定 isDependent = true，則需等父題有答案才能作答
   */
  isQuestionDisabled(q: any): boolean {
    if (!q.isDependent || !q.parentId) return false;
    const parentAnswer = this.answers['q' + q.parentId];
    const hasValue = Array.isArray(parentAnswer)
      ? parentAnswer.length > 0
      : !!parentAnswer && String(parentAnswer).trim() !== '';
    return !hasValue;
  }

  /**
   * 功能：處理使用者作答時的變更事件
   * 原理：
   *   single/text → 直接取 event.target.value
   *   multiple → 從 DOM 中找所有勾選的 checkbox，收集為陣列
   */
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

  /**
   * 功能：使用者點擊送出按鈕時的入口方法
   * 原理：先做前端驗證（基本資料必填、必答題檢查），通過後組裝答案並彈出確認視窗
   */
  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.surveyData) return;

    // 驗證基本資料必填欄位
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

    // 驗證必填題：排除「承上題且父題未作答」的跳過題目
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

    // 通過驗證：組裝答案並顯示確認彈窗
    this.tempAnswers = this.collectAnswers();
    this.modalStep = 'confirm';
    this.showModal = true;
  }

  /**
   * 功能：使用者在確認彈窗點「確認」後執行
   */
  finalSubmit(): void {
    this.goToPreview();
  }

  /**
   * 功能：跳轉至預覽頁面
   * 原理：透過 router state 傳遞 stateData，同時帶入
   *   - tempAnswers（quizId/answerVoList 格式，供後端送出用）
   *   - answers（q1/q2 格式，供預覽頁對比高亮用及返回時恢復用）
   *   - userInfo（姓名/電話/信箱）
   */
  goToPreview(): void {
    this.showModal = false;
    this.surveyService.setUserInfo(this.userInfo);

    const stateData = {
      ...this.tempAnswers, // quizId, email, name, phone, age, answerVoList
      ...this.answers, // q1, q2, q3... 格式備份
      userInfo: { ...this.userInfo },
      status: 'previewing',
    };

    this.router.navigate(['/surveys', this.id, 'preview'], {
      state: { data: stateData },
    });
  }

  /**
   * 功能：返回問卷列表首頁
   */
  goBack(): void {
    this.router.navigate(['/surveys']);
  }

  /**
   * 功能：將目前所有作答資料組裝成後端接受的格式
   * 原理：後端 /fillin API 接收 FillinReq，其中 answerVoList 每筆包含完整題目資訊與答案字串
   *   複選題答案以 ';' 串接後儲存
   */
  private collectAnswers(): any {
    const answerVoList =
      this.surveyData?.questions.map((q: any) => {
        const key = 'q' + q.id;
        const raw = this.answers[key];

        let answer = '';
        if (Array.isArray(raw)) {
          answer = raw.join(';'); // 複選題：陣列轉分號串接字串
        } else if (raw !== undefined && raw !== null) {
          answer = String(raw);
        }

        return {
          question: {
            quiz_id: Number(this.id),
            question_id: q.id,
            question: q.title,
            type: q.type === 'multiple' ? 'multi' : q.type, // 轉回後端格式
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
