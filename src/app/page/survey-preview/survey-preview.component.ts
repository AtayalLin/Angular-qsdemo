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
  isReadOnly = false;

  // [新增] 靜態題目選項定義，用於檢視模式下顯示所有選項
  // 這些選項應與問卷設計時保持一致
  questionOptions = {
    q1: ['非常滿意', '滿意', '普通', '不滿意', '非常不滿意'],
    q2: ['硬體外觀', '系統流暢度', '續航力表現', '自定義桌面', '語音控制', '防禦工事', '場地大小'],
    q3: ['是', '否', '考慮中', '極高', '普通', '不願意'],
    q4: ['每天使用', '週一至週五', '週末使用', '下午時段', '步行', '深夜', '角色扮演（RPG）', 'PlayStation 系列']
  };

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

  // [新增] 輔助方法：判斷選項是否被選中
  isOptionSelected(questionKey: string, option: string): boolean {
    if (!this.previewData) return false;
    const answer = this.previewData[questionKey];
    if (!answer === undefined || answer === null || answer === '') return false;
    
    // 1. 處理陣列 (來自填寫頁面的多選題)
    if (Array.isArray(answer)) {
      return answer.some(a => String(a).trim() === option.trim());
    }

    // 2. 處理字串 (來自會員中心的模擬資料，多選以分號分隔)
    if (typeof answer === 'string') {
      if (answer.includes(';')) {
        return answer.split(';').map(s => s.trim()).includes(option.trim());
      }
      return answer.trim() === option.trim();
    }
    
    // 3. 其他情況 (如數字)
    return String(answer).trim() === option.trim();
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
