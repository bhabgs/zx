/**
 * 用于记录增量更新时间
 * 该表自己维护，用于记录入本地库的一些时间
 */
// const selfTable = [
//   { name: "account", updateTime: "" },//记录人员已入库的时间（仅限于增量和全量，单个查询不更新，避免并发）；
//   { name: "group", updateTime: "" },//记录群组已入库的时间（仅限于增量和全量，单个查询不更新，避免并发）；
//   { name: "storage", updateTime: "" }//记录收纳组已入库的时间（仅限于增量和全量，单个查询不更新，避免并发）
//   { name: "upgrade", updateTime: "" }//记录上次强制升级的时间
// ];
const T = {
  name: "t_updateTime", //表名
  fields: [
    //表字段
    { field: "id", type: "char(50)", primaryKey: true },
    { field: "updateTime", type: "int" }
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

export const UPDATETIME_SQL = {
  CREATE_TABLE_UPDATETIME: CREATE_TABLE, //创建表
  DROP_TABLE_UPDATETIME: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_UPDATETIME: INSERT_OR_REPLACE, //插入或更新行
  QUERY_UPDATETIME: QUERY, //全量查询
  QUERY_UPDATETIME_BY_KEY: QUERY_BY_KEY, //根据主键查询
  QUERY_UPDATETIME_FOR_SEARCH_ALL: QUERY_FOR_SEARCH_ALL, //全字段检索查询，速度较慢
  DELETE_UPDATETIME: DELETE, //清空数据
  DELETE_UPDATETIME_BY_KEY: DELETE_BY_KEY //根据主键删除行
};

export const UPDATETIME_SQL_TEMPLATE = {
  [INSERT]: INSERT_TEMPLATE,
  [UPDATE]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_FOR_SEARCH_ALL]: QUERY_FOR_SEARCH_ALL_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE
};

export const UPDATETIME = T;
