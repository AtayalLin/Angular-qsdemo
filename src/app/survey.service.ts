import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

export interface Question {
  id: number;
  title: string;
  type: 'single' | 'multiple' | 'text';
  options?: string[];
  cssClass?: string;
}

export interface Survey {
  id: number;
  title: string;
  type: string;
  description?: string; // [關鍵] 確保此屬性存在
  startDate: string;
  endDate: string;
  participants: number;
  publishStatus: '已發佈' | '已儲存尚未發佈' | '草稿';
  questions?: Question[];
}

@Injectable({
  providedIn: 'root',
})
export class SurveyService {
  constructor(private http: HttpClient) {}

  private surveySubmission = {
    userInfo: { name: '', phone: '', email: '' },
    answers: [],
  };

  setUserInfo(info: any) {
    this.surveySubmission.userInfo = info;
  }
  getUserInfo() {
    return this.surveySubmission.userInfo;
  }

  private surveys: Survey[] = [
    {
      id: 1,
      title: 'iHome 第514代使用者滿意度調查',
      type: '滿意度',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '2175-11-23',
      endDate: '2175-12-23',
      participants: 120,
      publishStatus: '已發佈',
      questions: [],
    },
    {
      id: 2,
      title: 'iHome 新功能回饋意見',
      type: '問卷',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '2175-07-08',
      endDate: '2175-09-15',
      participants: 45,
      publishStatus: '已發佈',
      questions: [],
    },
    {
      id: 3,
      title: '鄉里活動中心活動選拔投票',
      type: '活動',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '2024-09-11',
      endDate: '2024-09-31',
      participants: 85,
      publishStatus: '已發佈',
      questions: [],
    },
    {
      id: 4,
      title: '「第24屆天下第一武道大會場地」各家建商標案',
      type: '回饋',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '0767-04-25',
      endDate: '0767-05-01',
      participants: 77,
      publishStatus: '草稿',
      questions: [],
    },
    {
      id: 5,
      title: '鬼殺隊巡邏滿意度調查',
      type: '滿意度',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '1918-01-14',
      endDate: '1918-02-14',
      participants: 200,
      publishStatus: '已儲存尚未發佈',
      questions: [],
    },
    {
      id: 6,
      title: '87世紀遊戲主機／平台市場調查',
      type: '市場調查',
      description: '請分享您的看法，我們將依據回饋打造次世代的遊戲體驗。',
      startDate: '2026-02-15',
      endDate: '2026-12-31',
      participants: 1200,
      publishStatus: '已發佈',
      questions: [
        {
          id: 1,
          title: '您目前最常使用的遊戲平台為？',
          type: 'single',
          options: [
            'PlayStation 系列',
            'Xbox 系列',
            'Nintendo Switch 1、2',
            'PC',
            '行動裝置',
          ],
        },
        {
          id: 2,
          title: '您選擇遊戲平台時重視哪些因素？（可複選）',
          type: 'multiple',
          options: [
            '遊戲陣容與獨佔作品',
            '主機效能與畫面表現',
            '訂閱制服務 (如 Game Pass)',
            '周邊硬體',
          ],
        },
        {
          id: 3,
          title: '您是否願意嘗試支援 VR / AR 的遊戲主機？',
          type: 'single',
          options: [
            '非常願意',
            '視價格與內容時定',
            '目前已擁有相關設備',
            '暫時沒有興趣',
            '完全不考慮',
          ],
        },
        {
          id: 4,
          title: '您最常遊玩的遊戲類型為？（可複選）',
          type: 'multiple',
          options: ['動作冒險', '角色扮演（RPG）', '第一人稱射擊', '模擬經營'],
        },
        {
          id: 5,
          title: '您對未來遊戲主機或平台有什麼期待或建議？',
          type: 'text',
        },
      ],
    },
  ];

  importMockDataToDatabase(): Observable<any> {
    const apiURL = 'http://localhost:8080/quiz/create';
    const mockSurvey = this.surveys[0];

    const payload = {
      title: mockSurvey.title,
      description: mockSurvey.type,
      startDate: mockSurvey.startDate,
      endDate: mockSurvey.endDate,
      is_published: mockSurvey.publishStatus === '已發佈',
      questionsList: mockSurvey.questions?.map((q) => ({
        question_id: q.id,
        question: q.title,
        type: q.type === 'multiple' ? 'multi' : q.type,
        is_required: true,
        options: q.options ? q.options.join(';') : '',
      })),
    };

    return this.http.post(apiURL, payload);
  }

  getSurveys(): Observable<Survey[]> {
    return of(this.surveys);
  }
  getSurveyById(id: number): Observable<Survey | undefined> {
    const found = this.surveys.find((s) => s.id === id);
    return of(found);
  }
}
