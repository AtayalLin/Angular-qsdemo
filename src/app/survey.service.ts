import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';

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

  // 1. 獲取問卷清單 (真資料)
  getSurveys(): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/getAll`);
  }

  // 2. 獲取特定問卷詳情 (含題目)
  getSurveyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_BASE}/get_questions_List?quizId=${id}`);
  }

  // 使用者資訊暫存 (跨頁面傳遞用)
  private userInfo: any = null;
  setUserInfo(info: any) { this.userInfo = info; }
  getUserInfo() { return this.userInfo; }

  // 3. 使用者登入 API
  login(email: string, password: string): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('password', password);
    return this.http.post(`${this.API_BASE}/login`, null, { params });
  }

  // 3.5 使用者註冊 API
  register(user: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/register`, user);
  }

  // 4. 修改個人資料 API
  updateUserProfile(user: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/update_profile`, user);
  }

  // 5. 修改密碼 API
  changePassword(email: string, oldPwd: string, newPwd: string): Observable<any> {
    const params = new HttpParams()
      .set('email', email)
      .set('oldPwd', oldPwd)
      .set('newPwd', newPwd);
    return this.http.post(`${this.API_BASE}/change_password`, null, { params });
  }

  // 6. 撈取會員填答歷史紀錄 (真資料)
  getUserHistory(email: string): Observable<Survey[]> {
    return this.http.get<Survey[]>(`${this.API_BASE}/history?email=${email}`);
  }

  // 7. 提交填答
  submitFillin(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/fillin`, payload);
  }

  // 8. 獲取單一填答回饋 (預覽與高亮對照用)
  getFeedback(quizId: number, email: string): Observable<any> {
    return this.http.post(`${this.API_BASE}/feedback`, { quizId, email });
  }

  // 9. 批次刪除
  deleteBatchSurveys(quizIdList: number[]): Observable<any> {
    return this.http.post(`${this.API_BASE}/delete`, { quizIdList });
  }

  // 10. 單筆刪除
  deleteSingleSurvey(quizId: number): Observable<any> {
    return this.http.get(`${this.API_BASE}/delete_single?quizId=${quizId}`);
  }

  // 11. 建立問卷
  createSurvey(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/create`, payload);
  }

  // 12. 更新問卷
  updateSurvey(payload: any): Observable<any> {
    return this.http.post(`${this.API_BASE}/update`, payload);
  }
}
