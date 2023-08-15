/**
 * 根据接口getTopAndDisturbList的返回值中的rellist构建此表
 */
const T = {
  name: "t_storage_rellist", //表名
  fields: [
    //表字段
    { field: "id", type: "char(50)", primaryKey: true },
    { field: "beId", type: "char(50)", primaryKey: true },
    { field: "objectType", type: "char(50)", primaryKey: true }
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

const DELETE_STORAGE_RELLIST_BY_ID = `delete from ${T.name} where id=?`;
const DELETE_STORAGE_RELLIST_BY_ID_TEMPLATE = "id";

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

export const STORAGE_RELLIST_SQL = {
  CREATE_TABLE_STORAGE_RELLIST: CREATE_TABLE, //创建表
  DROP_TABLE_STORAGE_RELLIST: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_STORAGE_RELLIST: INSERT_OR_REPLACE, //插入或更新行
  QUERY_STORAGE_RELLIST: QUERY, //全量查询
  QUERY_STORAGE_RELLIST_BY_KEY: QUERY_BY_KEY, //根据主键查询
  QUERY_STORAGE_RELLIST_FOR_SEARCH_ALL: QUERY_FOR_SEARCH_ALL, //全字段检索查询，速度较慢
  DELETE_STORAGE_RELLIST: DELETE, //清空数据
  DELETE_STORAGE_RELLIST_BY_ID,
  DELETE_STORAGE_RELLIST_BY_KEY: DELETE_BY_KEY //根据主键删除行
};

export const STORAGE_RELLIST_SQL_TEMPLATE = {
  [INSERT]: INSERT_TEMPLATE,
  [UPDATE]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_FOR_SEARCH_ALL]: QUERY_FOR_SEARCH_ALL_TEMPLATE,
  [DELETE_STORAGE_RELLIST_BY_ID]: DELETE_STORAGE_RELLIST_BY_ID_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE
};

export const STORAGE_RELLIST = T
