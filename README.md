# 📊 QSDemo - 專業級問卷管理系統 (Enterprise Questionnaire System)

![Angular](https://img.shields.io/badge/Angular-19.1.5-dd0031.svg?style=for-the-badge&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.x-6DB33F.svg?style=for-the-badge&logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=for-the-badge&logo=mysql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg?style=for-the-badge&logo=typescript)
![Status](https://img.shields.io/badge/Status-Fully_Integrated-success.svg?style=for-the-badge)

QSDemo 是一個現代化、高性能且前後端完全分離的企業級問卷管理平台。專案採用 Angular 19 (Standalone) 驅動前端，後端整合 Spring Boot 與 MySQL 實現資料持久化，並針對大數據量搜尋、多權限管理以及使用者填答體驗進行深度優化。

## 🔗 線上體驗 (Live Demo)
您可以透過 GitHub Pages 即時體驗系統介面與互動邏輯：
> **[👉 立即進入 QSDemo Live 👈](https://AtayalLin.github.io/Angular-qsdemo/)**

---

## 🏗️ 系統架構與核心邏輯 (System Architecture)

### 1. 📂 問卷生命週期管理 (Questionnaire Lifecycle)
- **動態引擎**：支援「單選、複選、開放題」三種題型，前端即時渲染後端題目結構。
- **發佈控制**：實作「草稿/已發佈/已過期」狀態機切換邏輯。
- **批次處理**：支援多選問卷進行批次刪除與發佈，顯著提升管理效率。

### 2. 🔐 身份認證與安全機制 (Auth & Security)
- **多權限體系**：區分「系統管理員」與「一般會員」，管理員具備問卷編輯、發佈與結果匯出權限。
- **測試沙盒模式**：在 API 異常或斷網情況下，提供開發者測試憑證 (`test@gmail.com`) 登入機制，確保前端功能的穩定展示。
- **資料保護**：密碼欄位整合顯示切換與前端正則校驗 (Regex Validation)。

### 3. 📝 填答與數據分析 (Filling & Analytics)
- **智慧填答確認**：在正式提交前提供「填答預覽頁面」，支援「上一步」返回修改，並自動持久化使用者已選填內容。
- **歷史回溯**：會員中心可根據 Email 撈取完整的填答歷史紀錄。
- **高亮對比顯示**：檢視歷史紀錄時，系統自動將個人答案與該問卷的所有選項進行對比高亮。

---

## 🚀 2026.03 更新亮點 (Key Updates)

- **[註解增強]**：全專案核心邏輯程式碼加入詳細技術註解，解釋 API 串接原理與 RXJS 資料流處理。
- **[UI 深度優化]**：
  - 採用 Glassmorphism (毛玻璃) 特效優化登入彈窗與 Toast 提示。
  - 完美適應各式 RWD 螢幕解析度，解決所有溢出與跑版問題。
- **[性能提升]**：
  - 實作前端分頁 (Pagination) 與多維度過濾器，提升大數據量下的搜尋流暢度。
  - 整合 `HTTP Error Interceptor` 統一處理 API 異常狀態，提供使用者友好的錯誤訊息提示。

---

## 🛠️ 開發環境 (Development Tech Stack)

- **Frontend**: Angular 19 (Standalone Components, HttpClient, Reactive Forms)
- **Backend Interface**: Spring Boot 3.x RESTful APIs
- **Storage**: MySQL 8.x + LocalStorage Persistence
- **Styling**: SCSS (Mobile First Architecture)
- **Icons**: FontAwesome 6 (Pro Icons Library)

## 📦 安裝與啟動 (Installation)

1. **複製專案**
   ```bash
   git clone https://github.com/AtayalLin/Angular-qsdemo.git
   cd Angular-qsdemo
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **啟動開發伺服器**
   ```bash
   ng serve
   ```
   瀏覽器打開 `http://localhost:4200` 即可看到效果。

---

## 📅 版本紀錄 (Changelog)

- **v2.5.0 (2026-03-10) - 核心代碼註解與文檔大更新**
  - [Docs] 重構 README.md，新增系統架構與技術細節說明。
  - [Code] 針對 `SurveyService` 與 `SurveyListComponent` 加入深度技術註解。
  - [Fix] 修正發佈狀態判斷邏輯，強化資料與後端對齊的穩定性。

---
© 2026 QSDemo Engineering Team. 開發者：AtayalLin. All Rights Reserved.
