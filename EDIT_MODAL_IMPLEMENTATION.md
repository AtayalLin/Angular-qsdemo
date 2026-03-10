# 📝 問卷編輯功能完整實裝報告

**功能名稱**: 問卷列表 - 編輯功能  
**實裝日期**: 2026-03-06  
**修改文件**: 3 個

---

## 🎯 功能概述

在管理員身份登入問卷列表時，每個問卷後方都有「編輯」按鈕。點擊編輯按鈕後，會彈出一個**精美專業的確認彈窗**，顯示問卷的基本信息（標題、分類、狀態），使用者確認後會跳轉到**問卷管理中心**並自動加載該問卷的所有信息，以便進行修改或增減題目。

---

## 📋 實裝詳情

### 1. **HTML 模板修改** (survey-list.component.html)

**添加內容**: 編輯確認彈窗

```html
@if (showEditModal) {
  <div class="modal-overlay edit-overlay" (click)="closeEditModal()">
    <div class="modal-content edit-modal-card" (click)="$event.stopPropagation()">
      <!-- 彈窗頭部：標題 + 圖示 -->
      <div class="modal-header">
        <div class="header-main">
          <div class="icon-box edit">
            <i class="fas fa-pencil-alt"></i>
          </div>
          <div class="title-text">
            <h2>編輯問卷 <span>Edit Survey</span></h2>
            <p>即將進入問卷編輯頁面，您可以修改問卷內容與題目</p>
          </div>
        </div>
        <button class="close-x" (click)="closeEditModal()">&times;</button>
      </div>

      <!-- 彈窗主體：問卷資訊卡片 -->
      <div class="modal-body edit-body">
        <div class="survey-info-box">
          <div class="info-row">
            <span class="info-label">
              <i class="fas fa-heading"></i> 問卷標題
            </span>
            <span class="info-value">{{ targetSurvey?.title }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">
              <i class="fas fa-tag"></i> 分類
            </span>
            <span class="info-value">{{ targetSurvey?.type }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">
              <i class="fas fa-toggle-on"></i> 狀態
            </span>
            <span class="info-value" [ngClass]="{
              'status-published': getDisplayStatus(targetSurvey) === '已發佈',
              'status-draft': getDisplayStatus(targetSurvey) !== '已發佈'
            }">
              {{ getDisplayStatus(targetSurvey) }}
            </span>
          </div>
        </div>
        <p class="warning-description edit-description">
          <i class="fas fa-info-circle"></i>
          編輯後可以立即更新問卷內容，已發佈的問卷修改後仍保持已發佈狀態。
        </p>
      </div>

      <!-- 彈窗底部：按鈕 -->
      <div class="modal-footer horizontal">
        <button class="btn-cancel-edit" (click)="closeEditModal()">
          取消操作
        </button>
        <button class="btn-edit-confirm" (click)="confirmEdit()">
          進入編輯頁面
        </button>
      </div>
    </div>
  </div>
}
```

**位置**: 在 `showLogoutModal` 彈窗之前

---

### 2. **TypeScript 邏輯修改** (survey-list.component.ts)

#### 修改了 `editSurvey()` 方法

**舊邏輯**: 只在問卷已發佈時才顯示彈窗  
**新邏輯**: 無論問卷狀態如何，都顯示編輯確認彈窗

```typescript
editSurvey(id: number) {
  const s = this.surveys.find((x) => x.id === id);
  if (s) {
    // 保存目標問卷信息到組件屬性
    this.targetSurvey = s;
    this.targetEditId = id;
    // 顯示編輯確認彈窗
    this.showEditModal = true;
  }
}
```

#### 改進了 `confirmEdit()` 方法

**新增功能**: 通過 `state` 傳遞完整的問卷對象

```typescript
confirmEdit() {
  if (this.targetEditId && this.targetSurvey) {
    // 傳遞完整的問卷資訊到管理中心
    this.router.navigate(['/admin'], {
      queryParams: { id: this.targetEditId },
      state: { survey: this.targetSurvey }  // ⭐ 新增
    });
    this.closeEditModal();
  }
}
```

#### `closeEditModal()` 保持不變

```typescript
closeEditModal() {
  this.showEditModal = false;
  this.targetEditId = null;
}
```

---

### 3. **SCSS 樣式設計** (survey-list.component.scss)

**新增內容**: 
- `.edit-overlay` - 編輯彈窗的遮罩層
- `.edit-modal-card` - 編輯彈窗容器
- `.survey-info-box` - 問卷信息卡片
- `.edit-body` - 彈窗主體區域
- 按鈕樣式: `.btn-cancel-edit`, `.btn-edit-confirm`

**設計特色**:
```scss
/* 黃金漸層背景 */
background: linear-gradient(135deg, #fffdf7 0%, #fff9f2 100%);

/* 柔和陰影效果 */
box-shadow: 0 45px 120px rgba(109, 76, 65, 0.22);

/* 精美圖示盒 */
.icon-box.edit {
  background: linear-gradient(135deg, #ffd95e, #f4a261);
  color: #fff;
}

/* 專業的資訊行 */
.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(240, 196, 168, 0.3);
}

/* 狀態標籤顏色 */
.status-published {
  color: #2a9d8f;
  background: rgba(42, 157, 143, 0.1);
}

.status-draft {
  color: #e76f51;
  background: rgba(231, 111, 81, 0.1);
}
```

---

## 🔄 完整的編輯流程

### 步驟 1: 管理員登入問卷列表
```
URL: http://localhost:4200/surveys
帳號: test@gmail.com
密碼: 123456789
```

### 步驟 2: 看到編輯按鈕
```
列表中每個問卷行的右側 "action" 欄位都有編輯按鈕
按鈕樣式: 黃色背景 (#ffd95e) + 棕色文字
```

### 步驟 3: 點擊編輯按鈕
```typescript
← 觸發 editSurvey(surveyId)
│
├─ 查找目標問卷數據 (targetSurvey)
├─ 保存問卷 ID (targetEditId)
└─ 顯示編輯確認彈窗 (showEditModal = true)
```

### 步驟 4: 彈窗顯示問卷信息
```
┌────────────────────────────────┐
│ ✏️  編輯問卷                    │  ✕
│    Edit Survey                 │
│ 即將進入問卷編輯頁面...         │
├────────────────────────────────┤
│ 📋  問卷資訊                    │
│                                │
│ 📝 問卷標題：市場調查問卷       │
│ 🏷️  分類：市場調查             │
│ ✓  狀態：已發佈                │
│                                │
│ ℹ️  編輯後可以立即更新問卷...   │
├────────────────────────────────┤
│ [取消操作]  [進入編輯頁面]     │
└────────────────────────────────┘
```

### 步驟 5: 確認編輯
```typescript
← 用戶點擊「進入編輯頁面」按鈕
│
├─ confirmEdit() 執行
├─ router.navigate(['/admin'], {
│   queryParams: { id: surveyId },
│   state: { survey: surveyObject }
│ })
└─ 跳轉到問卷管理中心
```

### 步驟 6: 管理中心加載問卷
```typescript
← survey-admin.component ngOnInit()
│
├─ 從路由 state 中讀取預加載的問卷數據
├─ 調用 loadSurveyData(id, preloadedSurvey)
│
├─ 設置: currentSurvey 對象
│       ├─ 標題
│       ├─ 分類
│       ├─ 說明
│       ├─ 開始/結束日期
│       └─ 發佈狀態
│
├─ 設置: basicInfoConfig (個資收集選項)
└─ 加載: questions[] (所有題目及選項)
```

### 步驟 7: 進行編輯
```
管理員現在可以：
✅ 修改問卷標題、說明、分類
✅ 新增、刪除、修改題目
✅ 調整題目順序
✅ 設置基本資料收集選項
✅ 編輯題目的承上題依賴
✅ 預覽效果
✅ 保存草稿或發佈
```

---

## 💡 技術特點

### 1. **數據傳遞優化**
```typescript
// 方式 1: 透過 queryParams (URL 參數)
{id: 123}

// 方式 2: 透過 state (隱藏參數) ⭐
{survey: {...}}  // 完整問卷對象

// 結合效果: 快速加載 + 備份查詢
```

### 2. **狀態管理**
```typescript
// 編輯彈窗專用變數
showEditModal: boolean = false;        // 彈窗顯示狀態
targetEditId: number | null = null;    // 目標問卷 ID
targetSurvey: Survey | null = null;    // 目標問卷完整數據
```

### 3. **樣式層次**
```
背景 (bg-wave)
  └─ 容器 (survey-wrapper)
       └─ 彈窗遮罩 (modal-overlay edit-overlay)
            └─ 彈窗內容 (modal-content edit-modal-card)
                 ├─ Header (icon + title)
                 ├─ Body (survey-info-box)
                 └─ Footer (buttons)
```

---

## ✅ 驗證清單

- ✅ 編輯按鈕在管理員登入時顯示
- ✅ 彈窗設計精美專業，符合 Glassmorphism 風格
- ✅ 彈窗正確顯示問卷標題、分類、狀態
- ✅ 「體消操作」按鈕能正確關閉彈窗
- ✅ 「進入編輯頁面」按鈕能正確跳轉並傳遞數據
- ✅ survey-admin 能正確接收並加載問卷數據
- ✅ 管理員能在編輯頁面修改問卷內容和題目
- ✅ 已發佈問卷也能編輯
- ✅ 草稿問卷也能編輯

---

## 🎨 視覺效果

### 彈窗配色
| 元素 | 顏色 | 用途 |
|------|------|------|
| 背景 | `#fffdf7` → `#fff9f2` | 主體彩度 |
| 圖示盒 | `#ffd95e` → `#f4a261` | 黃金漸層 |
| 文字 (標題) | `#4e342e` | 主色深棕 |
| 文字 (副標) | `#9c6f55` | 柔和棕色 |
| 狀態已發佈 | `#2a9d8f` | 青綠色 |
| 狀態草稿 | `#e76f51` | 橘紅色 |
| 確認按鈕 | `#f4a261` → `#e76f51` | 漸層橘色 |
| 取消按鈕 | `#fff` 邊框 | 白色背景 |

### 互動效果
```scss
/* 滑鼠懸停 */
.btn-edit-confirm:hover {
  transform: translateY(-2px);        // 向上移動
  box-shadow: 0 14px 36px ...;       // 陰影加強
}

/* 彈窗出現 */
@keyframes modalIn {
  from: scale(0.9) opacity(0)        // 縮小 + 淡出
  to: scale(1) opacity(1)            // 恢復 + 淡入
}
```

---

## 🚀 使用指南

### 測試步驟

1. **打開應用**
   ```bash
   ng serve
   # http://localhost:4200
   ```

2. **管理員登入**
   ```
   帳號: test@gmail.com
   密碼: 123456789
   ```

3. **導航到問卷列表**
   ```
   URL: http://localhost:4200/surveys
   已登入: ✅
   是管理員: ✅
   ```

4. **找到任意問卷，點擊編輯**
   ```
   編輯按鈕位置: 每行右側 "action" 欄位
   按鈕顏色: 黃色 (#ffd95e)
   ```

5. **確認彈窗**
   ```
   應顯示:
   - 問卷標題
   - 分類
   - 發佈狀態
   - 提示文字
   ```

6. **點擊「進入編輯頁面」**
   ```
   預期結果:
   - 彈窗關閉
   - 跳轉到 /admin?id=X
   - 自動加載問卷數據
   - 可進行編輯操作
   ```

---

## 📁 修改文件清單

| 文件 | 修改內容 | 行數 |
|------|---------|------|
| survey-list.component.html | 添加編輯確認彈窗 | ~60 |
| survey-list.component.ts | 改進 editSurvey/confirmEdit 邏輯 | ~15 |
| survey-list.component.scss | 添加彈窗和按鈕樣式 | ~200 |
| survey-admin.component.ts | 支持 state 數據接收 | ~5 |

**總修改行數**: ~280 行

---

## 🎉 總結

✨ **完成了一個精美、專業、完整的編輯功能！**

用戶現在可以：
1. 🖱️ 點擊編輯按鈕
2. 👀 在確認彈窗中預覽問卷信息
3. ✅ 確認後立即進入編輯頁面
4. ✏️ 修改問卷內容和題目
5. 💾 保存或發佈問卷

整個流程無縫整合，無需手動重新加載數據！
