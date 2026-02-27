# Scheduledupdate.md - 後端 Java 全層級開發與對接指南

本文件旨在協助開發者將 Eclipse 中的 Java 專案，從「假資料串接」升級至「全面對接管理中心邏輯」。請依照下列各層級（Layer）進行程式碼對照與更新。

---

## 一、 Entity 層 (實體模型) - 資料庫的直接映射

**檔案路徑**: `src/main/java/com/example/quiz/entity/`

### 1. Survey.java (問卷主表)

#### [MySQL 資料表：survey 規格補充]
| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 (Default) | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT` | 主鍵，問卷唯一編號 |
| `title` | `VARCHAR(255)` | `NOT NULL` | 問卷標題 |
| `description` | `VARCHAR(100)` | `NULL` | 問卷分類（對應 Java 的 type） |
| `intro` | `TEXT` | `NULL` | 詳細說明（對應 Java 的 intro） |
| `start_date` | `DATE` | `NOT NULL` | 調查開始日期 |
| `end_date` | `DATE` | `NOT NULL` | 調查結束日期 |
| `is_published` | `TINYINT(1)` | `0` (False) | 發佈狀態 |
| `collect_name` | `TINYINT(1)` | `1` (True) | 預設必須收集姓名 |
| `collect_phone` | `TINYINT(1)` | `0` (False) | 是否收集電話 |
| `collect_email` | `TINYINT(1)` | `0` (False) | 是否收集信箱 |

```java
@Entity
@Table(name = "survey")
public class Survey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "title")
    private String title;

    // 映射說明：前端傳來的 'type'(如：市場調查) 存入此欄位
    @Column(name = "description")
    private String type;

    // 映射說明：前端傳來的詳細說明文字 'description' 存入此欄位
    @Column(name = "intro", columnDefinition = "TEXT")
    private String intro;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_published")
    private boolean isPublished; // MySQL TINYINT(1) 自動映射為 boolean

    // 核心：一對多關聯。fetch = FetchType.EAGER 確保讀取問卷時同時抓取所有題目
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "survey_id")
    private List<Question> questionsList;

    // Getters and Setters...
}
```

### 2. Question.java (題目明細表)

#### [MySQL 資料表：question 規格補充]
| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 (Default) | 說明 |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT` | 主鍵，題目唯一編號 |
| `survey_id` | `INT` | `NOT NULL` | 關聯之問卷 ID (外鍵) |
| `title` | `VARCHAR(500)` | `NOT NULL` | 題目標題 |
| `type` | `VARCHAR(50)` | `NOT NULL` | `single`, `multiple`, `text` |
| `options` | `TEXT` | `NULL` | 選項字串，以分號 `;` 隔開 |
| `is_required` | `TINYINT(1)` | `0` (False) | 預設不必填 |
| `is_dependent` | `TINYINT(1)` | `0` (False) | 是否為承上題 |
| `parent_id` | `INT` | `NULL` | 依賴之父題目編號 |

```java
@Entity
@Table(name = "question")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;

    @Column(name = "title")
    private String title;

    @Column(name = "type")
    private String type; // 'single', 'multiple', 'text'

    // 核心：選項字串。以分號 ; 隔開，儲存時不限長度
    @Column(name = "options", columnDefinition = "TEXT")
    private String options;

    @Column(name = "is_required")
    private boolean isRequired;

    @Column(name = "is_dependent")
    private boolean isDependent; // 承上題開關

    @Column(name = "parent_id")
    private Integer parentId; // 使用 Integer 允許為 NULL (非承上題時)

    // Getters and Setters...
}
```

---

## 二、 Request / Response 層 (DTO) - 前後端通訊格式

**檔案路徑**: `src/main/java/com/example/quiz/vo/`

### 1. QuizReq.java (接收前端儲存請求)

```java
public class QuizReq {
    private int id;
    private String title;
    private String description; // 前端傳來的 type
    private String intro;       // 前端傳來的詳細說明
    private String startDate;
    private String endDate;
    private List<QuestionReq> questionsList; // 動態題目陣列

    // Getters and Setters...
}
```

### 2. BaseRes.java (統一回傳格式)

```java
public class BaseRes {
    private int code;       // 200: 成功, 400: 失敗
    private String message; // 回傳訊息

    public BaseRes(int code, String message) {
        this.code = code;
        this.message = message;
    }
    // Getters and Setters...
}
```

---

## 三、 DAO / Repository 層 (資料存取)

**檔案路徑**: `src/main/java/com/example/quiz/repository/`

```java
@Repository
public interface SurveyRepository extends JpaRepository<Survey, Integer> {
    // Spring Data JPA 會自動實作基本 CRUD (save, findById, delete)
}
```

---

## 四、 Service 層 (核心業務邏輯) - 最重要的轉換區

**檔案路徑**: `src/main/java/com/example/quiz/service/`

```java
@Service
public class QuizService {
    @Autowired
    private SurveyRepository surveyRepository;

    @Transactional
    public BaseRes saveSurvey(QuizReq req) {
        // 1. 建立或載入 Survey 實體
        Survey survey = new Survey();
        if (req.getId() > 0) {
            survey.setId(req.getId()); // 若有 ID 則執行更新 (Update)
        }

        // 2. 基本資料填充
        survey.setTitle(req.getTitle());
        survey.setType(req.getDescription()); // 進行欄位對照轉換
        survey.setIntro(req.getIntro());
        survey.setStartDate(LocalDate.parse(req.getStartDate()));
        survey.setEndDate(LocalDate.parse(req.getEndDate()));

        // 3. 處理動態題目列表 (支援無限制題目數量)
        List<Question> qList = new ArrayList<>();
        for (QuestionReq qReq : req.getQuestionsList()) {
            Question q = new Question();
            q.setTitle(qReq.getQuestion());
            q.setType(qReq.getType());

            // 選項轉換邏輯：若前端傳來的是 List，後端需用分號結合
            if (qReq.getOptionsList() != null) {
                q.setOptions(String.join(";", qReq.getOptionsList()));
            }

            q.setRequired(qReq.is_required());
            q.setDependent(qReq.is_dependent());
            q.setParentId(qReq.getParent_id());
            qList.add(q);
        }
        survey.setQuestionsList(qList);

        // 4. 執行儲存
        surveyRepository.save(survey);

        return new BaseRes(200, "問卷與題目已同步儲存至 MySQL。");
    }
}
```

---

## 五、 Controller 層 (API 進入點)

**檔案路徑**: `src/main/java/com/example/quiz/controller/`

```java
@RestController
@CrossOrigin(origins = "http://localhost:4200") // 支援 Angular 本地跨域
public class QuizController {
    @Autowired
    private QuizService quizService;

    @PostMapping("/quiz/create")
    public BaseRes createQuiz(@RequestBody QuizReq req) {
        // @RequestBody 會將前端的 JSON Payload 自動轉為 QuizReq 物件
        try {
            return quizService.saveSurvey(req);
        } catch (Exception e) {
            return new BaseRes(400, "儲存失敗: " + e.getMessage());
        }
    }
}
```

---

## 六、 關鍵技術對照總結

1.  **無限制增減題目**：透過 `List<Question>` 與 `CascadeType.ALL`，後端會自動遍歷並儲存所有題目卡片。
2.  **選項編碼 (Semicolon)**：前端 `options.join(';')` <-> 後端 `String.join(";", list)`。
3.  **承上題邏輯**：資料庫 `parent_id` 存儲的是前一題的 ID，填寫頁面會讀取此 ID 來決定是否解鎖卡片。
4.  **跨環境同步**：請確保您的另一台筆電資料庫中，`options` 與 `intro` 欄位為 `TEXT` 型態以防長度超限。

祝您串接成功！
