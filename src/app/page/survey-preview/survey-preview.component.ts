import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SurveyService } from '../../survey.service';

@Component({
  selector: 'app-survey-preview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './survey-preview.component.html',
  styleUrl: './survey-preview.component.scss',
})
export class SurveyPreviewComponent implements OnInit {
  previewData: any;
  surveyStructure: any; // 存儲問卷的完整結構 (含題目與所有選項)
  showToast = false;
  toastMsg = '';
  isReadOnly = false;

  constructor(private router: Router, private surveyService: SurveyService) {}

  ngOnInit(): void {
    const navigation = window.history.state;
    if (navigation && navigation.data) {
      this.previewData = navigation.data;
      
      // 1. 判定是否為唯讀模式 (從會員中心進入)
      if (this.previewData.status === 'submitted' || this.previewData.status === 'expired') {
        this.isReadOnly = true;
      }

      // 2. 獲取問卷結構 (為了得知所有題目與選項)
      const quizId = this.previewData.id || this.previewData.quizId;
      if (quizId) {
        this.surveyService.getSurveyById(Number(quizId)).subscribe({
          next: (res: any) => {
            // 假設後端回傳結構為 { quiz: { ... }, questionsList: [...] }
            // 我們將其格式化為前端習慣的結構
            this.surveyStructure = res;
          },
          error: (err) => console.error('預覽模式獲取結構失敗', err)
        });
      }
    }

    if (!this.previewData) {
      this.triggerToast('無有效預覽資料');
    }
  }

  /**
   * 動態判斷選項是否被選中
   */
  isOptionSelected(questId: number, option: string): boolean {
    if (!this.previewData) return false;
    const key = 'q' + questId;
    const answer = this.previewData[key];
    
    if (answer === undefined || answer === null || answer === '') return false;
    
    // A. 處理陣列 (來自填寫頁面的多選題)
    if (Array.isArray(answer)) {
      return answer.some(a => String(a).trim() === option.trim());
    }

    // B. 處理字串 (來自後端或模擬資料)
    if (typeof answer === 'string') {
      if (answer.includes(';')) {
        return answer.split(';').map(s => s.trim()).includes(option.trim());
      }
      return answer.trim() === option.trim();
    }
    
    return String(answer).trim() === option.trim();
  }

  goBack() {
    if (this.isReadOnly) {
      this.router.navigate(['/member']);
    } else {
      // 修正：明確將當前答案帶回填寫頁，確保「上一步」後答案不會消失
      this.router.navigate(['/surveys', this.previewData.id, 'question'], {
        state: { data: this.previewData }
      });
    }
  }

  submitSurvey() {
    if (this.isReadOnly) return;
    
    // 正式提交填答至後端
    this.surveyService.submitFillin(this.previewData).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          alert('問卷已成功送出！');
          this.router.navigate(['/surveys']);
        } else {
          alert(res.message || '送出失敗');
        }
      },
      error: (err) => alert('連線異常，請稍後再試')
    });
  }
}
