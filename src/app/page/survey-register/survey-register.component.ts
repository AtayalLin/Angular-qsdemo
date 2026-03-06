import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SurveyService } from '../../survey.service';

@Component({
  selector: 'app-survey-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './survey-register.component.html',
  styleUrl: './survey-register.component.scss'
})
export class SurveyRegisterComponent {
  private router = inject(Router);
  private surveyService = inject(SurveyService);

  showPassword = false;
  showConfirmPassword = false;
  // 表單資料模型
  regData = {
    account: '',
    name: '',
    password: '',
    confirmPassword: ''
  };

  // 執行註冊邏輯
  onRegister() {
    // 1. 基本密碼一致性檢查
    if (this.regData.password !== this.regData.confirmPassword) {
      alert('兩次輸入的密碼不一致！');
      return;
    }

    // 2. 使用 SurveyService 進行註冊
    const newUser = {
      email: this.regData.account, // 後端通常使用 email 作為帳號
      name: this.regData.name,
      password: this.regData.password
    };

    this.surveyService.register(newUser).subscribe({
      next: (res: any) => {
        if (res.code === 200) {
          alert('註冊成功！將為您跳轉至登入頁面。');
          this.router.navigate(['/surveys'], { queryParams: { login: 'true' } });
        } else {
          alert(res.message || '註冊失敗');
        }
      },
      error: (err) => {
        console.error('註冊 API 異常', err);
        alert('連線失敗，請確保後端 Eclipse 已啟動。');
      }
    });
  }

  // 返回列表頁
  goBack() {
    this.router.navigate(['/surveys']);
  }

  // 直接開啟登入（其實也是回到首頁並帶參數）
  goToLogin() {
    this.router.navigate(['/surveys'], { queryParams: { login: 'true' } });
  }
}