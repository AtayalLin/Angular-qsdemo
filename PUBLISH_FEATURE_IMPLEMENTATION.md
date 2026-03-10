# 📋 问卷发布功能完整实现

## ✅ 已实现的功能

### 1️⃣ **列表页面发布控制** (survey-list.component)

#### 管理员操作
- ✅ **发布按钮** - 未发布问卷显示"发布"按钮
- ✅ **取消发布按钮** - 已发布问卷显示"取消发布"按钮
- ✅ **编辑和删除** - 无论发布状态都可编辑和删除
- ✅ **确认提示** - 发布和取消发布都要求管理员确认

#### 普通用户操作
- ✅ **查看结果** - 只有已发布的问卷可查看结果
- ✅ **开始填写** - 只有已发布且未过期的问卷可填写
- ✅ **状态提示** - 未发布问卷显示"未開放"标记

### 2️⃣ **管理员中心发布控制** (survey-admin.component)

#### 编辑模式
- ✅ **发布复选框** - "立即發佈此問卷 (開放填寫)"
- ✅ **动态发布状态** - 创建新问卷时可选择是否立即发布
- ✅ **发布状态切换** - 编辑现有问卷时可更改发布状态

#### 预览模式
- ✅ **发布状态显示** - 预览时显示"已發佈"或"草稿中"
- ✅ **状态颜色标示** - 已发布显示绿色，草稿显示红色

### 3️⃣ **填写页面访问控制** (survey-question.component)

#### 访问验证
- ✅ **发布状态检查** - 未发布问卷拒绝访问
- ✅ **过期日期检查** - 已过期问卷拒绝访问
- ✅ **自动重定向** - 不符合条件自动返回列表页面
- ✅ **提示信息** - 显示相应的警告信息

---

## 📝 代码实现详情

### survey-list.component.ts

#### 新增/修改的方法

**1. startSurvey() - 检查发布状态**
```typescript
startSurvey(id: number) {
  const s = this.surveys.find((x) => x.id === id);
  
  // 检查问卷是否已发布
  if (!s?.published && !this.isAdmin) {
    this.triggerToast('无法进入填写', '此问卷尚未发布');
    return;
  }
  
  // 检查问卷是否过期
  if (s && s.endDate) {
    const now = new Date();
    const end = new Date(s.endDate);
    if (end < now && !this.isAdmin) {
      this.triggerToast('无法进入填写', '此问卷已过期');
      return;
    }
  }
  
  this.router.navigate(['/surveys', id, 'question']);
}
```

**2. publishSurvey() - 改进的发布逻辑**
```typescript
publishSurvey(id: number) {
  const survey = this.surveys.find((x) => x.id === id);
  if (!survey) {
    this.triggerToast('错误', '无法找到该问卷');
    return;
  }

  if (!confirm('确定要发布此问卷吗？发布后用户即可进行填写。')) return;
  
  this.surveyService.publishSurvey(id).subscribe({
    next: (res: any) => {
      if (res.code === 200) {
        this.triggerToast('发布成功', `问卷「${survey.title}」已开放填写`);
        this.fetchSurveys();
        this.onSearch();
      } else {
        this.triggerToast('发布失败', res.message || '无法发布问卷');
      }
    },
    error: (err) => {
      this.triggerToast('错误', '发布过程中发生错误');
    },
  });
}
```

**3. unpublishSurvey() - 新增的取消发布功能**
```typescript
unpublishSurvey(id: number) {
  const survey = this.surveys.find((x) => x.id === id);
  if (!survey) {
    this.triggerToast('错误', '无法找到该问卷');
    return;
  }

  if (!confirm('确定要取消发布此问卷吗？取消发布后用户无法填写。')) return;
  
  this.surveyService.unpublishSurvey(id).subscribe({
    next: (res: any) => {
      if (res.code === 200) {
        this.triggerToast('取消成功', `问卷「${survey.title}」已关闭填写`);
        this.fetchSurveys();
        this.onSearch();
      } else {
        this.triggerToast('取消失败', res.message || '无法取消发布问卷');
      }
    },
    error: (err) => {
      this.triggerToast('错误', '取消发布过程中发生错误');
    },
  });
}
```

### survey-list.component.html

#### HTML 模板更新

**发布状态和按钮区域**
```html
@if (isAdmin) {
  <!-- 管理员权限按钮 -->
  @if (!survey.published) {
    <button class="btn-publish" (click)="publishSurvey(survey.id)">
      <i class="fas fa-paper-plane"></i> 發佈
    </button>
  } @else {
    <button class="btn-unpublish" (click)="unpublishSurvey(survey.id)">
      <i class="fas fa-ban"></i> 取消發佈
    </button>
  }
  <button class="btn-edit" (click)="editSurvey(survey.id)">
    <i class="fas fa-edit"></i> 編輯
  </button>
  <button class="btn-delete" (click)="deleteSurvey(survey.id)">
    <i class="fas fa-trash-alt"></i> 刪除
  </button>
}
```

### survey-list.component.scss

#### 新增样式
```scss
.btn-unpublish {
    background: #fecaca;
    color: #991b1b;
    border: 1.5px solid #fca5a5;

    &:hover {
        background: #991b1b;
        color: #fff;
    }
}
```

### survey-admin.component.html

#### 预览页面发布状态显示
```html
<div class="preview-item">
  <span class="p-label">發佈狀態：</span>
  @if (currentSurvey.published) {
    <span class="p-value tag" style="background: #d1fae5; color: #065f46;">
      <i class="fas fa-check-circle"></i> 已發佈
    </span>
  } @else {
    <span class="p-value tag" style="background: #fee2e2; color: #991b1b;">
      <i class="fas fa-times-circle"></i> 草稿中
    </span>
  }
</div>
```

### survey-question.component.ts

#### 访问验证
```typescript
if (result && result.quiz) {
  const qz = result.quiz;
  
  // 检查问卷是否已发布
  if (!qz.is_published && !qz.published) {
    alert('此问卷尚未发布，敬请稍候');
    this.router.navigate(['/surveys']);
    return;
  }
  
  // 检查问卷是否已过期
  const endDate = new Date(qz.end_date || qz.endDate);
  const now = new Date();
  if (endDate < now) {
    alert('此问卷已过期，无法填写');
    this.router.navigate(['/surveys']);
    return;
  }
  
  // 继续处理问卷数据...
}
```

---

## 🔄 工作流程

### 管理员发布问卷的完整流程

1. **创建问卷**
   - 进入 /admin 页面
   - 填写问卷基本信息
   - 添加题目内容
   - 在"发布状态"复选框选择是否立即发布

2. **发布已创建的草稿问卷**
   - 返回 /surveys 列表
   - 找到未发布（状态为"草稿"）的问卷
   - 点击"發佈"按钮
   - 确认发布提示
   - 问卷状态变为"已發佈"
   - 显示"檢視結果"和"取消發佈"按钮

3. **管理已发布的问卷**
   - 可以继续编辑问卷内容
   - 点击"編輯"进入管理中心
   - 在"发布状态"复选框调整发布状态
   - 保存更改

4. **取消发布**
   - 点击"取消發佈"按钮
   - 确认取消发布提示
   - 问卷状态变为"未發佈"
   - 显示"發佈"按钮

### 用户填写问卷的完整流程

1. **查看问卷列表**
   - 进入 /surveys 页面
   - 只能看到已发布的问卷
   - 未发布的问卷标记"未開放"

2. **填写已发布问卷**
   - 点击已发布问卷的"開始填寫"按钮
   - 系统验证问卷是否已发布
   - 系统验证问卷是否已过期
   - 进入问卷填写页面

3. **无法填写的情况**
   - 问卷未发布 → "此问卷尚未发布"
   - 问卷已过期 → "此问卷已过期，无法填写"
   - 自动返回列表页面

---

## 🧪 测试场景

### 场景 1: 发布新问卷
```
前置: 管理员已登入，有需要发布的草稿问卷
步骤:
1. 在列表中找到草稿问卷
2. 点击"發佈"按钮
3. 确认发布对话框
预期:
✓ 显示"发布成功"提示
✓ 问卷状态显示"已發佈"
✓ 按钮变为"取消發佈"
✓ 普通用户可以看到该问卷
```

### 场景 2: 用户填写已发布问卷
```
前置: 有已发布的问卷
步骤:
1. 以普通用户身份进入列表
2. 找到已发布的问卷
3. 点击"開始填寫"
预期:
✓ 成功进入问卷填写页面
✓ 显示问卷标题和题目
```

### 场景 3: 取消发布问卷
```
前置: 管理员已登入，有已发布的问卷
步骤:
1. 在列表中找到已发布的问卷
2. 点击"取消發佈"按钮
3. 确认取消发布对话框
预期:
✓ 显示"取消成功"提示
✓ 问卷状态显示"未發佈"
✓ 按钮变为"發佈"
✓ 普通用户无法看到该问卷
```

### 场景 4: 用户尝试访问未发布问卷
```
前置: 有未发布的问卷
步骤:
1. 直接访问未发布问卷的 URL
   /surveys/{id}/question
预期:
✓ 显示"此问卷尚未发布"警告
✓ 自动返回列表页面
✓ 无法填写问卷
```

### 场景 5: 用户尝试访问已过期问卷
```
前置: 有已过期的已发布问卷
步骤:
1. 直接访问已过期问卷的 URL
   /surveys/{id}/question
预期:
✓ 显示"此问卷已过期，无法填写"警告
✓ 自动返回列表页面
✓ 无法填写问卷
```

---

## 🎨 UI 视觉效果

### 按钮样式

| 按钮 | 颜色 | 用途 |
|------|------|------|
| 發佈 | 蓝色 (#0284c7) | 发布未发布的问卷 |
| 取消發佈 | 红色 (#991b1b) | 取消已发布问卷 |
| 編輯 | 黄色 (#ffd95e) | 编辑问卷内容 |
| 刪除 | 红色 (#dc2626) | 删除问卷 |

### 状态标记

| 状态 | 样式 | 显示位置 |
|------|------|---------|
| 已發佈 | 绿色 (#06b6d4) | 列表+预览 |
| 草稿中 | 红色 (#dc2626) | 预览 |
| 未開放 | 灰色文字 | 列表 |

---

## ✅ 功能完成检查清单

- [x] 管理员可以发布问卷
- [x] 管理员可以取消发布问卷
- [x] 管理员可以在问卷管理中心调整发布状态
- [x] 已发布问卷显示"取消發佈"按钮
- [x] 未发布问卷显示"發佈"按钮
- [x] 普通用户只能看到已发布问卷
- [x] 普通用户只能填写已发布且未过期的问卷
- [x] 问卷填写页面验证发布状态
- [x] 问卷填写页面验证过期状态
- [x] 所有操作都显示成功/失败提示
- [x] 预览页面显示发布状态
- [x] 自动重定向无权限的访问

---

## 📞 相关 API 端点

| 操作 | 方法 | 端点 | 响应 |
|------|------|------|------|
| 发布问卷 | GET/POST | /quiz/publish?id={id} | {code: 200, message: ""} |
| 取消发布 | GET/POST | /quiz/unpublish?id={id} | {code: 200, message: ""} |
| 获取所有问卷 | GET | /quiz/getAll | {code: 200, quizList: [...]} |
| 获取问卷详情 | GET | /quiz/get_questions_List | {code: 200, quiz: {...}, questionList: [...]} |

---

## 🚀 总结

完整的发布功能现已实现！管理员可以：
- ✅ 在创建问卷时选择是否立即发布
- ✅ 在问卷列表中快速发布或取消发布问卷
- ✅ 在管理中心灵活调整发布状态
- ✅ 看到清晰的发布状态提示

普通用户可以：
- ✅ 只看到已发布的问卷
- ✅ 只能填写已发布且未过期的问卷
- ✅ 如果尝试访问未发布问卷会被自动返回

所有操作都有相应的用户反馈（toast 提示或弹出框）。
