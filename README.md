# QSDemo - 企業級問卷管理系統 (Enterprise Questionnaire System)

![Angular](https://img.shields.io/badge/Angular-19.0.0-dd0031.svg?style=for-the-badge&logo=angular)
![SCSS](https://img.shields.io/badge/SCSS-Responsive-hotpink.svg?style=for-the-badge&logo=sass)
![Status](https://img.shields.io/badge/Status-Stable-success.svg?style=for-the-badge)

QSDemo 是一個現代化、響應式且具備高度互動性的問卷管理平台。本專案採用 Angular 框架開發，結合了最新的 Glassmorphism 視覺設計風格，提供使用者與管理者流暢的操作體驗。

## 🔗 線上展示 (Live Demo)

您可以透過以下連結即時體驗系統功能：
> **[前往線上展示 QSDemo Live](https://AtayalLin.github.io/Angular-qsdemo/)**

---

## 🏗️ 系統功能架構 (System Architecture)

### 👑 管理者後台 (Admin Panel)
- **問卷生命週期管理**：支援草稿、發佈、暫停與永久刪除。
- **批次管理模式**：一鍵啟動多選模式，配合側邊即時統計面板進行批次刪除。
- **智慧按鈕網格**：操作區採 2x2 佈局，奇數按鈕自動置中，保持視覺對稱。
- **動態題目編輯器**：支援單選、多選、開放題，並具備邏輯跳題功能。

### 👤 會員中心 (Member Dashboard)
- **帳號安全設定**：可修改個人資料與密碼，整合「隱藏/顯示」眼睛切換功能。
- **活動紀錄追蹤**：完整列出歷史填答，支援已過期問卷的持續檢視與紀錄移除。
- **全選項對照顯示**：檢視紀錄時，列出該題「所有」選項並醒目高亮個人答案，方便對照。

---

## 🌟 最新功能與優化 (2026.03 Premium Update)

### 🎨 視覺與介面設計 (UI/UX)
- **零跑版排版機制**：
  - **移除橫向捲軸**：優化 Grid 比例與溢出保護，確保在大中小螢幕皆不溢出。
  - **自動換行保護**：狀態標籤與長標題支援智慧換行，防止字數過多被截斷。
- **專業級 Toast 系統**：修復定位邏輯，通知不再隨捲動消失，始終固定於視窗右上角。
- **精緻化彈窗 (Modal)**：
  - **尺寸優化**：縮減彈窗寬度至 420px，提升視覺精緻度。
  - **安全邊距**：實作 `max-height` 保護，確保視窗不碰觸螢幕邊緣且支援內部滾動。

### 🚀 核心模組功能升級

#### 1. 填答紀錄檢視 (Answer Record)
- **全視角對照**：改變以往僅顯示答案的做法，改為顯示該題完整選項庫。
- **醒目高亮樣式**：個人答案套用橘色漸層、深色邊框與實心圖示，極具辨識度。

#### 2. 問卷大廳 (Survey Hall)
- **過期狀態優化**：狀態文字更正為「已過期」，並在非管理員點擊時彈出警告提示。
- **Premium 登入體驗**：加入功能引導圖示、輸入框前綴 Icon 與高質感背景遮罩。

---

## 🛠️ 技術棧 (Tech Stack)

- **Frontend**: Angular 19+ (Standalone Components), SCSS, Chart.js
- **Backend**: Eclipse (Spring Boot), MySQL (v8.0+)
- **Security**: BCrypt Password Encoding
- **Infrastructure**: HttpClient (CORS Enabled)

## 📦 安裝與執行 (Installation)

```bash
# 1. 複製專案
git clone https://github.com/AtayalLin/Angular-qsdemo.git

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
ng serve
```

## 📝 版本紀錄

- **v2.4.0 (2026-03-05)**
  - [Backend] 完成 MySQL 結構優化，新增 `avatar` 與 `join_date` 欄位。
  - [Backend] 實作 `UserService` 與 `UserDao`：支持加密登入、註冊及個人資料同步更新。
  - [Backend] 實作 `FillinService`：支持跨表查詢，撈取會員專屬填答歷史紀錄。
  - [Feat] 準備將前端 `SurveyService` 模擬資料切換為真正的 API 請求。

- **v2.3.0 (2026-03-05)**
  - [Feat] 實作會員密碼修改功能，整合安全眼睛切換圖示。
  - [Feat] 優化歷史紀錄檢視模式：顯示完整題目選項並高亮個人答案。
  - [Fix] 徹底修復列表頁橫向捲軸問題，優化 RWD 斷點表現。

---
© 2026 QSDemo Team. All Rights Reserved.
