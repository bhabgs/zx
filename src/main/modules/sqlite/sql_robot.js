const T = {
  name: "t_robot", //表名
  fields: [
    //表字段
    { field: "id", type: "char(50)", primaryKey: true },
    { field: "name", type: "char(50)" },
    { field: "iconUrl", type: "text" },
    { field: "accountId", type: "char(50)", primaryKey: true },
    { field: "remark", type: "text" },
    { field: "greeting", type: "text" },
    { field: "type", type: "int" },
    { field: "corpIdList", type: "text" },
    { field: "isDel", type: "int" },
    { field: "isDelinConversation", type: "int" }
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

const DROP_TABLE_ROBOT = `drop table if exists ${T.name}`;

const CREATE_TABLE_ROBOT = `create table if not exists ${T.name} (${T.fields
  .map(item => {
    return `${item.field} ${item.type}`;
  })
  .join(", ")}, primary key(${KEYLIST.join(",")}) )`;

const INSERT_ROBOT = `insert into ${T.name} (${FIELDLIST}) values(${new Array(
  T.fields.length + 1
)
  .join("?")
  .split("")
  .join(",")})`;
const INSERT_TEMPLATE = FIELDLIST;

const UPDATE_ROBOT = `update account set ${NOTKEYLIST.map(
  item => `${item}=?`
).join(", ")} where ${KEYLIST.map(item => `${item}=?`).join(", ")}`;
const UPDATE_TEMPLATE = [NOTKEYLIST, KEYLIST].join(",");

const INSERT_OR_REPLACE_ROBOT = `insert or replace into ${
  T.name
} (${FIELDLIST}) values(${new Array(T.fields.length + 1)
  .join("?")
  .split("")
  .join(",")})`;
const INSERT_OR_REPLACE_TEMPLATE = FIELDLIST;

const QUERY_ALL_ROBOT = `select ${FIELDLIST} from ${T.name}`;
const QUERY_BY_KEY_ROBOT = `select ${FIELDLIST} from ${
  T.name
} where ${KEYLIST.map(item => `${item}=?`).join(" and ")}`;

const QUERY_BY_KEY_ROBOT_TEMPLATE = KEYLIST;

const DELETE_ALL_ROBOT = `delete from ${T.name}`;
const DELETE_BY_KEY_ROBOT = `delete from ${T.name} where ${KEYLIST.map(
  item => `${item}=?`
).join(" and ")}`;

const DELETE_BY_KEY_ROBOT_TEMPLATE = KEYLIST;

export const ROBOT_SQL = {
  CREATE_TABLE_ROBOT,
  DROP_TABLE_ROBOT,
  INSERT_ROBOT,
  UPDATE_ROBOT,
  INSERT_OR_REPLACE_ROBOT,
  QUERY_BY_KEY_ROBOT,
  DELETE_BY_KEY_ROBOT,
  DELETE_ALL_ROBOT,
  QUERY_ALL_ROBOT
};

export const ROBOT_SQL_TEMPLATE = {
  [INSERT_ROBOT]: INSERT_TEMPLATE,
  [UPDATE_ROBOT]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE_ROBOT]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_ALL_ROBOT]: FIELDLIST,
  [QUERY_BY_KEY_ROBOT]: QUERY_BY_KEY_ROBOT_TEMPLATE,
  [DELETE_BY_KEY_ROBOT]: DELETE_BY_KEY_ROBOT_TEMPLATE
};

export const ROBOT = T;
