# Scheduledupdate.md - 全棧後端同步與資料格式對接指南

本文件旨在協助開發者將目前的 Eclipse (Java) 與 MySQL 環境，由「初步假資料串接」升級至「全面對接管理中心高級邏輯」的生產狀態。

---

## 一、 MySQL 資料表結構詳解 (Schema with Defaults)

請確保您的資料庫欄位設定符合下列規範，特別是**預設值**的設定，這會影響到「新增問卷」時的初始狀態。

### 1. 問卷主表 (`survey`)
負責存儲問卷的核心資訊與使用者基本資料收集配置。

| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 (Default) | 說明 (Description) | 前端對照 (Angular) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT` | 主鍵，問卷唯一編號 | `id` |
| `title` | `VARCHAR(255)` | `NOT NULL` | 問卷標題 | `title` |
| `description` | `VARCHAR(100)` | `NULL` | 問卷類型（如：市場調查） | `type` |
| `intro` | `TEXT` | `NULL` | 問卷詳細說明文字 | `description` |
| `start_date` | `DATE` | `NOT NULL` | 調查開始日期 | `startDate` |
| `end_date` | `DATE` | `NOT NULL` | 調查結束日期 | `endDate` |
| `participants` | `INT` | `0` | 累計填答人數 | `participants` |
| `is_published` | `TINYINT(1)` | `0` (False) | 是否正式對外發佈 | `publishStatus` |
| `collect_name` | `TINYINT(1)` | `1` (True) | 是否必填姓名 | `basicInfoConfig.name` |
| `collect_phone` | `TINYINT(1)` | `0` (False) | 是否必填電話 | `basicInfoConfig.phone` |
| `collect_email` | `TINYINT(1)` | `0` (False) | 是否必填信箱 | `basicInfoConfig.email` |

### 2. 題目明細表 (`question`)
負責存儲問卷內的動態題目，支援無限增減。

| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 (Default) | 說明 (Description) | 前端對照 (Angular) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT` | 主鍵，題目唯一編號 | `id` |
| `survey_id` | `INT` | `NOT NULL` | 外鍵，連結問卷主表 | N/A |
| `title` | `VARCHAR(500)` | `NOT NULL` | 題目標題 | `title` |
| `type` | `VARCHAR(50)` | `NOT NULL` | `single`, `multiple`, `text` | `type` |
| `options` | `TEXT` | `NULL` | 選項，分號 `;` 隔開 | `options[]` |
| `is_required` | `TINYINT(1)` | `0` (False) | 該題是否設為必填 | `isRequired` |
| `is_dependent` | `TINYINT(1)` | `0` (False) | 是否為承上題 | `isDependent` |
| `parent_id` | `INT` | `NULL` | 關聯之父題目 ID | `parentId` |
| `max_selectable` | `INT` | `NULL` | 多選題最高可選幾項 | `maxSelectable` |
| `max_characters` | `INT` | `NULL` | 簡答題字數限制 | `maxCharacters` |

---

## 二、 Entity 層 (實體模型) - 資料庫映射
**檔案路徑**: `src/main/java/com/example/quiz/entity/`

### 1. Survey.java
```java
@Entity
@Table(name = "survey")
public class Survey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    private String title;
    private String description; // 問卷類型
    private String intro;       // 詳細說明
    private LocalDate startDate;
    private LocalDate endDate;
    private boolean isPublished;

    // 基本資料收集配置 (預設值邏輯應在此或 Service 處理)
    private boolean collectName = true; 
    private boolean collectPhone = false;
    private boolean collectEmail = false;

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "survey_id")
    private List<Question> questionsList;
}
```

---

## 三、 Service 層 (業務邏輯) - 資料處理
**檔案路徑**: `src/main/java/com/example/quiz/service/`

```java
@Service
public class QuizService {
    @Autowired
    private SurveyRepository surveyRepository;

    @Transactional
    public BaseRes saveSurvey(QuizReq req) {
        Survey survey = new Survey();
        // 若為編輯模式，則載入既有 ID
        if (req.getId() > 0) survey.setId(req.getId());
        
        survey.setTitle(req.getTitle());
        survey.setType(req.getDescription());
        survey.setIntro(req.getIntro());
        // ... 其他欄位填充 ...

        List<Question> qList = new ArrayList<>();
        for (QuestionReq qReq : req.getQuestionsList()) {
            Question q = new Question();
            q.setTitle(qReq.getQuestion());
            q.setType(qReq.getType());
            
            // 重要：處理無限制選項的編碼
            if(qReq.getOptionsList() != null) {
                q.setOptions(String.join(";", qReq.getOptionsList()));
            }
            
            // 承上題邏輯填充
            q.setRequired(qReq.is_required());
            q.setDependent(qReq.is_dependent());
            q.setParentId(qReq.getParent_id());
            
            qList.add(q);
        }
        survey.setQuestionsList(qList);
        surveyRepository.save(survey);
        return new BaseRes(200, "同步成功");
    }
}
```

*(其餘 DTO、Controller 等引導設定維持不變，詳見下方原始記錄內容)*

---

## 四、 核心對接規則總結

1.  **姓名必填 ( collect_name )**：資料庫預設應為 `1` (True)。
2.  **動態增減**：後端使用 `ArrayList` 接收，MySQL 透過 `survey_id` 外鍵關聯實作無限題目擴充。
3.  **大長度欄位**：`options` 與 `intro` 務必使用 `TEXT` 型態，避免管理者輸入過多內容時發生資料截斷錯誤。

祝您串接成功！
