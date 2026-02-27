# Scheduledupdate.md - 全棧後端同步與資料格式對接指南

本文件旨在協助開發者將目前的 Eclipse (Java) 與 MySQL 環境，由「初步假資料串接」升級至「全面對接管理中心高級邏輯」的生產狀態。

---

## 一、 MySQL 資料表結構總覽 (Schema with Defaults)

請確保您的資料庫欄位設定符合下列規範，這會影響到「新增問卷」時的初始狀態。

### 1. 問卷主表 (`survey`)
| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 (Default) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT` | 主鍵，問卷唯一編號 |
| `title` | `VARCHAR(255)` | `NOT NULL` | 問卷標題 |
| `description` | `VARCHAR(100)` | `NULL` | 問卷類型（如：市場調查） |
| `intro` | `TEXT` | `NULL` | 問卷詳細說明文字 |
| `start_date` | `DATE` | `NOT NULL` | 調查開始日期 |
| `end_date` | `DATE` | `NOT NULL` | 調查結束日期 |
| `participants` | `INT` | `0` | 累計填答人數 |
| `is_published` | `TINYINT(1)` | `0` (False) | 是否正式對外發佈 |
| `collect_name` | `TINYINT(1)` | `1` (True) | 是否必填姓名 |
| `collect_phone` | `TINYINT(1)` | `0` (False) | 是否必填電話 |
| `collect_email` | `TINYINT(1)` | `0` (False) | 是否必填信箱 |

### 2. 題目明細表 (`question`)
| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 (Default) | 說明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT` | 主鍵，題目唯一編號 |
| `survey_id` | `INT` | `NOT NULL` | 外鍵，連結問卷主表 |
| `title` | `VARCHAR(500)` | `NOT NULL` | 題目標題 |
| `type` | `VARCHAR(50)` | `NOT NULL` | `single`, `multiple`, `text` |
| `options` | `TEXT` | `NULL` | 選項，分號 `;` 隔開 |
| `is_required` | `TINYINT(1)` | `0` (False) | 該題是否設為必填 |
| `is_dependent` | `TINYINT(1)` | `0` (False) | 是否為承上題 |
| `parent_id` | `INT` | `NULL` | 關聯之父題目 ID |
| `max_selectable` | `INT` | `NULL` | 多選題最高可選幾項 |
| `max_characters` | `INT` | `NULL` | 簡答題字數限制 |

---

## 二、 Entity 層 (實體模型) - Java 檔案引導設定
**檔案路徑**: `src/main/java/com/example/quiz/entity/`

### 1. Survey.java (問卷主表)
```java
@Entity
@Table(name = "survey")
public class Survey {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id; // 類型: INT | 預設: AUTO_INCREMENT

    @Column(nullable = false)
    private String title; // 類型: VARCHAR(255)

    @Column(name = "description")
    private String type; // 類型: VARCHAR(100) | 映射: 問卷分類

    @Column(name = "intro", columnDefinition = "TEXT")
    private String intro; // 類型: TEXT | 映射: 詳細說明

    @Column(nullable = false)
    private LocalDate startDate; // 類型: DATE

    @Column(nullable = false)
    private LocalDate endDate; // 類型: DATE

    private int participants = 0; // 類型: INT | 預設: 0

    @Column(name = "is_published")
    private boolean isPublished = false; // 類型: TINYINT(1) | 預設: 0

    private boolean collectName = true; // 類型: TINYINT(1) | 預設: 1
    private boolean collectPhone = false; // 類型: TINYINT(1) | 預設: 0
    private boolean collectEmail = false; // 類型: TINYINT(1) | 預設: 0

    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "survey_id")
    private List<Question> questionsList;
}
```
> **MySQL 對照提醒**：
> - `collect_name` 務必在資料庫設為 `DEFAULT 1`，以對齊「姓名預設必填」的業務邏輯。
> - `intro` 建議使用 `TEXT` 以容納長篇說明。

### 2. Question.java (題目明細表)
```java
@Entity
@Table(name = "question")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id; // 類型: INT | 預設: AUTO_INCREMENT

    @Column(nullable = false)
    private String title; // 類型: VARCHAR(500)

    @Column(nullable = false)
    private String type; // 類型: VARCHAR(50) | 'single', 'multiple', 'text'

    @Column(columnDefinition = "TEXT")
    private String options; // 類型: TEXT | 選項以分號 ; 隔開

    @Column(name = "is_required")
    private boolean isRequired = false; // 類型: TINYINT(1) | 預設: 0

    @Column(name = "is_dependent")
    private boolean isDependent = false; // 類型: TINYINT(1) | 預設: 0

    @Column(name = "parent_id")
    private Integer parentId = null; // 類型: INT | 允許為 NULL

    private Integer maxSelectable; // 類型: INT | 僅多選題使用
    private Integer maxCharacters; // 類型: INT | 僅簡答題使用
}
```
> **MySQL 對照提醒**：
> - `options` 選項字串必須使用 `TEXT` 型態，以支援「無限制數量的題目選項」。
> - `is_required` 與 `is_dependent` 預設皆為 `0` (False)，符合「新增問卷預設不必填」的邏輯。

---

## 三、 Service 層 (業務邏輯) - 核心轉換區
**檔案路徑**: `src/main/java/com/example/quiz/service/`

```java
@Service
public class QuizService {
    @Autowired
    private SurveyRepository surveyRepository;

    @Transactional
    public BaseRes saveSurvey(QuizReq req) {
        Survey survey = new Survey();
        if (req.getId() > 0) survey.setId(req.getId());
        
        survey.setTitle(req.getTitle());
        survey.setType(req.getDescription());
        survey.setIntro(req.getIntro());
        survey.setStartDate(LocalDate.parse(req.getStartDate()));
        survey.setEndDate(LocalDate.parse(req.getEndDate()));

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
        return new BaseRes(200, "資料已與 MySQL 同步成功");
    }
}
```

---

## 四、 核心對接規則總結

1.  **資料型態對齊**：Java 的 `boolean` 在 MySQL 對應 `TINYINT(1)`。
2.  **大容量支援**：`options` (題目選項) 與 `intro` (問卷說明) 必須設為 `TEXT`，這是支援「無限制數量」的關鍵。
3.  **預設值同步**：姓名收集 (`collectName`) 在 Java 與 MySQL 均需預設為 `True / 1`。

祝您串接成功！
