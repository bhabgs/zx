/**
 * 用于全文检索，记录到本地
 */
const T = {
  name: "t_local_search_history", //表名
  fields: [
    //表字段
    { field: "type", type: "char(50)", primaryKey: true },//区分类型
    { field: "id", type: "char(50)", primaryKey: true },
    { field: "value", type: "char(50)" },
    { field: "updateTime", type: "datetime" },
  ]
};

const FIELDLIST = T.fields.filter(item => item.field != 'updateTime').map(item => item.field).join(",");
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

const INSERT_OR_REPLACE = `insert or replace into ${T.name
  } (${FIELDLIST},updateTime) values(${new Array(T.fields.length)
    .join("?")
    .split("")
    .join(",")},datetime('now'))`
const INSERT_OR_REPLACE_TEMPLATE = FIELDLIST;

const QUERY = `select ${FIELDLIST} from ${T.name}`;
const QUERY_BY_KEY = `select ${FIELDLIST} from ${T.name} where ${KEYLIST.map(
  item => `${item}=?`
).join(" and ")}`;
const QUERY_BY_KEY_TEMPLATE = KEYLIST.join(",");

const QUERY_BY_TYPE_LIMIT = `select ${FIELDLIST} from ${T.name} where type=? order by updateTime desc limit 12`;
const QUERY_BY_TYPE_LIMIT_TEMPLATE = `type`;

const QUERY_LIMIT = `select ${FIELDLIST} from ${T.name} order by updateTime desc limit 12`;


const DELETE = `delete from ${T.name}`;

const DELETE_BY_KEY = `delete from ${T.name} where ${KEYLIST.map(
  item => `${item}=?`
).join(" and ")}`;
const DELETE_BY_KEY_TEMPLATE = [KEYLIST].join(",");

export const LOCAL_SEARCH_HISTORY_SQL = {
  CREATE_TABLE_LOCAL_SEARCH_HISTORY: CREATE_TABLE, //创建表
  DROP_TABLE_LOCAL_SEARCH_HISTORY: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_LOCAL_SEARCH_HISTORY: INSERT_OR_REPLACE, //插入或更新行
  QUERY_LOCAL_SEARCH_HISTORY: QUERY, //全量查询
  QUERY_LOCAL_SEARCH_HISTORY_LIMIT: QUERY_LIMIT, //
  QUERY_LOCAL_SEARCH_HISTORY_BY_TYPE_LIMIT: QUERY_BY_TYPE_LIMIT, //
  QUERY_LOCAL_SEARCH_HISTORY_BY_KEY: QUERY_BY_KEY, //根据主键查询
  DELETE_LOCAL_SEARCH_HISTORY: DELETE, //清空数据
  DELETE_LOCAL_SEARCH_HISTORY_BY_KEY: DELETE_BY_KEY //根据主键删除行
};

export const LOCAL_SEARCH_HISTORY_SQL_TEMPLATE = {
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_BY_TYPE_LIMIT]: QUERY_BY_TYPE_LIMIT_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE
};

export const LOCAL_SEARCH_HISTORY = T