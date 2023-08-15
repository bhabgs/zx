/**
 * 用于跨表之间的查询操作，满足业务需求
 */
const EMPTY_SQL = "empty";
const UNION_GLOBALSEARCH_CONTACT =
  "select *,(case when (name like '%'||?||'%' and length(?)>=1) then 1 end) as _isName, (case when (mobile like '%'||?||'%' and length(?)>=9 and (visibleState !=-1 or visibleState is null)) then 1 end) as _isMobile from t_account where _isName is not null or _isMobile is not null order by type;";
const UNION_GLOBALSEARCH_CONTACT_TEMPLATE =
  "__search__,__search__,__search__,__search__";
// 搜索最新的消息
const UNION_GLOBALSEARCH_CONTACT_MESSAGE =
  "select * from t_message where conversationType=1 and messageId is not null group by targetId having max(sentTime);";

const UNION_GLOBALSEARCH_GROUP =
  "select t_group.*,t._groupMemberIds,t._groupMemberNames,(case when (t_group.name like '%'||?||'%') then 1 end) as _isName,(case when (t._groupMemberNames is not null) then 1 end) as _isGroupMemberNames from t_group left outer join (select id,group_concat(accountId) as _groupMemberIds,group_concat(name,'、') as _groupMemberNames from (select t_group.id,t_account_uniq.accountId,t_account_uniq.name from (select accountId,name,corpId from (select accountId,name,corpId from t_account where name like '%'||?||'%' order by type asc) group by accountId) as t_account_uniq,t_group_groupmembers,t_group where (t_group.id=t_group_groupmembers.id and t_account_uniq.accountId=t_group_groupmembers.accountId)union select t_group.id,t_account_uniq.accountId,t_account_uniq.name from (select accountId,name,corpId from (select accountId,name,corpId from t_account where name like '%'||?||'%' order by type asc) group by accountId) as t_account_uniq,t_group where (t_account_uniq.accountId=t_group.owner)) group by id ) as t on t_group.id=t.id where _isName is not null or _isGroupMemberNames is not null;";
const UNION_GLOBALSEARCH_GROUP_TEMPLATE = "__search__,__search__,__search__";
const UNION_GLOBALSEARCH_GROUP_MESSAGE =
  "select * from t_message where conversationType=3 and messageId is not null group by targetId having max(sentTime);";

const UNION_RECALL_MESSAGE_BY_MESSAGEID =
  "select t_message.*,t_account_only.name from t_message left outer join (select distinct accountId,name from t_account group by accountId) as t_account_only on t_message.senderUserId=t_account_only.accountId where t_message.messageUId=?;";
const UNION_RECALL_MESSAGE_BY_MESSAGEID_TEMPLATE = "messageUId";
export const UNION_QUERY_SQL = {
  EMPTY_SQL, //用于默认标志
  UNION_GLOBALSEARCH_CONTACT,
  UNION_GLOBALSEARCH_GROUP,
  UNION_GLOBALSEARCH_CONTACT_MESSAGE,
  UNION_GLOBALSEARCH_GROUP_MESSAGE,
  UNION_RECALL_MESSAGE_BY_MESSAGEID,
};

export const UNION_QUERY_SQL_TEMPLATE = {
  [UNION_GLOBALSEARCH_CONTACT]: UNION_GLOBALSEARCH_CONTACT_TEMPLATE,
  [UNION_GLOBALSEARCH_GROUP]: UNION_GLOBALSEARCH_GROUP_TEMPLATE,
  [UNION_RECALL_MESSAGE_BY_MESSAGEID]:
    UNION_RECALL_MESSAGE_BY_MESSAGEID_TEMPLATE,
};
