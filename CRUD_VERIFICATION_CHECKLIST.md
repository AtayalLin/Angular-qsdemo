# Survey System CRUD 操作驗證和修復清單

## 📋 目標
確保所有 CRUD 操作（新增、讀取、更新、刪除）能正常運作，並能完整串聯所有 7 個組件。

---

## ✅ 已完成的修復

### 1. survey-list.component.ts - 發佈功能修復
**修復內容:**
- `publishSurvey()` 現在調用實際的 API `surveyService.publishSurvey(id)`
- 添加了響應代碼檢查 (res.code === 200)
- 失敗時顯示錯誤提示 (toast 通知)

### 2. survey-list.component.ts - 編輯功能改進
**修復內容:**
- `editSurvey()` 現在使用深拷貝 `{ ...s }` 避免直接修改原始數據
- 添加了null檢查和錯誤提示
- `confirmEdit()` 添加了異步導航檢查和錯誤處理
- `closeEditModal()` 現在清空 `targetSurvey` 以防止數據洩露

### 3. survey-list.component.ts - 刪除功能增強
**修復內容:**
- 批次刪除和單筆刪除都添加了響應代碼檢查
- 失敗場景有明確的錯誤提示
- 成功刪除後顯示刪除的項目數

### 4. survey-list.component.ts - 搜尋和日期過濾修復
**修復內容:**
- `onSearch()` 日期比較邏輯現在兼容 `startDate/start_date` 和 `endDate/end_date`
- 修復了 MySQL 字段映射不一致的問題

---

## 🔄 CRUD 操作流程驗證

### CREATE（新增問卷）
```
操作流程:
1. 用戶在 survey-admin.component 填寫問卷基本信息
2. 點擊「確認儲存」按鈕
3. confirmSurvey() 調用 surveyService.createSurvey(payload)
4. API: POST /quiz/create
5. 成功返回 {code: 200, message: "..."}
6. 路由返回到 /surveys (survey-list 頁面)
7. fetchSurveys() 自動重新加載列表
8. 新問卷顯示在列表中

檢查點:
✅ survey-admin.component -> confirmSave() 方法完整
✅ surveyService -> createSurvey(payload) 已實現
✅ 路由導航 router.navigate(['/surveys']) 已配置
✅ Toast 提示 alert() 已添加
```

### READ（讀取問卷）
```
操作流程:
1. survey-list.component ngOnInit() 自動調用 fetchSurveys()
2. surveyService.getSurveys() GET /quiz/getAll
3. 返回 {code: 200, quizList: [...]}
4. 數據綁定到 this.surveys 陣列
5. 模板使用 @for (survey of filteredSurveys) 顯示列表
6. 用戶點擊「編輯」打開 edit modal
7. 確認後導航到 /admin，傳遞完整問卷對象
8. survey-admin ngOnInit() 接收 navigation.extras.state['survey']
9. loadSurveyData(id, preloadedSurvey) 加載問卷詳情
10. getSurveyById(id) 獲取所有題目

檢查點:
✅ fetchSurveys() 實現正確
✅ getSurveys() API 方法完整
✅ 數據映射正確 (start_date -> startDate)
✅ Router state 傳遞完整問卷對象
✅ survey-admin 可接收預加載數據
```

### UPDATE（更新問卷）
```
操作流程:
1. survey-list -> 編輯問卷 -> 確認編輯 -> 跳轉到 survey-admin
2. survey-admin loadSurveyData() 接收預加載問卷
3. 用戶修改問卷標題、說明、題目等
4. 點擊「確認儲存」
5. confirmSave() 構建 payload (id > 0 時)
6. surveyService.updateSurvey(payload) POST /quiz/update
7. API 返回 {code: 200, message: "..."}
8. router.navigate(['/surveys']) 返回列表
9. fetchSurveys() 重新加載，顯示更新後的問卷

檢查點:
✅ confirmSave() 區分新增和更新邏輯
✅ updateSurvey() API 方法完整
✅ Router state 傳遞完整問卷對象
✅ 預加載數據優化查詢速度
✅ 成功提示後返回列表
```

### DELETE（刪除問卷）
```
操作流程:

單筆刪除:
1. survey-list -> 點擊「刪除」按鈕
2. deleteSurvey(surveyId) 設置 showDeleteModal = true
3. 顯示刪除確認 modal，列出問卷標題
4. 用戶點擊「確認刪除」
5. confirmDelete() 調用 surveyService.deleteSingleSurvey(id)
6. API: GET /quiz/delete_single?id=xxx
7. 成功返回 {code: 200}
8. Toast 提示 "問卷已被刪除"
9. fetchSurveys() 重新加載列表
10. Modal 關閉，列表自動更新

批次刪除:
1. survey-list -> 勾選多個問卷複選框
2. 選中數量顯示在「批次刪除」按鈕上
3. 點擊「批次刪除」
4. showDeleteModal = true，顯示批次刪除提示
5. isBatchDeleting = true
6. confirmDelete() 調用 surveyService.deleteBatchSurveys([id1, id2, ...])
7. API: POST /quiz/delete (body: {ids: [...]})
8. 成功返回 {code: 200}
9. Toast 提示 "已刪除 N 份問卷"
10. selectedIds.clear() 清空選擇
11. fetchSurveys() 重新加載列表

檢查點:
✅ deleteSingleSurvey() API 實現
✅ deleteBatchSurveys() API 實現
✅ Modal 顯示正確的確認信息
✅ 刪除後自動重新加載列表
✅ 批選和單選邏輯分離
```

---

## 🔗 完整數據流驗證

### 編輯流程數據傳遞
```typescript
// 1. survey-list.component.ts
editSurvey(id: number) {
  const s = this.surveys.find(x => x.id === id);
  this.targetSurvey = { ...s };  // 深拷貝
  this.showEditModal = true;     // 顯示確認 modal
}

confirmEdit() {
  this.router.navigate(['/admin'], {
    queryParams: { id: this.targetEditId },
    state: { survey: this.targetSurvey }  // 完整問卷對象
  });
  this.closeEditModal();
}

// 2. survey-admin.component.ts
ngOnInit() {
  const navigation = this.router.getCurrentNavigation();
  const editSurvey = navigation?.extras.state?.['survey'];  // 接收問卷
  
  this.route.queryParams.subscribe(params => {
    const id = +params['id'];
    this.loadSurveyData(id, editSurvey);  // 傳遞預加載問卷
  });
}

loadSurveyData(id: number, preloadedSurvey?: any) {
  // 如果有預加載數據，優先使用
  if (preloadedSurvey) {
    this.currentSurvey = { /* 映射預加載數據 */ };
  } else {
    // 否則從 API 獲取
    this.surveyService.getSurveyById(id).subscribe(...);
  }
}

confirmSave() {
  const request = this.currentSurvey.id > 0
    ? this.surveyService.updateSurvey(payload)  // 更新
    : this.surveyService.createSurvey(payload);  // 新增
  
  request.subscribe({
    next: (res) => {
      if (res.code === 200) {
        this.router.navigate(['/surveys']);  // 返回列表
      }
    }
  });
}
```

---

## 🧪 測試用例

### 測試 1: 新增問卷
```
前置: 登入管理員 (test@gmail.com / 123456789)
步驟:
1. 導航到 /admin
2. activeTab 設為 'survey'
3. 輸入標題、說明、選擇類型
4. 新增至少 2 個題目
5. 點擊「確認儲存」
預期:
✓ API POST /quiz/create 被調用
✓ 顯示成功提示
✓ 路由導航回 /surveys
✓ 新問卷出現在列表中
```

### 測試 2: 讀取和編輯問卷
```
前置: 列表中至少有 1 份問卷
步驟:
1. 在 survey-list 頁面找到問卷
2. 點擊「編輯」按鈕
3. 確認 modal 顯示問卷標題和類型
4. 點擊「確認編輯」
5. 驗證 survey-admin 頁面加載了正確問卷
6. 修改問卷標題和至少一個題目
7. 點擊「確認儲存」
預期:
✓ Edit modal 顯示正確信息
✓ 跳轉到 /admin?id=xxx
✓ currentSurvey 加載了預加載的問卷
✓ 題目列表正確顯示
✓ API POST /quiz/update 被調用
✓ 更新成功後返回列表
```

### 測試 3: 單筆刪除
```
前置: 列表中至少有 1 份問卷
步驟:
1. 在問卷行點擊「刪除」按鈕
2. 確認 modal 顯示正確的問卷標題
3. 點擊「確認刪除」
預期:
✓ Delete modal 顯示正確信息
✓ API GET /quiz/delete_single?id=xxx 被調用
✓ 顯示成功提示 "問卷已被刪除"
✓ 列表自動重新加載
✓ 問卷從列表中消失
```

### 測試 4: 批次刪除
```
前置: 列表中至少有 2 份問卷
步驟:
1. 勾選至少 2 個問卷的複選框
2. 點擊「批次刪除」按鈕
3. 確認 modal 顯示刪除信息
4. 點擊「確認刪除」
預期:
✓ 按鈕顯示正確的選中數量
✓ Delete modal 針對批次刪除顯示不同文本
✓ API POST /quiz/delete 被調用，body 包含所有 id
✓ 顯示成功提示 "已刪除 N 份問卷"
✓ 列表自動重新加載
✓ 所有勾選的問卷消失
✓ selectedIds 清空
```

### 測試 5: 發佈問卷
```
前置: 有一份未發佈的問卷
步驟:
1. 在問卷行點擊「發佈」按鈕
2. 確認發佈對話框
預期:
✓ 確認對話框顯示 "確定要發佈嗎？"
✓ API GET /quiz/publish?id=xxx 被調用 (或 POST)
✓ 問卷狀態變更為 "已發佈"
✓ 列表自動更新，狀態欄顯示 "已發佈"
```

---

## 🛠️ API 端點對應表

| 操作 | HTTP 方法 | 端點 | 服務方法 | 狀態碼 |
|------|----------|------|---------|--------|
| 新增 | POST | /quiz/create | createSurvey() | 200 |
| 讀取所有 | GET | /quiz/getAll | getSurveys() | 200 |
| 讀取詳情 | GET | /quiz/get_questions_List | getSurveyById() | 200 |
| 更新 | POST | /quiz/update | updateSurvey() | 200 |
| 刪除單筆 | GET | /quiz/delete_single?id=xxx | deleteSingleSurvey() | 200 |
| 刪除批次 | POST | /quiz/delete | deleteBatchSurveys() | 200 |
| 發佈 | GET/POST | /quiz/publish?id=xxx | publishSurvey() | 200 |
| 取消發佈 | GET/POST | /quiz/unpublish?id=xxx | unpublishSurvey() | 200 |

---

## 📊 驗證清單

- [x] survey-list.component.ts - publishSurvey() 調用真實 API
- [x] survey-list.component.ts - editSurvey() 使用深拷貝和錯誤檢查
- [x] survey-list.component.ts - confirmEdit() 有異步導航檢查
- [x] survey-list.component.ts - confirmDelete() 有響應代碼檢查
- [x] survey-list.component.ts - closeEditModal() 清空 targetSurvey
- [x] survey-list.component.ts - onSearch() 兼容不同的日期字段名
- [x] survey-admin.component.ts - ngOnInit() 接收 navigation state
- [x] survey-admin.component.ts - loadSurveyData() 支持預加載
- [x] survey-admin.component.ts - confirmSave() 區分新增和更新
- [x] surveyService - updateSurvey() API 方法完整
- [x] surveyService - publishSurvey() API 方法完整
- [x] Router 配置支持 state 傳遞
- [x] 所有 API 方法包含 retry 和 error handling

---

## 🚀 下一步建議

1. **端到端測試**: 執行上述所有測試用例，驗證功能完整
2. **性能優化**: 考慮添加分頁加載，避免一次加載所有問卷
3. **字段驗證**: 添加前端表單驗證，提高用戶體驗
4. **樂觀更新**: 考慮在等待服務器響應時，先更新本地列表
5. **離線支持**: 使用 localStorage 緩存經常訪問的問卷

---

## 📝 更新日期
- **最後修改**: 2024-01-XX (此次修復)
- **修復內容**: publishSurvey API調用、錯誤處理增強、日期過濾修復、深拷貝優化
