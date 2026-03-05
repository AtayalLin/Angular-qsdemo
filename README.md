# QSDemo - 企業級問卷管理系統 (Enterprise Questionnaire System)

![Angular](https://img.shields.io/badge/Angular-19.0.0-dd0031.svg?style=for-the-badge&logo=angular)
![SCSS](https://img.shields.io/badge/SCSS-Responsive-hotpink.svg?style=for-the-badge&logo=sass)
![Status](https://img.shields.io/badge/Status-Stable-success.svg?style=for-the-badge)

QSDemo 是一個現代化、響應式且具備高度互動性的問卷管理平台。本專案採用 Angular 框架開發，結合了最新的 Glassmorphism 視覺設計風格，提供使用者與管理者流暢的操作體驗。

## 🔗 線上展示 (Live Demo)

您可以透過以下連結即時體驗系統功能：
> **[前往線上展示 QSDemo Live](https://AtayalLin.github.io/Angular-qsdemo/)**

---

## 🏗️ 管理者問卷中心功能架構 (Admin Panel Architecture)

管理者後台提供了一站式的問卷生命週期管理工具，其核心功能架構如下：

```text
問卷管理中心 (Admin Panel)
│
├── 📝 問卷管理系統 (Survey Management)
│   ├── 批次管理模式：支援多選問卷進行一鍵批次刪除，提升管理效率
│   ├── 智慧佈局功能列：自動適應不同數量的功能按鈕，保持 2x2 對稱排版
│   ├── 狀態生命週期：支援草稿儲存、即時發佈、暫停填寫與永久刪除
│   └── 側邊管理面板：即時顯示選取計數，具備流暢的滑入動畫
│
├── 🛠️ 動態題目編輯器 (Question Editor)
│   ├── 多樣化題型：支援單選 (Single)、多選 (Multi-select) 與文字簡答 (Text)
│   ├── 靈活排序系統：支援題目即時上移、下移調整順序
│   └── 進階邏輯跳題 (Logic Branching)：根據前一題答案決定顯示邏輯
│
└── 📊 統計分析中心 (Data Analytics)
    ├── 數據視覺化：整合 Chart.js，以環狀圖 (Doughnut) 展示分布
    └── 反饋明細：完整列出每位填答者的詳細回饋內容
```

---

## 🌟 最新功能與優化 (2026.03 Update)

### 🎨 視覺與介面設計 (UI/UX)
- **Glassmorphism 風格**：全站採用毛玻璃特效、柔和漸層與深邃陰影，打造精緻的企業級質感。
- **智慧型彈性佈局**：
  - **2x2 功能網格**：列表操作區自動偵測按鈕數量，確保 3 或 4 個按鈕時依然保持對齊與置中。
  - **自動適應 Grid**：徹底移除橫向捲軸，完美適應各種螢幕斷點。
- **專業級彈窗系統**：
  - **語義化設計**：刪除彈窗(Danger)與編輯彈窗(Info)具備專屬色系與圖示。
  - **層次化標題**：中文主標 + 英文副標 + 詳細描述，提供極佳的閱讀引導。

### 🚀 核心模組功能

#### 1. 問卷大廳 (Survey Hall)
- **批次管理模式**：整合至搜尋區塊右上角，一鍵啟動勾選模式與側邊管理面板。
- **進階過濾器**：整合圖示化的搜尋面板，支援多重交叉篩選。
- **Premium 登入體驗**：具備背景磨砂遮罩的全螢幕置中彈窗，支援密碼顯示切換。

#### 2. 會員中心 (Member Dashboard)
- **安全性設定**：整合帳號密碼修改功能，具備與註冊頁面一致的「眼睛」切換安全 UI。
- **個人儀表板**：優化資訊顯示空間，問卷標題支援自動換行與長字串保護。

---

## 🛠️ 技術棧 (Tech Stack)

- **Frontend Framework**: Angular 19+ (Standalone Components)
- **Styling**: SCSS (Sass), CSS Grid, Flexbox
- **Icons**: FontAwesome (Free)
- **State Management**: RxJS (Basic)

## 📦 安裝與執行 (Installation)

```bash
# 1. 複製專案
git clone https://github.com/your-username/qsdemo.git

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
ng serve
```

## 📝 版本紀錄

- **v2.2.0 (2026-03-04)**
  - [Feat] 新增管理員「批次管理模式」與側邊動作面板。
  - [Feat] 實作批次刪除 API 連動與防呆警示系統。
  - [Style] 優化列表功能按鈕之 2x2 智慧佈局。
  - [Style] 重構彈窗標題結構，提升視覺專業度。
  - [Fix] 修正登入表單之 ngModel 繫結錯誤。

---
© 2026 QSDemo Team. All Rights Reserved.
