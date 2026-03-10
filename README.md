# 📊 QSDemo - 專業級問卷管理系統
### Enterprise Questionnaire System

![Angular](https://img.shields.io/badge/Angular-19.1.5-dd0031.svg?style=for-the-badge&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.4.x-6DB33F.svg?style=for-the-badge&logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1.svg?style=for-the-badge&logo=mysql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6.svg?style=for-the-badge&logo=typescript)
![Status](https://img.shields.io/badge/Status-Fully_Integrated-success.svg?style=for-the-badge)

QSDemo 是一個前後端完全分離的企業級問卷管理平台。前端採用 Angular 19 (Standalone Components) 架構，後端整合 Spring Boot 與 MySQL 實現資料持久化。系統支援多權限管理、完整填答流程、歷史紀錄查閱與管理員後台操作。

> ⚠️ **注意**：本 Repository 為**前端專案**。後端 Spring Boot 專案請見：
> **[👉 quiz_1141121 (後端 Repository)](https://github.com/AtayalLin/quiz_1141121)**

---

## 🔗 線上體驗 (Live Demo)

> **[👉 立即進入 QSDemo Live 👈](https://AtayalLin.github.io/Angular-qsdemo/)**

> ⚠️ GitHub Pages 為靜態前端展示，部分需要後端 API 的功能（登入、送出填答等）須在本機啟動後端才能正常運作。UI 操作流程與頁面切換可完整體驗。

---

## 🗂️ 專案結構 (Project Structure)

```
src/
├── index.html                        # 應用程式入口 HTML
├── main.ts                           # Angular 啟動點
├── styles.scss                       # 全域樣式
│
└── app/
    ├── app.component.*               # 根元件
    ├── app.config.ts                 # Angular 應用程式設定（HttpClient、Router 等）
    ├── app.routes.ts                 # 全域路由設定
    ├── survey.service.ts             # ★ 核心服務：所有 API 呼叫集中於此
    ├── http-error.interceptor.ts     # HTTP 錯誤攔截器（統一處理 API 異常）
    │
    └── page/
        ├── survey-list/              # 📋 問卷列表首頁（搜尋、篩選、登入入口）
        ├── survey-admin/             # ⚙️  管理員後台（新增/編輯問卷、題目管理）
        ├── survey-question/          # ✏️  填答頁面（題目渲染、作答邏輯）
        ├── survey-preview/           # 👁️  填答預覽頁（送出前確認、歷史查閱）
        ├── survey-result/            # 📈 統計結果頁（各題選項分佈圖表）
        ├── survey-member/            # 👤 會員中心（個人資料、填答歷史）
        └── survey-register/          # 📝 註冊頁面
```

---

## 🧭 完整操作流程 (User Flow)

### 👥 一般使用者流程

```
[首頁：問卷列表]
    │
    ├─ 未登入 ──→ 點「登入/註冊」──→ [登入彈窗] ──→ 登入成功 ──→ 回首頁
    │                                               └─ 新用戶 ──→ [註冊頁]
    │
    ├─ 已登入 ──→ 右上角顯示「您好, OOO」+ 「會員中心」按鈕
    │
    ├─ 搜尋問卷（關鍵字 / 類型 / 狀態 / 日期區間）
    │
    └─ 點「開始填寫」
            │
            ↓
    [填答頁面：survey-question]
        - 渲染題目（單選 / 複選 / 開放題）
        - 承上題邏輯：父題未答時子題灰化
        - 必填題驗證
        - 填寫基本資料（依問卷設定顯示姓名/電話/信箱欄位）
            │
            ↓ 點「預覽並送出」
    [預覽頁面：survey-preview]
        - 顯示所有題目與填入答案
        - 點「返回修改」→ 回填答頁（答案保留）
        - 點「確認送出」→ 呼叫後端 API → 跳回問卷列表
```

---

### 👤 會員中心流程

```
[首頁] ──→ 點「會員中心」
                │
                ↓
    [會員中心：survey-member]
        │
        ├─ 個人資料區
        │     ├─ 點「編輯」→ 修改姓名/電話
        │     ├─ 點「儲存」→ 呼叫 update_profile API
        │     ├─ 修改密碼（需輸入舊密碼驗證）
        │     └─ 點頭像 → 選取圖片 → 上傳至後端
        │
        └─ 填答歷史紀錄區
              ├─ 支援關鍵字搜尋 + 狀態篩選（已送出/已過期）
              ├─ 分頁顯示（每頁 4 筆）
              ├─ 點「檢視」→ 呼叫 feedback API
              │       └─→ [預覽頁面（唯讀模式）]：高亮顯示當時答案
              └─ 點「刪除」→ 彈窗確認 → 移除該筆紀錄
```

---

### 🔑 管理員流程

```
[首頁] ──→ 點「登入/註冊」──→ 以管理員帳號登入
                                    │
                                    ↓ 登入後右上角顯示「問卷管理中心」
                                    │
                ┌───────────────────┴──────────────────────┐
                │                                          │
    [首頁（管理員視角）]                        [問卷管理中心：survey-admin]
        │                                          │
        ├─ 批次管理模式                             ├─ 新增問卷
        │     ├─ 勾選多份問卷                      │     ├─ 設定標題、類型、日期
        │     └─ 批次刪除                          │     ├─ 設定收集欄位（姓名/電話/信箱）
        │                                          │     └─ 新增題目（單選/複選/開放題）
        ├─ 每份問卷可執行：                         │
        │     ├─「發佈」/ 「取消發佈」             └─ 編輯現有問卷
        │     ├─「編輯」→ 進入管理中心                    └─ 修改題目、選項、設定
        │     ├─「刪除」→ 彈窗確認
        │     └─「檢視結果」→ [統計結果頁]
        │
        └─ [統計結果頁：survey-result]
              └─ 顯示各題選項的填答人數與比例
```

---

## 🏗️ 系統架構與核心邏輯 (Architecture)

### 路由結構 (app.routes.ts)

| 路徑 | 元件 | 說明 |
|------|------|------|
| `/surveys` | SurveyListComponent | 問卷列表首頁 |
| `/surveys/:id/question` | SurveyQuestionComponent | 填答頁 |
| `/surveys/:id/preview` | SurveyPreviewComponent | 預覽/歷史查閱頁 |
| `/surveys/:id/result` | SurveyResultComponent | 統計結果頁 |
| `/member` | SurveyMemberComponent | 會員中心 |
| `/admin` | SurveyAdminComponent | 管理員後台 |
| `/register` | SurveyRegisterComponent | 註冊頁 |

### 核心服務 API 對照 (survey.service.ts)

| 方法 | HTTP | 後端路徑 | 功能 |
|------|------|----------|------|
| `getSurveys()` | GET | `/quiz/getAll` | 取得所有問卷清單 |
| `getSurveyById(id)` | GET | `/quiz/get_questions_List` | 取得問卷題目 |
| `login(email, pwd)` | POST | `/quiz/login` | 使用者登入 |
| `register(user)` | POST | `/quiz/register` | 使用者註冊 |
| `submitFillin(payload)` | POST | `/quiz/fillin` | 提交填答 |
| `getFeedback(quizId, email)` | POST | `/quiz/feedback` | 取得填答歷史內容 |
| `getUserHistory(email)` | GET | `/quiz/get_history` | 取得填答歷史清單 |
| `updateUserProfile(user)` | POST | `/quiz/update_profile` | 更新個人資料 |
| `changePassword(...)` | POST | `/quiz/change_password` | 修改密碼 |
| `uploadAvatar(file, email)` | POST | `/quiz/upload_avatar` | 上傳頭像 |
| `publishSurvey(id)` | POST | `/quiz/publish` | 發佈問卷 |
| `unpublishSurvey(id)` | POST | `/quiz/unpublish` | 取消發佈 |
| `createSurvey(payload)` | POST | `/quiz/create` | 新增問卷 |
| `updateSurvey(payload)` | POST | `/quiz/update` | 更新問卷 |
| `deleteSingleSurvey(id)` | GET | `/quiz/delete_single` | 單筆刪除 |
| `deleteBatchSurveys(ids)` | POST | `/quiz/delete` | 批次刪除 |

### 頁面間資料傳遞原理

填答頁 → 預覽頁 → 後端這條路徑採用 Angular Router `state` 傳遞資料，不依賴 localStorage，確保頁面重整後資料不殘留：

```
survey-question  ──(router state)──▶  survey-preview  ──(HTTP POST)──▶  後端 /fillin
     ▲                                      │
     └──────────(router state)──────────────┘
              （點「返回修改」時答案保留）
```

---

## 🛠️ 本地端安裝與啟動 (Local Setup)

### 前置需求

| 工具 | 建議版本 |
|------|----------|
| Node.js | 20.x 以上 |
| Angular CLI | 19.x |
| MySQL | 8.0 |
| Java | 17 以上（後端用） |

### Step 1 — 資料庫設定

```sql
-- 建立資料庫
CREATE DATABASE quiz_1141121;

-- ⚠️ 頭像欄位需為 LONGTEXT，否則 Base64 字串會被截斷
ALTER TABLE user MODIFY COLUMN avatar LONGTEXT;
```

詳細的資料表 Schema 與後端啟動說明請參考：
👉 **[後端 Repository — quiz_1141121](https://github.com/AtayalLin/quiz_1141121)**

---

### Step 2 — 啟動後端

```bash
# Clone 後端專案
git clone https://github.com/AtayalLin/quiz_1141121.git

# 以 IntelliJ IDEA 或 Maven 啟動 Spring Boot
# 預設監聽 http://localhost:8080
```

---

### Step 3 — 啟動前端

```bash
# Clone 前端專案
git clone https://github.com/AtayalLin/Angular-qsdemo.git
cd Angular-qsdemo

# 安裝依賴
npm install

# 啟動開發伺服器
ng serve
```

瀏覽器開啟 `http://localhost:4200` 即可。

> 若後端網址有變動，請修改 `src/app/survey.service.ts` 中的：
> ```typescript
> private readonly API_BASE = 'http://localhost:8080/quiz';
> ```

---

## 🚀 版本紀錄 (Changelog)

### v2.5.0 (2026-03-10) — 核心代碼註解與架構整理
- **[Docs]** 重構 README，補充完整操作流程、路由說明與 API 對照表
- **[Code]** 全專案核心元件加入詳細中文技術註解（原理、功能、資料流）
- **[Fix]** 修正 `getDisplayStatus()` 接受 `null` 型別導致的 TS 編譯錯誤
- **[Fix]** 補全 `Survey` interface 缺少的 `start_date`、`end_date`、`publishStatus` 欄位
- **[Feature]** 新增 `unpublishSurvey()` 方法，實作取消發佈功能

### v2.0.0 (2026-02-xx) — 前後端全面整合
- **[Feature]** 完成前後端 API 串接（登入、填答、歷史紀錄、頭像上傳）
- **[Fix]** 修正 `FeedbackReq` getter 寫死回傳值導致 404 的問題
- **[Fix]** 修正預覽頁 `quizId` 傳遞遺失的問題
- **[UI]** 採用 Glassmorphism 毛玻璃特效優化登入彈窗與 Toast 提示

### v1.0.0 — 基礎功能建立
- 問卷列表、填答、管理員後台基本功能完成

---

## 🛠️ 開發技術棧 (Tech Stack)

- **Frontend**: Angular 19 (Standalone Components, HttpClient, Router State)
- **Backend**: Spring Boot 3.x RESTful API（[獨立 Repository](https://github.com/AtayalLin/quiz_1141121)）
- **Database**: MySQL 8.x
- **Styling**: SCSS (Mobile First RWD)
- **Icons**: FontAwesome 6

---

© 2026 QSDemo Engineering Team. Developer: AtayalLin. All Rights Reserved.