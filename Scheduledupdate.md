# Scheduledupdate.md - 後端更新同步與資料格式對接指南

本文件旨在協助開發者將目前的 Eclipse (Java) 與 MySQL 環境，由「初步假資料串接」升級至「全面對接管理中心高級邏輯」的生產狀態。

---

## 一、 MySQL 資料表更新建議 (Schema Updates)

請在您的 MySQL 控制台執行以下語法，為現有資料表補強欄位：

### 1. 問卷主表 (`survey`)
```sql
ALTER TABLE survey 
ADD COLUMN description TEXT COMMENT '問卷詳細說明文字',
ADD COLUMN collect_name BOOLEAN DEFAULT TRUE COMMENT '是否收集姓名',
ADD COLUMN collect_phone BOOLEAN DEFAULT FALSE COMMENT '是否收集電話',
ADD COLUMN collect_email BOOLEAN DEFAULT FALSE COMMENT '是否收集信箱',
ADD COLUMN is_published BOOLEAN DEFAULT FALSE COMMENT '發佈狀態';
```

### 2. 題目明細表 (`question`)
```sql
ALTER TABLE question 
ADD COLUMN is_required BOOLEAN DEFAULT FALSE COMMENT '是否必填',
ADD COLUMN is_dependent BOOLEAN DEFAULT FALSE COMMENT '是否為承上題',
ADD COLUMN parent_id INT DEFAULT NULL COMMENT '依賴的父題目ID',
ADD COLUMN max_selectable INT DEFAULT NULL COMMENT '多選題上限',
ADD COLUMN max_characters INT DEFAULT NULL COMMENT '簡答題字數限制';
```

---

## 二、 Java 後端開發指南 (Eclipse / Spring Boot)

為了對接前端送出的 `confirmSave()` Payload，建議更新以下檔案：

### 1. Entity 層 (實體模型對照)
**檔案路徑**: `com.example.quiz.entity.Survey.java`
```java
@Entity
public class Survey {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
    private String title;
    private String description; // 對應前端 type 欄位
    private String intro;       // 對應前端 description 欄位
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isPublished;
    
    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL)
    private List<Question> questionsList; // 核心：一對多關聯，支援無限增減題目
}
```

### 2. Request DTO 層 (前端 JSON 接收)
**檔案路徑**: `com.example.quiz.vo.QuizReq.java`
```java
public class QuizReq {
    private int id;
    private String title;
    private String description;
    private String intro;
    private List<QuestionReq> questionsList; // 前端送來的動態陣列
    
    // Getters and Setters...
}
```

### 3. Service 層 (核心邏輯：選項解碼與編碼)
**檔案路徑**: `com.example.quiz.service.QuizService.java`
```java
public void saveSurvey(QuizReq req) {
    // 1. 處理問卷主體資料
    // 2. 處理題目迴圈 (支援無限制題目數量)
    for (QuestionReq qReq : req.getQuestionsList()) {
        Question q = new Question();
        q.setTitle(qReq.getQuestion());
        q.setType(qReq.getType()); // 存儲 'single', 'multiple', 'text'
        
        // 選項處理：關鍵點！
        // 前端傳來陣列，後端用分號結合存入 DB 欄位
        if(qReq.getOptions() != null) {
            q.setOptions(String.join(";", qReq.getOptions()));
        }
        
        q.setRequired(qReq.is_required());
        q.setDependent(qReq.is_dependent());
        q.setParentId(qReq.getParent_id());
        
        questionRepository.save(q);
    }
}
```

### 4. Controller 層 (API 端口)
**檔案路徑**: `com.example.quiz.controller.QuizController.java`
```java
@PostMapping("/quiz/create")
public BaseRes createQuiz(@RequestBody QuizReq req) {
    // 接收前端產出的 JSON Payload
    // 呼叫 Service 進行持久化儲存
    return quizService.saveSurvey(req);
}
```

---

## 三、 目前前端資料轉換對照表 (Data Mapping)

| 前端欄位名稱 (UI) | MySQL 欄位名稱 | 資料類型 | 說明 |
| :--- | :--- | :--- | :--- |
| `currentSurvey.title` | `title` | `VARCHAR` | 問卷標題 |
| `currentSurvey.type` | `description` | `VARCHAR` | 問卷分類（如：市場調查） |
| `currentSurvey.description` | `intro` | `TEXT` | 問卷詳細說明文字 |
| `q.options[]` (Array) | `options` | `TEXT` | 以分號 `;` 結合的字串 |
| `q.isDependent` | `is_dependent` | `BOOLEAN` | 承上題開關 |
| `q.parentId` | `parent_id` | `INT` | 關聯的父題目編號 |

---

## 四、 階段性更新計畫

1.  **第一步**：依照上述 SQL 修改您的資料庫 Schema。
2.  **第二步**：在 Eclipse 更新 Entity 與 DTO 欄位，確保編譯通過。
3.  **第三步**：實作 `String.join(";", list)` 的選項編碼邏輯。
4.  **第四步**：解除前端 `SurveyAdminComponent.ts` 中關於 `description` 的註解，完成真實資料串接。

祝您開發順利！
