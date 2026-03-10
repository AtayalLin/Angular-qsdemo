import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  intro?: string;      // 與 Java Quiz.java 對齊
  startDate: string; 
  endDate: string;
  published: boolean;  // 確保此屬性存在
  participants: number;
  // 收集設定
  collectName?: boolean;
  collectPhone?: boolean;
  collectEmail?: boolean;
  questions?: Question[];
}

@Injectable({
  providedIn: 'root',
})
export class SurveyService {
  private readonly API_BASE = 'http://localhost:8080/quiz';

  constructor(private http: HttpClient) {}

  // 1. 獲取問卷清單 (真資料) - 原理：透過 HttpClient 發送 GET 請求至後端 /getAll 取得所有問卷基礎資訊
  getSurveys(): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/getAll`);
  }

  // 2. 獲取特定問卷詳情 (含題目) - 原理：傳入問卷 ID 作為查詢參數，撈取該問卷關聯的所有題目清單
  getSurveyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/get_questions_List?quizId=${id}`);
  }

  // 使用者資訊暫存 (跨頁面傳遞用) - 原理：於 Service 層級維護一個變數，讓元件間免於反覆讀取 Storage 即可共享會員資訊
  private userInfo: any = null;
  setUserInfo(info: any) { this.userInfo = info; }
  getUserInfo() { return this.userInfo; }

  // 3. 使用者登入 API - 原理：以 HttpParams 傳遞帳密，後端比對資料庫後回傳 Token 與基本資料
  login(email: string, password: string): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);
    return this.http.post(`${this.API_BASE}/login`, null, { params });
  }

  // 3.5 使用者註冊 API - 原理：傳送註冊資訊 JSON 物件，後端新增 user 記錄
  register(user: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/register`, user);
  }

  // 4. 修改個人資料 API - 原理：傳送包含變更後姓名/電話的物件進行資料庫 Update
  updateUserProfile(user: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/update_profile`, user);
  }

  // 5. 修改密碼 API - 原理：同時驗證舊密碼與新密碼，確保修改動作之安全性
  changePassword(email: string, oldPwd: string, newPwd: string): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('oldPwd', oldPwd)
      .set('newPwd', newPwd);
    return this.http.post(`${this.API_BASE}/change_password`, null, { params });
  }

  // 6. 撈取會員填答歷史紀錄 (真資料) - 原理：根據 Email 查詢 fillin 表，獲取該使用者曾參與的所有問卷
  getUserHistory(email: string): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${this.API_BASE}/history?email=${email}`);
  }

  // 7. 提交填答 - 原理：將問卷 ID 與所有題目答案彙整為 JSON，一次性寫入後端 fillin 資料表
  submitFillin(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/fillin`, payload);
  }

  // 8. 獲取單一填答回饋 (預覽與高亮對照用) - 原理：取得特定問卷中，該使用者的原始答案以進行對比高亮顯示
  getFeedback(quizId: number, email: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/feedback`, { quizId, email });
  }

  // 9. 批次刪除 - 原理：傳送 ID 陣列，後端執行大量刪除 SQL 以提升管理效率
  deleteBatchSurveys(quizIdList: number[]): Observable<any> {
    return this.http.post(`${this.API_BASE}/delete`, { quizIdList });
  }

  // 10. 單筆刪除 - 原理：針對特定問卷進行邏輯或物理刪除
  deleteSingleSurvey(quizId: number): Observable<any> {
    return this.http.get(`${this.API_BASE}/delete_single?quizId=${quizId}`);
  }

  // 11. 建立問卷 - 原理：發送完整問卷結構（含題目、收集設定、起迄日）至後端入庫
  createSurvey(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/create`, payload);
  }

  // 12. 更新問卷 - 原理：覆蓋現有問卷設定，同步更新所有關聯題目
  updateSurvey(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/update`, payload);
  }

  // 14. 發佈問卷 - 原理：將問卷狀態變更為「已發佈」，正式對外開放填寫
  publishSurvey(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(`${this.API_BASE}/publish`, null, { params });
  }

  // 15. 取消發佈問卷 - 原理：將問卷變回草稿狀態，暫停使用者填寫權限
  unpublishSurvey(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(`${this.API_BASE}/unpublish`, null, { params });
  }
}
