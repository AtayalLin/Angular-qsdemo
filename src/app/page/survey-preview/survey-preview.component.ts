import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-survey-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-preview.component.html',
  styleUrl: './survey-preview.component.scss',
})
export class SurveyPreviewComponent implements OnInit {
  previewData: any;
  showToast = false;
  toastMsg = '';
  isReadOnly = false; // 新增：判定是否為唯讀模式

  constructor(private router: Router) {}

  ngOnInit(): void {
    const navigation = window.history.state;
    if (navigation && navigation.data) {
      this.previewData = navigation.data;
      // [關鍵] 判定來源：如果資料中帶有 status 且為 submitted 或 expired，則設為唯讀
      if (
        this.previewData.status === 'submitted' ||
        this.previewData.status === 'expired'
      ) {
        this.isReadOnly = true;
      }
    }

    if (!this.previewData) {
      this.triggerToast('活動已過期，下次請早 !!');
    }
  }

  triggerToast(msg: string) {
    this.toastMsg = msg;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 2500);
  }

  goBack() {
    // 如果是唯讀模式，返回會員中心；否則正常回上一頁
    if (this.isReadOnly) {
      this.router.navigate(['/member']);
    } else {
      window.history.back();
    }
  }

  submitSurvey() {
    if (this.isReadOnly) return;
    alert('問卷已成功送出！');
    this.router.navigate(['/surveys']);
  }
}
