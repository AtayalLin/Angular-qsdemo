import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-survey-admin',
  standalone: true,
  // 導入 CommonModule 以支援 ngIf/ngClass，FormsModule 支援雙向綁定
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './survey-admin.component.html',
  styleUrl: './survey-admin.component.scss'
})
export class SurveyAdminComponent {
  // 目前啟動的頁籤，預設為 'survey' (問卷設定)
  activeTab: 'survey' | 'questions' | 'feedback' | 'stats' = 'survey';

  /**
   * 切換頁籤方法
   * 功用：根據使用者點擊切換不同的管理面板
   * @param tab 目標頁籤名稱
   */
  switchTab(tab: 'survey' | 'questions' | 'feedback' | 'stats'): void {
    this.activeTab = tab;
  }
}
