/**
 * 根据接口groupListApi的返回值构建的此表
 * 影响当前表的有以下情况：
 * 1.接口 groupListApi
 * 2.接口 groupListApiVo
 * 3.接口 groupInfoApi
 * 4.接口 createGroup
 * 5.接口 updateGroup
 * 6.接口 quitGroup
 * 7.接口 transferGroup
 *
 * 存在的问题：
 * 1.
 */
const T = {
  name: "t_group", //表名
  fields: [
    //表字段
    { field: "id", type: "char(50)", primaryKey: true },
    { field: "comment", type: "char(50)" },
    { field: "corpId", type: "char(50)" },
    { field: "corpName", type: "char(50)" },
    { field: "createAt", type: "char(50)" },
    { field: "creator", type: "char(50)" },
    { field: "deptId", type: "char(50)" },
    { field: "freshViewHistory", type: "int" },
    { field: "groupMemberList", type: "text" }, //group/get没有此字段,会是null
    { field: "groupMembers", type: "text" },
    { field: "groupRobots", type: "text" },
    { field: "groupNumber", type: "int" },
    { field: "isDelete", type: "int" },
    { field: "isIn", type: "int" },
    { field: "joinTime", type: "char(50)" },
    { field: "name", type: "char(50)" },
    { field: "onlyOwnerAtAll", type: "int" },
    { field: "onlyOwnerManage", type: "int" },
    { field: "onlyOwnerUpdate", type: "int" },
    { field: "owner", type: "char(50)" },
    { field: "type", type: "int" },
    { field: "updateAt", type: "char(50)" },
    { field: "updator", type: "char(50)" },
    { field: "userLimit", type: "int" }
  ]
};
const FIELDLIST = T.fields.map(item => item.field).join(","); //所有字段逗号分割，如：accountId,avatar,canJoin,corpId,corpName,createAt
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

const INSERT_OR_REPLACE = `insert or replace into ${T.name
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
const CREATE_INDEX_TABLE_ON_KEYS = `create index if not exists ${T.name
  }${KEYLIST.map(item => `_${item}`).join("")} on ${T.name}(${KEYLIST.map(
    item => `${item}`
  ).join(",")});`;

const QUERY_FOR_SEARCH_ALL = `select  ${FIELDLIST} from ${T.name
  } where ${FIELDLIST.split(",").join("||")} like '%'||?||'%' `;
const QUERY_FOR_SEARCH_ALL_TEMPLATE = "__search__";

export const GROUP_SQL = {
  CREATE_TABLE_GROUP: CREATE_TABLE, //创建表
  DROP_TABLE_GROUP: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_GROUP: INSERT_OR_REPLACE, //插入或更新行
  QUERY_GROUP: QUERY, //全量查询
  QUERY_GROUP_BY_KEY: QUERY_BY_KEY, //根据主键查询
  QUERY_GROUP_FOR_SEARCH_ALL: QUERY_FOR_SEARCH_ALL, //全字段检索查询，速度较慢
  DELETE_GROUP: DELETE, //清空数据
  DELETE_GROUP_BY_KEY: DELETE_BY_KEY //根据主键删除行
};

export const GROUP_SQL_TEMPLATE = {
  [INSERT]: INSERT_TEMPLATE,
  [UPDATE]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_FOR_SEARCH_ALL]: QUERY_FOR_SEARCH_ALL_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE
};

export const GROUP = T