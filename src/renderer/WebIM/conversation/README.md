## 会话

### ConversationModel
> 会话模型
```
export {
  ConversationType
}
```
1. **ConversationType**
> 会话类型

| 会话名称 | 会话类型 ConversationType | 对应的 targetId |
| -- | -- | -- |
| 单聊 | `PRIVATE` | 用户的`Id (userId)` |
| 群组 | `GROUP` | 群组的`Id (groupId)` |
| 聊天室 | `CHATROOM` | 聊天室的`Id (chatroomId)` |
| 客服 | `CUSTOMER_SERVICE` | 客服的`Id (customerServiceId)` |
| 系统会话 | `SYSTEM` | 系统账户`Id` |
| 应用公众服务 | `APP_PUBLIC_SERVICE` | 应用公众服务的`Id (publicServiceId)` |
| 公众服务 | `PUBLIC_SERVICE` | 公众服务的`Id (publicServiceId)` |