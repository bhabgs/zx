## 公共组件

> 公共组件会自动注册到全局，组件中引用时不需要再次注册

1. `group-photo`

   > 群主头像，内部使用了 user-photo 组件实现

2. `not-select-chat`

   > 未选择聊天

3. `search-result`

   > 人员搜索

4. `user-photo`
   > 个人头像

### select-organizational

> 组织架构选择组件，没有弹出层，使用时需要用弹窗包裹使用

1. 接收参数

```
// 1. v-model 绑定选中人员或部门，
{
  depts: Array<Object>, // 选中部门
  users: Array<Object> // 选中人员
}
// 2. visible 弹窗的显示隐藏状态，用来判断进行初始化，Boolean类型

// 3. option
{
  type: Number, // 选择类型， 1：选择人，2：选择部门，3：选择部门+人，4：只能选人
  radio: Boolean, // 单选、多选，true：单选，false：多选
  checkedNext: Boolean  // 选中部门后是否还能点击进入，true：可以，false：禁止
  disableSelect: Array<String>, // 禁止选择人选id
  disableDept: Array<String>, // 禁止选择部门id
  disableDelete: Array<String>, // 禁止删除人员（id）
  disableWarning: String, // 用户选择被禁选人员时的提示语
}
```
