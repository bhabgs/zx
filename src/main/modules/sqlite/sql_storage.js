/**
 * 根据接口getTopAndDisturbList的返回值构建的此表
 * 影响当前表的有以下情况：
 * 1.接口getCompanyUsers
 * 2.接口getAccountInformationOrganization
 * 3.接口getChangeResultData
 * 4.getListIuUser
 * 
 * 存在的问题：
 * 1.目前只有插入和更新机制，没有删除机制；
 * 2.目前仅限于登录后增量或全量查询，查看详情更新，但没有实时变动更新的消息机制；
 */
const T = {
  name: "t_storage", //表名
  fields: [
    //表字段
    { field: "id", type: "char(50)", primaryKey: true },
    { field: "accountId", type: "char(50)" },//当前用户的id，实际没用上
    { field: "belongSubgroup", type: "int" },
    { field: "comment", type: "char(50)" },
    { field: "corpId", type: "char(50)" },//当前公司的id，实际也没用上
    { field: "extra", type: "char(50)" },//目前是空字段
    { field: "isDelete", type: "char(50)" },// 如果isDelete字段为1的数据全清空，这个字段也就可以去掉了
    { field: "isDisturb", type: "char(50)" },//目前实际不支持
    { field: "isTop", type: "char(50)" },
    { field: "name", type: "char(50)" },
    { field: "relList", type: "text" },//由于独立成表了，该字段可能和关联的表字段不一致，考虑删除
    { field: "updateAt", type: "char(50)" },
    { field: "userId", type: "char(50)" }
  ]
};
const FIELDLIST = T.fields.map(item => item.field).join(","); //所有字段逗号分割，如account表：accountId,avatar,canJoin,corpId,corpName,createAt
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

export const STORAGE_SQL = {
  CREATE_TABLE_STORAGE: CREATE_TABLE, //创建表
  DROP_TABLE_STORAGE: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_STORAGE: INSERT_OR_REPLACE, //插入或更新行
  QUERY_STORAGE: QUERY, //全量查询
  QUERY_STORAGE_BY_KEY: QUERY_BY_KEY, //根据主键查询
  QUERY_STORAGE_FOR_SEARCH_ALL: QUERY_FOR_SEARCH_ALL, //全字段检索查询，速度较慢
  DELETE_STORAGE: DELETE, //清空数据
  DELETE_STORAGE_BY_KEY: DELETE_BY_KEY //根据主键删除行
};

export const STORAGE_SQL_TEMPLATE = {
  [INSERT]: INSERT_TEMPLATE,
  [UPDATE]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_FOR_SEARCH_ALL]: QUERY_FOR_SEARCH_ALL_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE
};

export const STORAGE = T
