# QSDemo - 企業級問卷管理系統 (Enterprise Questionnaire System)

![Angular](https://img.shields.io/badge/Angular-19.0.0-dd0031.svg?style=for-the-badge&logo=angular)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-6DB33F.svg?style=for-the-badge&logo=springboot)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1.svg?style=for-the-badge&logo=mysql)
![Status](https://img.shields.io/badge/Status-Fully_Integrated-success.svg?style=for-the-badge)

QSDemo 是一個現代化、響應式且與後端完全整合的問卷管理平台。本專案前端採用 Angular 19 開發，後端與 Eclipse Spring Boot 及 MySQL 實作了完整的資料同步與調閱機制。

## 🔗 線上展示 (Live Demo)
您可以透過以下連結即時體驗系統介面：
> **[前往線上展示 QSDemo Live](https://AtayalLin.github.io/Angular-qsdemo/)**

---

## 🏗️ 系統全流程架構 (Full Integration Workflow)

### 1. 管理者：問卷生命週期
- **動態建立**：支援自訂標題、期間與個資收集開關（姓名/電話/信箱）。
- **靈活編輯**：支援單選、複選、開放題之動態增刪，並具備「承上題」邏輯設定。
- **資料儲存**：透過 `POST /quiz/create` 與 `POST /quiz/update` 與 MySQL 同步。

### 2. 一般會員：安全與權限
- **帳號同步**：實作註冊與登入功能，資料持久化儲存於 MySQL `user` 表。
- **安全切換**：修改密碼與註冊頁面整合「眼睛」切換功能，保護使用者輸入。
- **個人資料**：支援即時修改姓名、電話並同步更新至後端。

### 3. 填答與調閱機制
- **同步填答**：問卷填寫完畢後，透過 `POST /quiz/fillin` 將答案、題號、Email 關聯存入資料庫。
- **歷史回顧**：會員中心自動根據 Email 撈取 `fillin` 紀錄，顯示「填過哪些問卷」。
- **全選項預覽**：檢視紀錄時，動態從後端抓取問卷結構，顯示該題「所有」選項並高亮個人答案。

---

## 🌟 技術優化亮點 (2026.03 Integration Update)

### 🎨 專業級 UI/UX
- **零跑版設計**：移除所有橫向捲軸，完美適應各種螢幕解析度。
- **智能導航**：預覽確認頁面實作「上一步」功能，自動恢復先前的填答狀態，方便修改。
- **高級毛玻璃**：登入彈窗與 Toast 通知採用精緻的 Glassmorphism 特效。

---

## 🛠️ 技術棧 (Tech Stack)

- **Frontend**: Angular 19+ (Standalone, HttpClient, Reactive Forms)
- **Backend**: Java (Eclipse), Spring Boot 3.x
- **Database**: MySQL 8.x (Table: quiz, questions, fillin, user)
- **Icons**: FontAwesome 6 (Free)

## 📦 版本紀錄

- **v2.4.0 (2026-03-05) - 核心功能完整版**
  - [Feat] 實作問卷建立之個資開關同步（Name/Phone/Email）。
  - [Feat] 修復問卷預覽為「動態渲染」，同步反應後端最新題目結構。
  - [Feat] 實作填答頁面「上一步」之資料自動恢復邏輯。
  - [Fix] 修正 API Payload 屬性名稱，對齊 Java `@JsonProperty` 定義。
  - [Fix] 強化 `SurveyService` 之 API 串接完整度（Create/Update/Fill/History）。

---
© 2026 QSDemo Team. All Rights Reserved.
