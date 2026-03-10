import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  Observable,
  throwError,
  BehaviorSubject,
  catchError,
  retry,
} from 'rxjs';

export interface Question {
  id: number;
  question_id?: number; // 相容後端
  title: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  isRequired?: boolean;
}



export interface Survey {
  id: number;
  title: string;
  type: string;
  intro?: string;
  description?: string;
  start_date?: string; // 相容後端
  startDate?: string; // 相容前端
  end_date?: string; // 相容後端
  endDate?: string; // 相容前端
  published: boolean; // 相容後端 boolean
  publishStatus?: string; // 相容前端字串
  participants: number;
  collectName?: boolean;
  collectPhone?: boolean;
  collectEmail?: boolean;
  questions?: Question[];
}

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  data?: T;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class SurveyService {
  private readonly API_BASE = 'http://localhost:8080/quiz';

  // 僅保留一份完整且正確的假資料 (用於開發測試，不影響 API 串接)
  private surveys: Survey[] = [
    {
      id: 6,
      title: '87世紀遊戲主機／平台市場調查',
      type: '市場調查',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '2026-02-15',
      endDate: '2026-12-31',
      published: true,
      publishStatus: '已發佈',
      participants: 1200,
      collectName: true,
      collectPhone: true,
      collectEmail: true,
      questions: [
        {
          id: 1,
          question_id: 1,
          title: '您目前最常使用的遊戲平台為？',
          type: 'single',
          options: [
            'PlayStation 系列',
            'Xbox 系列',
            'Nintendo Switch 1、2',
            'PC',
            '行動裝置',
          ],
          isRequired: true,
        },
      ],
    },
  ];

  constructor(private http: HttpClient) {}

  /**
   * 獲取問卷清單 (正式串接 Eclipse)
   * 原理：透過 HttpClient 發送 GET 請求至後端 /getAll 端點。
   * 使用 pipe 結合 retry(1) 增加一次容錯機會，並透過 catchError 統一處理異常。
   */
  getSurveys(): Observable<any> {
    return this.http
      .get<any>(`${this.API_BASE}/getAll`)
      .pipe(retry(1), catchError(this.handleError));
  }

  /**
   * 獲取特定問卷詳情 (含題目)
   * 原理：傳入問卷 ID 作為查詢參數，獲取該問卷的所有題目設定。
   * 此處會回傳包含題目清單的完整資料結構。
   */
  getSurveyById(id: number): Observable<any> {
    return this.http
      .get<any>(`${this.API_BASE}/get_questions_List?quizId=${id}`)
      .pipe(retry(1), catchError(this.handleError));
  }

  /**
   * 使用者資訊暫存 (跨頁面傳遞用)
   * 原理：利用私有變數 userInfo 在 Service 中持久化使用者登入後的資訊，
   * 避免在不同元件間傳遞資料時需要反覆讀取 Session 或 LocalStorage。
   */
  private userInfo: any = null;
  setUserInfo(info: any) {
    this.userInfo = info;
  }
  getUserInfo() {
    return this.userInfo;
  }

  /**
   * 提交填答
   * 原理：將使用者的作答內容以 JSON 格式 POST 到後端。
   * payload 包含了問卷 ID、填答人資訊以及每一題的選項/答案。
   */
  submitFillin(payload: any): Observable<any> {
    return this.http
      .post(`${this.API_BASE}/fillin`, payload)
      .pipe(retry(1), catchError(this.handleError));
  }

  /**
   * 建立問卷
   * 原理：發送問卷結構（標題、描述、起迄日期、題目等）至後端。
   * 這是問卷管理系統的核心功能之一，負責將前端設計好的問卷持久化至資料庫。
   */
  createSurvey(payload: any): Observable<any> {
    return this.http
      .post(`${this.API_BASE}/create`, payload)
      .pipe(retry(1), catchError(this.handleError));
  }

  /**
   * 發佈問卷
   * 原理：將特定問卷的狀態變更為「已發佈」。
   * 只有已發佈的問卷才能供一般使用者進行填答。
   */
  publishSurvey(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    console.log('🚀 發佈問卷 - 參數:', { id });
    return this.http.post(`${this.API_BASE}/publish`, null, { params }).pipe(
      retry(1),
      catchError((err) => {
        console.error('❌ 發佈失敗:', err);
        return this.handleError(err);
      }),
    );
  }

  /**
   * 統一的錯誤處理機制
   * 原理：判斷錯誤來源（前端網路問題或後端伺服器回傳錯誤代碼），
   * 並根據不同的 HTTP Status Code 轉譯為使用者友好的中文提示訊息。
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = '發生未預期的錯誤，請稍後重試。';

    if (error.error instanceof ErrorEvent) {
      // 用戶端錯誤 (例如：斷網)
      errorMessage = `錯誤: ${error.error.message}`;
    } else {
      // 伺服器回傳的錯誤 (例如：404, 500)
      if (error.status === 0) {
        errorMessage = '無法連接至伺服器，請檢查網路連接。';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || '請求參數不正確。';
      } else if (error.status === 401) {
        errorMessage = '登入已過期，請重新登入。';
      } else if (error.status === 500) {
        errorMessage = '伺服器內部錯誤，請聯繫管理員。';
      }
    }

    console.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }

  
}
