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
 * 功用：統一處理所有 API 請求的錯誤，提供一致的錯誤消息和日誌
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      // 自動重試失敗的非 POST 請求
      retry({
        count: 1,
        delay: (error) => {
          // 只重試網絡錯誤，不重試 HTTP 錯誤
          if (error instanceof HttpErrorResponse) {
            if (error.status === 0) {
              // 網絡錯誤，允許重試
              return throwError(() => error);
            }
          }
          return throwError(() => error);
        },
      }),
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';

        if (error.error instanceof ErrorEvent) {
          // 用戶端錯誤
          errorMessage = `錯誤: ${error.error.message}`;
          console.error('客戶端錯誤:', error.error);
        } else {
          // 伺服器端錯誤
          console.error(
            `Backend returned code ${error.status}, body was:`,
            error.error,
          );

          switch (error.status) {
            case 0:
              errorMessage = '無法連接至伺服器，請檢查網路連接或稍後重試。';
              break;
            case 400:
              errorMessage = error.error?.message || '請求參數不正確。';
              break;
            case 401:
              errorMessage = '登入已過期，請重新登入。';
              // 可在此處觸發重新登入流程
              localStorage.removeItem('currentUser');
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

        // 記錄錯誤詳情
        console.error(errorMessage);
        return throwError(() => new Error(errorMessage));
      }),
    );
  }
}
