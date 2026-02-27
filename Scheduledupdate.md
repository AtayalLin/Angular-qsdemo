# Scheduledupdate.md - 後端更新同步與 MySQL 資料型態詳解

本文件提供完整的資料庫 Schema 定義，旨在協助開發者將 Eclipse (Java) 與 MySQL 環境完美對接目前前端的所有功能。

---

## 一、 MySQL 資料表結構詳解 (Full Schema)

### 1. 問卷主表 (`survey`)
負責存儲問卷的核心資訊與全域配置。

| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 | 說明 (Description) | 與前端對照 (Angular) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | AUTO_INCREMENT | 主鍵，問卷唯一編號 | `currentSurvey.id` |
| `title` | `VARCHAR(255)` | NOT NULL | 問卷標題 | `currentSurvey.title` |
| `description` | `VARCHAR(100)` | NULL | **[重要]** 問卷類型（如：滿意度） | `currentSurvey.type` |
| `intro` | `TEXT` | NULL | 問卷詳細說明文字 | `currentSurvey.description` |
| `start_date` | `DATE` | NOT NULL | 調查開始日期 (YYYY-MM-DD) | `currentSurvey.startDate` |
| `end_date` | `DATE` | NOT NULL | 調查結束日期 (YYYY-MM-DD) | `currentSurvey.endDate` |
| `participants` | `INT` | 0 | 累計填答人數 | `participants` |
| `is_published` | `TINYINT(1)` | 0 (False) | 0:未發佈(草稿/已儲存), 1:已發佈 | `publishStatus` |
| `collect_name` | `TINYINT(1)` | 1 (True) | 是否強制要求填寫姓名 | `basicInfoConfig.name` |
| `collect_phone` | `TINYINT(1)` | 0 (False) | 是否強制要求填寫電話 | `basicInfoConfig.phone` |
| `collect_email` | `TINYINT(1)` | 0 (False) | 是否強制要求填寫信箱 | `basicInfoConfig.email` |

### 2. 題目明細表 (`question`)
負責存儲問卷內的動態題目，透過 `survey_id` 實作一對多關聯。

| 欄位名稱 (MySQL) | 資料型態 (Type) | 預設值 | 說明 (Description) | 與前端對照 (Angular) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | AUTO_INCREMENT | 主鍵，題目唯一編號 | `q.id` |
| `survey_id` | `INT` | NOT NULL | 外鍵，關聯至 `survey.id` | N/A |
| `title` | `VARCHAR(500)` | NOT NULL | 題目標題內容 | `q.title` |
| `type` | `VARCHAR(50)` | NOT NULL | 題型: `single`, `multiple`, `text` | `q.type` |
| `options` | `TEXT` | NULL | **[重要]** 選項字串，以分號 `;` 隔開 | `q.options` (陣列轉字串) |
| `is_required` | `TINYINT(1)` | 0 (False) | 該題是否為必填 | `q.isRequired` |
| `is_dependent` | `TINYINT(1)` | 0 (False) | 是否為承上題 (邏輯依賴) | `q.isDependent` |
| `parent_id` | `INT` | NULL | 關聯的父題目 ID (用於解鎖邏輯) | `q.parentId` |
| `max_selectable` | `INT` | NULL | 多選題最高可選數量 | `q.maxSelectable` |
| `max_characters` | `INT` | NULL | 簡答題最高字數限制 | `q.maxCharacters` |

---

## 二、 Eclipse / JPA 實體層開發指引 (Entity & logic)

### 1. Entity 映射建議 (使用 Hibernate/JPA)
在 `Survey.java` 中，請務必處理好與 `Question` 的關聯：

```java
@Column(name = "description")
private String type; // 對應前端的 type，但在 DB 中叫 description

@Column(name = "intro", columnDefinition = "TEXT")
private String description; // 對應前端的 description，但在 DB 中叫 intro

@OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
@JoinColumn(name = "survey_id")
private List<Question> questionsList;
```

### 2. 資料轉換邏輯 (Service 層)
**入庫 (儲存)**：
```java
// 將前端傳來的 List<String> 選項轉為分號隔開的字串
String optionsDb = String.join(";", req.getOptions());
question.setOptions(optionsDb);
```

**出庫 (讀取)**：
```java
// 將 DB 讀出的字串轉回 List 回傳給前端
String[] optionsArray = question.getOptions().split(";");
questionResponse.setOptions(Arrays.asList(optionsArray));
```

---

## 三、 MySQL 初始化與更新腳本

### 步驟 A：建立新資料表 (如果您要重新開始)
```sql
CREATE TABLE `survey` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` VARCHAR(100) DEFAULT NULL,
  `intro` TEXT DEFAULT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `participants` INT DEFAULT 0,
  `is_published` TINYINT(1) DEFAULT 0,
  `collect_name` TINYINT(1) DEFAULT 1,
  `collect_phone` TINYINT(1) DEFAULT 0,
  `collect_email` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 步驟 B：補強現有資料表 (推薦)
若您已有資料表，請逐一執行：
```sql
-- 修正問卷主表
ALTER TABLE survey ADD COLUMN intro TEXT AFTER description;
ALTER TABLE survey ADD COLUMN collect_name TINYINT(1) DEFAULT 1;
ALTER TABLE survey ADD COLUMN collect_phone TINYINT(1) DEFAULT 0;
ALTER TABLE survey ADD COLUMN collect_email TINYINT(1) DEFAULT 0;

-- 修正題目表
ALTER TABLE question ADD COLUMN is_dependent TINYINT(1) DEFAULT 0;
ALTER TABLE question ADD COLUMN parent_id INT DEFAULT NULL;
ALTER TABLE question ADD COLUMN max_selectable INT DEFAULT NULL;
ALTER TABLE question ADD COLUMN max_characters INT DEFAULT NULL;
```

---

## 四、 核心功能對接檢查清單

1.  **分號原則**：確認 MySQL 中的 `options` 欄位型態為 `TEXT`，因為選項數量無限制，字數可能極多。
2.  **布林值處理**：Java 的 `boolean` 在 MySQL 中對應 `TINYINT(1)`，0 代表 false，1 代表 true。
3.  **空值容錯**：`parent_id` 必須允許 `NULL`，因為並非所有題目都是承上題。
4.  **日期格式**：Java 應使用 `LocalDate` 來接收前端的 `YYYY-MM-DD` 字串。

祝您在 Eclipse 端的串接順利完成！
