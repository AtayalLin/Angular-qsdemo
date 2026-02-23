import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  ngOnInit(): void {
    // 應用程式初始化時，自動植入測試帳號資料
    this.seedTestAccount();
  }

  /**
   * 植入開發者專用的測試帳號至 LocalStorage
   * 功用：確保開發者無需註冊即可直接登入測試，且此帳號在清理 LocalStorage 後重整頁面會再次生成。
   */
  private seedTestAccount(): void {
    const testAccount = {
      account: 'test@gmail.com', // 預設測試帳號
      name: '測試開發者',        // 預設顯示名稱
      password: '123456789'      // 預設測試密碼
    };

    // 從 LocalStorage 取得目前已註冊的使用者列表，若無則回傳空陣列
    const storedUsers = JSON.parse(localStorage.getItem('survey_users') || '[]');
    
    // 檢查測試帳號是否已經存在於列表中
    const isExist = storedUsers.some((u: any) => u.account === testAccount.account);
    
    if (!isExist) {
      // 若帳號不存在，則將測試帳號加入列表並存回 LocalStorage
      storedUsers.push(testAccount);
      localStorage.setItem('survey_users', JSON.stringify(storedUsers));
    }
  }
}
