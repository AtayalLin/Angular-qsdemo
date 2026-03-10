import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SurveyService } from '../../survey.service';

@Component({
  selector: 'app-survey-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './survey-register.component.html',
  styleUrl: './survey-register.component.scss',
})
export class SurveyRegisterComponent {
  regData = {
    account: '',
    name: '',
    age: null as number | null,
    password: '',
    confirmPassword: '',
    phone: '',
  };

  showPassword = false;
  showConfirmPassword = false;
  isSubmitting = false;

  constructor(
    private router: Router,
    private surveyService: SurveyService,
  ) {}

  onRegister(): void {
    if (
      !this.regData.account ||
      !this.regData.name ||
      !this.regData.password ||
      !this.regData.age
    ) {
      alert('請填寫所有必填欄位');
      return;
    }
    if (this.regData.password !== this.regData.confirmPassword) {
      alert('兩次密碼輸入不一致');
      return;
    }
    if (this.regData.age < 18) {
      alert('年齡必須滿 18 歲');
      return;
    }

    this.isSubmitting = true;

    const payload = {
      email: this.regData.account,
      name: this.regData.name,
      password: this.regData.password,
      phone: this.regData.phone ?? '',
      age: this.regData.age,
    };

    this.surveyService.register(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.code === 200) {
          alert('註冊成功！請登入');
          this.router.navigate(['/login']);
        } else {
          alert(res.message || '註冊失敗，請稍後再試');
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('註冊失敗', err);
        alert('伺服器錯誤，請稍後再試');
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/surveys']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
