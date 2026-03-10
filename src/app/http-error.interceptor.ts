import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

/**
 * 全局 HTTP 錯誤攔截器 - 原理：攔截所有 HttpClient 發出的請求，統一處理連線失敗、伺服器錯誤等異常情況
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      // 自動重試失敗請求 - 原理：當發生非 HTTP 錯誤（如 status 0 網路中斷）時，自動嘗試重新連接 1 次
      retry({
        count: 1,
        delay: (error) => {
          if (error instanceof HttpErrorResponse && error.status === 0) {
            return throwError(() => error);
          }
          return throwError(() => error);
        },
      }),
      // 捕獲異常並轉譯 - 原理：將後端回傳的 HttpErrorResponse 狀態碼轉換為使用者看得懂的中文提示
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // 用戶端錯誤 (例如：斷網或瀏覽器異常)
          errorMessage = `錯誤: ${error.error.message}`;
          console.error('客戶端錯誤:', error.error);
        } else {
          // 伺服器端錯誤 (根據不同的 HTTP Status Code 進行分流處理)
          console.error(`伺服器回傳代碼 ${error.status}, 內容:`, error.error);

          switch (error.status) {
            case 0:
              errorMessage = '無法連接至伺服器，請檢查網路連接或稍後重試。';
              break;
            case 400:
              errorMessage = error.error?.message || '請求參數不正確。';
              break;
            case 401:
              errorMessage = '登入已過期，請重新登入。';
              localStorage.removeItem('currentUser'); // 清除過期資訊：確保安全性，強迫使用者重新驗證身份
              localStorage.removeItem('isAdmin');
              break;
            case 403:
              errorMessage = '您沒有權限執行此操作。';
              break;
            case 404:
              errorMessage = '所請求的資源不存在。';
              break;
            case 500:
              errorMessage = '伺服器內部錯誤，請聯繫管理員。';
              break;
            case 503:
              errorMessage = '伺服器暫時無法服務，請稍後重試。';
              break;
            default:
              errorMessage = `發生未預期的錯誤 (${error.status})，請稍後重試。`;
          }
        }

        console.error('HTTP 攔截器捕捉異常:', errorMessage);
        return throwError(() => new Error(errorMessage)); // 將格式化後的錯誤訊息向下傳遞給訂閱者
      }),
    );
  }
}
