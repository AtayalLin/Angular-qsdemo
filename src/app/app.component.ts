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
      account: 'test@gmail.com', // 全域通用測試管理員帳號
      name: '超級管理員',        // 顯示名稱
      password: '123456789'      // 預設密碼 (9位數)
    };

    let storedUsers = JSON.parse(localStorage.getItem('survey_users') || '[]');
    
    // 移除舊有的 test@gmail.com (如果有)，確保以最新的憑證為準
    storedUsers = storedUsers.filter((u: any) => u.account !== testAccount.account);
    
    // 將最新的管理員帳號加入列表
    storedUsers.push(testAccount);
    localStorage.setItem('survey_users', JSON.stringify(storedUsers));
  }
}
