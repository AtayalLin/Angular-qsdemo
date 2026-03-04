# QSDemo - 企業級問卷管理系統 (Enterprise Questionnaire System)

![Angular](https://img.shields.io/badge/Angular-19.0.0-dd0031.svg?style=for-the-badge&logo=angular)
![SCSS](https://img.shields.io/badge/SCSS-Responsive-hotpink.svg?style=for-the-badge&logo=sass)
![Status](https://img.shields.io/badge/Status-Stable-success.svg?style=for-the-badge)

QSDemo 是一個現代化、響應式且具備高度互動性的問卷管理平台。本專案採用 Angular 框架開發，結合了最新的 Glassmorphism 視覺設計風格，提供使用者與管理者流暢的操作體驗。

## 🔗 線上展示 (Live Demo)

您可以透過以下連結即時體驗系統功能：
> **[前往線上展示 QSDemo Live](https://AtayalLin.github.io/Angular-qsdemo/)**

---

## 🌟 最新功能與優化 (2026.03 Update)

### 🎨 視覺與介面設計 (UI/UX)
- **Glassmorphism 風格**：全站採用毛玻璃特效、柔和漸層與深邃陰影，打造精緻的企業級質感。
- **完全響應式佈局 (RWD)**：
  - **自動適應 Grid**：列表頁面採用彈性網格技術，自動適應 1200px / 992px / 768px 等多種斷點，徹底移除橫向捲軸。
  - **行動版優化**：在手機裝置上自動轉換為卡片式閱覽模式，操作更直覺。
- **互動反饋**：按鈕、卡片與輸入框皆具備細緻的懸浮 (Hover) 與聚焦 (Focus) 動畫。

### 🚀 核心模組功能

#### 1. 問卷大廳 (Survey Hall)
- **進階篩選器**：整合式搜尋面板，支援關鍵字、日期區間、問卷類型與狀態的多重交叉篩選。
- **視覺化狀態標籤**：膠囊型狀態指示燈 (Active/Closed)，支援自動換行與長字串保護。
- **Premium 登入體驗**：
  - 全螢幕置中彈窗，具備背景磨砂遮罩。
  - 整合密碼顯示/隱藏切換 (Toggle Visibility)。
  - 專業的表單驗證與錯誤提示。

#### 2. 會員中心 (Member Dashboard)
- **個人儀表板**：整合個人資料與填答歷史紀錄。
- **安全性設定**：新增密碼修改功能，包含舊密碼驗證與新密碼強度確認 UI。
- **問卷歷史追蹤**：
  - 視覺化進度條 (Progress Bar) 顯示草稿填寫進度。
  - 歷史問卷查詢與「繼續填寫」快捷入口。

#### 3. 管理者後台 (Admin Panel)
- 問卷發佈、編輯、刪除與暫停填寫的完整生命週期管理。
- 防呆機制：刪除與重大變更前的二次確認彈窗。

## 🛠️ 技術棧 (Tech Stack)

- **Frontend Framework**: Angular 19+ (Standalone Components)
- **Styling**: SCSS (Sass), CSS Grid, Flexbox
- **Icons**: FontAwesome (Free)
- **State Management**: RxJS (Basic)

## 📦 安裝與執行 (Installation)

請確保您的環境已安裝 Node.js (v20+) 與 Angular CLI。

```bash
# 1. 複製專案
git clone https://github.com/your-username/qsdemo.git

# 2. 進入目錄
cd qsdemo

# 3. 安裝依賴
npm install

# 4. 啟動開發伺服器
ng serve
```

啟動後，請瀏覽器打開 `http://localhost:4200/` 即可開始使用。

## 📂 專案結構

```
src/app/
├── page/
│   ├── survey-list/      # 問卷列表、搜尋、登入彈窗
│   ├── survey-member/    # 會員中心、個人設定、歷史紀錄
│   ├── survey-admin/     # 管理者後台功能
│   └── survey-result/    # 統計結果圖表
├── survey.service.ts     # 資料流服務
└── ...
```

## 📝 版本紀錄

- **v2.1.0 (2026-03-04)**
  - [UI] 重構列表頁 CSS Grid，移除橫向捲軸。
  - [Feat] 會員中心新增密碼修改功能。
  - [Fix] 優化彈窗定位 (Fixed Positioning) 與遮罩層級。
  - [Style] 全面升級為 Glassmorphism 設計語言。

---
© 2026 QSDemo Team. All Rights Reserved.
