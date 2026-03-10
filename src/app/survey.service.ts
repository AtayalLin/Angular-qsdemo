import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// 功能：定義單一題目的型別結構
export interface Question {
  id: number;
  question_id?: number; // 相容後端欄位名稱（後端為 question_id，前端為 id）
  title: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  isRequired?: boolean;
}

// 功能：定義問卷基本資料的型別結構
// 原理：同時包含後端慣用的 snake_case（start_date）與前端慣用的 camelCase（startDate）
//   以確保新舊資料格式、各頁面模板都能正確存取，不需強制轉換
export interface Survey {
  id: number;
  title: string;
  type: string;
  intro?: string; // 對應 Java Quiz.java 的 intro 欄位（問卷說明）
  startDate: string;
  endDate: string;
  start_date?: string; // ✅ 後端 snake_case 欄位相容，供 survey-list HTML 使用
  end_date?: string; // ✅ 後端 snake_case 欄位相容，供 survey-list HTML 使用
  published: boolean; // true = 已發佈，false = 草稿/未發佈
  publishStatus?: string; // ✅ survey-admin 頁面使用的狀態文字欄位（如 '草稿'）
  participants: number; // 填答人數（顯示用）
  collectName?: boolean; // 是否收集姓名
  collectPhone?: boolean; // 是否收集電話
  collectEmail?: boolean; // 是否收集信箱
  questions?: Question[];
}

@Injectable({
  providedIn: 'root', // 原理：註冊為全域單例服務，任何元件都可透過 DI 注入使用
})
export class SurveyService {
  // 後端 Spring Boot 服務的基礎 URL（開發環境預設 8080 port）
  private readonly API_BASE = 'http://localhost:8080/quiz';

  constructor(private http: HttpClient) {}

  // ─────────────────────────────────────────────
  // 1. 取得所有問卷清單
  // 功能：從後端 /getAll 取得所有問卷基礎資訊（不含題目）
  // 原理：後端回傳 { code, message, quizList: Survey[] }
  // ─────────────────────────────────────────────
  getSurveys(): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/getAll`);
  }

  // ─────────────────────────────────────────────
  // 2. 取得特定問卷的題目清單
  // 功能：傳入問卷 ID，取得該問卷所有題目（含選項、必填、承上題設定）
  // 原理：後端回傳 { code, message, questionList: Question[] }
  // ─────────────────────────────────────────────
  getSurveyById(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.API_BASE}/get_questions_List?quizId=${id}`,
    );
  }

  // ─────────────────────────────────────────────
  // 跨元件暫存使用者資訊（填答頁 → 預覽頁傳遞）
  // 功能：避免反覆讀取 localStorage，提供元件間快速共享會員資料的方式
  // ─────────────────────────────────────────────
  private userInfo: any = null;
  setUserInfo(info: any) {
    this.userInfo = info;
  }
  getUserInfo() {
    return this.userInfo;
  }

  // ─────────────────────────────────────────────
  // 3. 使用者登入
  // 功能：驗證帳號密碼，成功後後端回傳 { code, role, user }
  // 原理：使用 HttpParams 傳遞查詢參數（?email=...&password=...）
  // ─────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);
    return this.http.post(`${this.API_BASE}/login`, null, { params });
  }

  // ─────────────────────────────────────────────
  // 3.5 使用者註冊
  // 功能：傳送新會員資料至後端建立帳號
  // 原理：以 @RequestBody 接收 JSON 物件寫入 user 資料表
  // ─────────────────────────────────────────────
  register(user: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/register`, user);
  }

  // ─────────────────────────────────────────────
  // 4. 更新個人資料
  // 功能：更新會員的姓名、電話等基本資料
  // 原理：後端對應 /update_profile，以 @RequestBody 接收 User 物件執行 UPDATE
  // ─────────────────────────────────────────────
  updateUserProfile(user: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/update_profile`, user);
  }

  // ─────────────────────────────────────────────
  // 5. 修改密碼
  // 功能：先驗證舊密碼，再更新為新密碼
  // 原理：後端以 HttpParams 接收三個參數，比對 DB 中的密碼後執行更新
  // ─────────────────────────────────────────────
  changePassword(
    email: string,
    oldPwd: string,
    newPwd: string,
  ): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('oldPwd', oldPwd)
      .set('newPwd', newPwd);
    return this.http.post(`${this.API_BASE}/change_password`, null, { params });
  }

  // ─────────────────────────────────────────────
  // 6. 取得會員填答歷史
  // 功能：查詢該 email 曾填答的所有問卷清單（用於會員中心）
  // 原理：後端查詢 fillin 表取得 quiz_id，再 JOIN quiz 表回傳問卷基本資料
  // ─────────────────────────────────────────────
  getUserHistory(email: string): Observable<Survey[]> {
    return this.http.get<Survey[]>(
      `${this.API_BASE}/get_history?email=${email}`,
    );
  }

  // ─────────────────────────────────────────────
  // 7. 提交填答
  // 功能：將完整填答資料（含答案）送至後端寫入 fillin 資料表
  // 原理：後端接收 FillinReq（包含 quizId、email、answerVoList 等）
  // ─────────────────────────────────────────────
  submitFillin(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/fillin`, payload);
  }

  // ─────────────────────────────────────────────
  // 8. 取得單一填答的詳細內容
  // 功能：讓會員從歷史紀錄中查看某份問卷的填答內容
  // 原理：後端接收 FeedbackReq { quizId, email }，查詢 fillin 表回傳 FeedbackRes
  // ─────────────────────────────────────────────
  getFeedback(quizId: number, email: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/feedback`, { quizId, email });
  }

  // ─────────────────────────────────────────────
  // 9. 批次刪除問卷
  // 功能：管理員一次刪除多份問卷
  // 原理：傳送 ID 陣列，後端執行 WHERE id IN (...) 批次刪除
  // ─────────────────────────────────────────────
  deleteBatchSurveys(quizIdList: number[]): Observable<any> {
    return this.http.post(`${this.API_BASE}/delete`, { quizIdList });
  }

  // ─────────────────────────────────────────────
  // 10. 單筆刪除問卷
  // 功能：管理員刪除單一問卷（含其所有題目與填答記錄）
  // ─────────────────────────────────────────────
  deleteSingleSurvey(quizId: number): Observable<any> {
    return this.http.get(`${this.API_BASE}/delete_single?quizId=${quizId}`);
  }

  // ─────────────────────────────────────────────
  // 11. 建立新問卷
  // 功能：管理員新增問卷（含標題、類型、收集設定、題目清單）
  // 原理：後端接收 CreateReq，同時寫入 quiz 與 questions 兩張資料表
  // ─────────────────────────────────────────────
  createSurvey(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/create`, payload);
  }

  // ─────────────────────────────────────────────
  // 12. 更新問卷
  // 功能：管理員修改現有問卷的內容與題目
  // 原理：後端先清除舊題目再重新插入，確保題目同步
  // ─────────────────────────────────────────────
  updateSurvey(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/update`, payload);
  }

  // ─────────────────────────────────────────────
  // 13. 上傳會員頭像
  // 功能：將圖片以 FormData 方式傳至後端，後端轉 Base64 儲存至 user.avatar 欄位
  // 原理：DB 的 avatar 欄位必須為 LONGTEXT，否則 Base64 字串會被截斷
  //   （如遇截斷錯誤請執行：ALTER TABLE user MODIFY COLUMN avatar LONGTEXT;）
  // ─────────────────────────────────────────────
  uploadAvatar(file: File, email: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);
    return this.http.post(`${this.API_BASE}/upload_avatar`, formData);
  }

  // ─────────────────────────────────────────────
  // 14. 發佈問卷
  // 功能：將問卷狀態切換為「已發佈」，讓一般使用者可以填寫
  // 原理：後端更新 quiz.is_published = true
  // ─────────────────────────────────────────────
  publishSurvey(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(`${this.API_BASE}/publish`, null, { params });
  }

  // ─────────────────────────────────────────────
  // 15. 取消發佈問卷
  // 功能：將問卷切回未發佈狀態，暫停使用者填寫
  // 原理：後端更新 quiz.is_published = false
  // ─────────────────────────────────────────────
  unpublishSurvey(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(`${this.API_BASE}/unpublish`, null, { params });
  }
}
