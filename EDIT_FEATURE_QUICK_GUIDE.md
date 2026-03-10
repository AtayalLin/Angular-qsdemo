# ⚡ 編輯問卷功能 - 快速指南

## 🎯 一句話総結
> 管理員點擊問卷列表中的「編輯」按鈕 → 確認彈窗 → 自動跳轉到問卷管理中心並加載該問卷所有信息，可直接編輯

---

## 👥 使用者角色

✅ **管理員** (test@gmail.com)
- 可看到「編輯」按鈕
- 可點擊編輯任何狀態的問卷
- 編輯後自動更新 MySQL

❌ **普通會員**
- 無法看到「編輯」按鈕
- 只能填寫問卷

---

## 🔧 功能實現清單

| 功能 | 狀態 | 位置 |
|------|------|------|
| 編輯按鈕顯示 | ✅ | survey-list.component.html 第 XXX 行 |
| 編輯確認彈窗 | ✅ | survey-list.component.html 第 ~230 行 |
| 彈窗樣式設計 | ✅ | survey-list.component.scss 新增 |
| 編輯邏輯流程 | ✅ | survey-list.component.ts 第 291 行 |
| 數據傳遞 | ✅ | survey-admin.component.ts 第 37 行 |
| 問卷信息加載 | ✅ | survey-admin.component.ts loadSurveyData() |

---

## 📝 修改了哪些文件？

### 1️⃣ survey-list.component.html
```html
添加了: 編輯確認彈窗 (showEditModal)
位置: 在 showLogoutModal 彈窗之前
```

### 2️⃣ survey-list.component.ts
```typescript
修改: editSurvey() - 現在無論問卷何種狀態都顯示彈窗
修改: confirmEdit() - 現在通過 state 傳遞完整問卷對象

例如:
router.navigate(['/admin'], {
  queryParams: { id: this.targetEditId },
  state: { survey: this.targetSurvey }  // ⭐ 新增
});
```

### 3️⃣ survey-list.component.scss
```scss
新增: .edit-overlay {} 
新增: .edit-modal-card {}
新增: .survey-info-box {}
新增: .btn-cancel-edit {}
新增: .btn-edit-confirm {}
```

### 4️⃣ survey-admin.component.ts
```typescript
修改: ngOnInit() - 能接收路由 state 中的問卷數據
修改: loadSurveyData() - 支持預加載問卷參數
```

---

## 🎨 彈窗長什麼樣？

```
╔════════════════════════════════════════╗
║ ✏️ 編輯問卷           [×]              ║
║    Edit Survey                      ║
║ 即將進入問卷編輯頁面，您可以修改...  ║
╠════════════════════════════════════════╣
║                                        ║
║ 📋 問卷資訊信息卡片                    ║
║ ┌──────────────────────────────────┐  ║
║ │ 📝 問卷標題「市場調查問卷」         │  ║
║ │ 🏷️  分類「市場調查」              │  ║
║ │ ✓  狀態「已發佈」 (綠色)          │  ║
║ └──────────────────────────────────┘  ║
║                                        ║
║ ℹ️  編輯後可以立即更新問卷內容...     ║
║                                        ║
╠════════════════════════════════════════╣
║ [取消操作]        [進入編輯頁面] 👉    ║
╚════════════════════════════════════════╝
```

---

## 🔄 完整流程圖

```
問卷列表頁面
    ↓
[點擊編輯按鈕]
    ↓
editSurvey(id)
    ↓
[顯示確認彈窗]
    ↓
    ├─ 取消 → 彈窗關閉，留在列表
    │
    └─ 確認 → confirmEdit()
              ↓
         router.navigate(['/admin'], {
           queryParams: { id: X },
           state: { survey: {...} }
         })
              ↓
         轉跳到問卷管理中心
              ↓
         survey-admin ngOnInit()
              ↓
         loadSurveyData(id, preloadedSurvey)
              ↓
         [自動加載問卷所有信息]
              ↓
         管理員可編輯問卷
```

---

## 🧪 測試方法

### ✅ 快速測試清單

1. **打開瀏覽器**
   ```
   URL: http://localhost:4200/surveys
   ```

2. **管理員登入**
   ```
   帳號: test@gmail.com
   密碼: 123456789
   登入 → ✅ 看到「問卷管理中心」按鈕
   ```

3. **找到編輯按鈕**
   ```
   位置: 列表每一行的最右邊「Action」欄
   按鈕: 黃色背景，文字「編輯」
   ```

4. **點擊編輯**
   ```
   ✅ 彈窗出現
   ✅ 顯示問卷標題
   ✅ 顯示問卷分類
   ✅ 顯示問卷狀態 (已發佈/草稿)
   ```

5. **點擊「進入編輯頁面」**
   ```
   ✅ 彈窗消失
   ✅ URL 變成 /admin?id=X
   ✅ 問卷內容自動載入
   ✅ 可編輯標題、說明、題目
   ```

6. **取消操作**
   ```
   ✅ 彈窗消失
   ✅ 留在列表頁面
   ✅ 無任何數據改變
   ```

---

## 🎨 視覺設計細節

### 顏色方案
- **背景**: 黃金漸層 `#fffdf7 → #fff9f2`
- **圖示盒**: 漸層橘色 `#ffd95e → #f4a261`
- **狀態已發佈**: 青綠色 `#2a9d8f`
- **狀態草稿**: 橘紅色 `#e76f51`
- **確認按鈕**: 漸層橘色 (同圖示盒)
- **取消按鈕**: 白色背景 + 棕色邊框

### 動畫效果
- 彈窗出現: 縮放 + 淡入 (0.45s)
- 按鈕懸停: 向上移動 + 陰影加強

---

## 🔐 安全性考慮

✅ **管理員驗證**
```typescript
if (isAdmin && !isManageMode) {
  // 只有管理員才能看到編輯按鈕
}
```

✅ **數據驗證**
```typescript
if (this.targetEditId && this.targetSurvey) {
  // 確保有效的ID和數據
}
```

✅ **格式驗證**
```typescript
const found = allSurveys.find((s) => s.id === id);
if (found) {
  // 確保問卷存在
}
```

---

## 📊 與其他功能的整合

### 與刪除功能的區別
| 操作 | 彈窗 | 目的 |
|------|------|------|
| 編輯 | 確認信息 | 進入編輯模式 |
| 刪除 | 危險警告 | 永久移除數據 |

### 與發佈功能的關係
```
已發佈的問卷 → 仍可編輯 → 編輯後保持已發佈狀態
草稿問卷    → 可編輯   → 編輯後仍為草稿，需手動發佈
```

---

## 💡 常見問題

### Q: 編輯後數據會立即保存嗎？
A: 不會。編輯後需點擊「保存」或「發佈」才能提交到 MySQL。

### Q: 普通會員能編輯問卷嗎？
A: 不能。編輯按鈕僅對管理員（admin）顯示。

### Q: 已發佈的問卷編輯後狀態會改變嗎？
A: 不會。發佈狀態保持不變，只更新內容。

### Q: 能編輯已過期的問卷嗎？
A: 可以。無論過期與否都可編輯，只要是管理員身份。

### Q: 多個管理員同時編輯會怎樣？
A: 現版本無並發控制，後續可加入鎖機制防止衝突。

---

## 🚀 後續優化建議

- [ ] 添加編輯鎖機制（防止多人編輯衝突）
- [ ] 添加編輯歷史記錄
- [ ] 添加自動保存草稿功能
- [ ] 添加版本控制（回復到舊版本）
- [ ] 編輯完成後顯示成功提示

---

## 📞 技術支持

**疑問?**
查看詳細文檔: [EDIT_MODAL_IMPLEMENTATION.md](EDIT_MODAL_IMPLEMENTATION.md)  
查看修復報告: [COMPLETE_REPAIR_REPORT.md](COMPLETE_REPAIR_REPORT.md)

**遇到 Bug?**
1. 檢查瀏覽器控制台 (F12)
2. 檢查 Network 標籤看 API 請求
3. 查看 LocalStorage 中的 currentUser 數據

---

**✨ 編輯功能已完全就緒，可進行完整測試！**
