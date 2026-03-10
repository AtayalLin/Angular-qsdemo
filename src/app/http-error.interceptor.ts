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
 * 全局 HTTP 錯誤攔截器
 * 原理：利用 Angular 的 HttpInterceptor 介面攔截所有流出的 HTTP 請求與流入的響應。
 * 功用：統一處理全站 API 的錯誤提示與自動重試邏輯，避免在每個元件中重複編寫 catchError 代碼。
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      /**
       * 自動重試機制
       * 原理：當發生網路錯誤（例如 DNS 解析失敗或斷網）時，retry 會自動重新訂閱流。
       * 限制：目前設定為重試 1 次，僅針對 status === 0 的連線錯誤。
       */
      retry({
        count: 1,
        delay: (error) => {
          if (error instanceof HttpErrorResponse && error.status === 0) {
            return throwError(() => error);
          }
          return throwError(() => error);
        },
      }),
      /**
       * 錯誤捕獲與轉譯
       * 原理：將後端回傳的 HttpErrorResponse 物件轉換為使用者友好的中文訊息字串。
       * 包含：401 自動登出處理、403 權限攔截以及 500 伺服器崩潰處理。
       */
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // 用戶端/瀏覽器端錯誤
          errorMessage = `錯誤: ${error.error.message}`;
          console.error('客戶端錯誤:', error.error);
        } else {
          // 伺服器端錯誤 (Backend returned an unsuccessful response code)
          switch (error.status) {
            case 0:
              errorMessage = '無法連接至伺服器，請檢查網路連接或稍後重試。';
              break;
            case 401:
              errorMessage = '登入已過期，請重新登入。';
              // 安全清理：發現 token 失效或 401 時，主動清除本地快取
              localStorage.removeItem('currentUser');
              localStorage.removeItem('isAdmin');
              break;
            case 500:
              errorMessage = '伺服器內部錯誤，請聯繫管理員。';
              break;
            default:
              errorMessage = `發生未預期的錯誤 (${error.status})，請稍後重試。`;
          }
        }

        console.error('HTTP 攔截器捕捉異常:', errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
