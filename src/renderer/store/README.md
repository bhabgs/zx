### Vuex

- module 模块
- plugins 插件

- getters 全局 getter

  > 1. GetUser 获取用户信息
  > 3. GetAllUserMap 获取所有人员数据`(Object<Obejct>)`
  > 4. GetMsgFocusID 获取当前的焦点消息（例如：播放中的视频、音频）

- actions 全局 action

  > 1. SaveUserInfo 保存登录人信息
  > 2. setAllUser 保存所有人员数据`(Array<Object>)`
  > 3. SetAllUserMap 保存所有人员数据`(Object<Obejct>)`
  > 4. SetMsgIDAction 设置焦点消息
  > 5. LogOutAction 退出登录，用于清空所有 state

- mutation 全局 mutation

  > 1. UpUserData 存储登录用户信息
  > 3. SETALLUSERMAP 存储所有人员数据`(Object<Obejct>)`
  > 4. UPMSGID 设置当前的焦点消息（例如：播放中的视频、音频）
  > 5. RESETSTATE 重置 state

- state 全局 state

```
  user: {     // 登录人信息
    name: "",
    info: ""
  },
  AllUserMap: {}, // 所有人员信息map
  MsgFocusID: "" // 活跃消息ID
```

- stateTemplate 所有 state 模板
```
  baseState: {  // 全局state
    user: {
      name: "",
      info: ""
    },
    AllUserMap: {},
    MsgFocusID: "" // 活跃消息ID
  },
  dialogState: {  // 会话模块 state
    Dialogues: [],
    OpenDialog: {},
    TopMap: {},
    ReminderMap: {},
    HintFlag: 0, // 更新以触发声音提醒
    IsHintMap: {}
  },
  groupState: { // 群模块state
    GroupsMap: {}
  },
  messageState: { // 消息模块state
    ChatMSG: {}, // 单聊消息
    AtMsgMap: {}
  }
```
