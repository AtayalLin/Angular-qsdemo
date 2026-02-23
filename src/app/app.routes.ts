import { Routes } from '@angular/router';
import { SurveyListComponent } from './page/survey-list/survey-list.component';
import { SurveyResultComponent } from './page/survey-result/survey-result.component';
import { SurveyQuestionComponent } from './page/survey-question/survey-question.component';
import { SurveyPreviewComponent } from './page/survey-preview/survey-preview.component'; 
import { SurveyRegisterComponent } from './page/survey-register/survey-register.component';
import { SurveyAdminComponent } from './page/survey-admin/survey-admin.component'; // 匯入新的後台管理組件

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'surveys',
    pathMatch: 'full',
  },
  {
    path: 'surveys',
    component: SurveyListComponent,
  },
  {
    /* 1. 問卷填寫頁面 */
    path: 'surveys/:id/question',
    component: SurveyQuestionComponent,
  },
  {
    /* 2. 新增：問卷預覽頁面 */
    path: 'surveys/:id/preview',
    component: SurveyPreviewComponent,
  },
  {
    /* 3. 問卷結果統計頁面 */
    path: 'surveys/:id/result',
    component: SurveyResultComponent,
  },
  {
    /* 4. 註冊帳號密碼頁面 */
    path: 'register', 
    component: SurveyRegisterComponent,
  },
  {
    /* 5. 後台管理頁面 (新增/編輯問卷) */
    path: 'admin',
    component: SurveyAdminComponent, // 註冊後台管理路由，功用：處理問卷管理流程
  },
];
