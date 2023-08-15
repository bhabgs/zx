/**
 * 会话信息表
 */
const T = {
  name: "t_message", //表名
  fields: [
    //表字段
    { field: "messageId", type: "int", primaryKey: true },
    { field: "bySelf", type: "char(50)" },
    { field: "content", type: "text" },
    { field: "conversationType", type: "int" },
    { field: "extra", type: "text" },
    { field: "isLocalMessage", type: "int(1)" },
    { field: "messageDirection", type: "int" },
    { field: "messageState", type: "int" },
    { field: "messageTime", type: "int" },
    { field: "messageType", type: "char(50)" },
    { field: "messageUId", type: "char(50)" },
    { field: "objectName", type: "char(50)" },
    { field: "offLineMessage", type: "int(1)" },
    { field: "recState", type: "int" },
    { field: "receiptResponse", type: "text" },
    { field: "receivedStatus", type: "int" },
    { field: "receivedTime", type: "int" },
    { field: "senderUserId", type: "char(50)" },
    { field: "sentStatus", type: "int" },
    { field: "sentStatusText", type: "char(50)" },
    { field: "sentTime", type: "int" },
    { field: "systemMessage", type: "text" },
    { field: "targetId", type: "char(50)" },
  ]
};
const FIELDLIST = T.fields.map(item => item.field).join(",");
//主键字段数组
const KEYLIST = T.fields
  .filter(item => item.primaryKey)
  .map(item => item.field);
//非主键字段数组
const NOTKEYLIST = T.fields
  .filter(item => !item.primaryKey)
  .map(item => item.field);

const CREATE_TABLE = `create table if not exists ${T.name} (${T.fields
  .map(item => {
    return `${item.field} ${item.type}`;
  })
  .join(", ")}, primary key(${KEYLIST.join(",")}) )`;
const DROP_TABLE = `drop table if exists ${T.name}`;
const INSERT = `insert into ${T.name} (${FIELDLIST}) values(${new Array(
  T.fields.length + 1
)
  .join("?")
  .split("")
  .join(",")})`;
const INSERT_TEMPLATE = FIELDLIST;

const UPDATE = `update ${T.name} set ${NOTKEYLIST.map(item => `${item}=?`).join(
  ", "
)} where ${KEYLIST.map(item => `${item}=?`).join(", ")}`;
const UPDATE_TEMPLATE = [NOTKEYLIST, KEYLIST].join(",");

const INSERT_OR_REPLACE = `insert or replace into ${
  T.name
} (${FIELDLIST}) values(${new Array(T.fields.length + 1)
  .join("?")
  .split("")
  .join(",")})`;
const INSERT_OR_REPLACE_TEMPLATE = FIELDLIST;

const QUERY = `select ${FIELDLIST} from ${T.name}`;
const QUERY_BY_KEY = `select ${FIELDLIST} from ${T.name} where ${KEYLIST.map(
  item => `${item}=?`
).join(" and ")}`;
const QUERY_BY_KEY_TEMPLATE = KEYLIST.join(",");

const DELETE = `delete from ${T.name}`;
const DELETE_BY_KEY = `delete from ${T.name} where ${KEYLIST.map(
  item => `${item}=?`
).join(" and ")}`;
const DELETE_BY_KEY_TEMPLATE = [KEYLIST].join(",");
const CREATE_INDEX_TABLE_ON_KEYS = `create index if not exists ${
  T.name
}${KEYLIST.map(item => `_${item}`).join("")} on ${T.name}(${KEYLIST.map(
  item => `${item}`
).join(",")});`;

const QUERY_FOR_SEARCH_ALL = `select  ${FIELDLIST} from ${
  T.name
} where ${FIELDLIST.split(",").join("||")} like '%'||?||'%' `;
const QUERY_FOR_SEARCH_ALL_TEMPLATE = "__search__";

export const MESSAGE_SQL = {
  CREATE_TABLE_MESSAGE: CREATE_TABLE, //创建表
  DROP_TABLE_MESSAGE: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_MESSAGE: INSERT_OR_REPLACE, //插入或更新行
  QUERY_MESSAGE: QUERY, //全量查询
  QUERY_MESSAGE_BY_KEY: QUERY_BY_KEY, //根据主键查询
  QUERY_MESSAGE_FOR_SEARCH_ALL: QUERY_FOR_SEARCH_ALL, //全字段检索查询，速度较慢
  DELETE_MESSAGE: DELETE, //清空数据
  DELETE_MESSAGE_BY_KEY: DELETE_BY_KEY //根据主键删除行
};

export const MESSAGE_SQL_TEMPLATE = {
  [INSERT]: INSERT_TEMPLATE,
  [UPDATE]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_FOR_SEARCH_ALL]: QUERY_FOR_SEARCH_ALL_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE
};

export const MESSAGE = T