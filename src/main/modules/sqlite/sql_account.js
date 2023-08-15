/**
 * 根据接口getCompanyUsers的返回值构建的此表
 * 影响当前表的有以下情况：
 * 1.接口 getCompanyUsers
 * 2.接口 getAccountInformationOrganization(结构不一样，不再处理)
 * 3.接口 getChangeResultData
 * 4.接口 getListIuUser
 * 5.接口 fixContact
 *
 * 存在的问题：
 * 1.目前只有插入和更新机制，没有删除机制；
 * 2.目前仅限于登录后增量或全量查询，查看详情更新，但没有实时变动更新的消息机制；
 */
const T = {
  name: "t_account", //表名
  fields: [
    //表字段
    { field: "accountId", type: "char(50)", primaryKey: true },
    { field: "avatar", type: "text" },
    { field: "canJoin", type: "int" },
    { field: "corpId", type: "char(50)", primaryKey: true },
    { field: "corpLabelName", type: "text" },
    { field: "corpName", type: "char(50)" },
    { field: "createAt", type: "int" },
    { field: "creator", type: "int" },
    { field: "deptNameList", type: "text" },
    { field: "depts", type: "text" },
    { field: "email", type: "char(50)" },
    { field: "hiredDate", type: "int" },
    { field: "id", type: "char(50)" },
    { field: "imAccount", type: "char(50)" },
    { field: "isCertified", type: "int" },
    { field: "isHide", type: "int" },
    { field: "isHideMobile", type: "int" },
    { field: "isSubscribe", type: "int" },
    { field: "isVip", type: "int" },
    { field: "jobNumber", type: "char(50)" },
    { field: "leaveDate", type: "int" },
    { field: "mobile", type: "char(50)" },
    { field: "name", type: "char(50)" },
    { field: "nickName", type: "char(50)" },
    { field: "outerId", type: "char(50)" },
    { field: "remark", type: "char(50)" },
    { field: "status", type: "int" },
    { field: "tel", type: "char(50)" },
    { field: "type", type: "int" },
    { field: "form", type: "int" },
    { field: "updateAt", type: "int" },
    { field: "updator", type: "int" },
    { field: "workPlace", type: "char(50)" },
    { field: "visibleState", type: "int" },
  ],
};
const FIELDLIST = T.fields.map((item) => item.field).join(","); //所有字段逗号分割，如：accountId,avatar,canJoin,corpId,corpName,createAt
//主键字段数组
const KEYLIST = T.fields
  .filter((item) => item.primaryKey)
  .map((item) => item.field);
//非主键字段数组
const NOTKEYLIST = T.fields
  .filter((item) => !item.primaryKey)
  .map((item) => item.field);

const CREATE_TABLE = `create table if not exists ${T.name} (${T.fields
  .map((item) => {
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

const UPDATE = `update account set ${NOTKEYLIST.map((item) => `${item}=?`).join(
  ", "
)} where ${KEYLIST.map((item) => `${item}=?`).join(", ")}`;
const UPDATE_TEMPLATE = [NOTKEYLIST, KEYLIST].join(",");

const UPDATE_ALL = (obj) => {
  let excludeSql = "";
  if (obj.excludeList.length > 0) {
    excludeSql = `where accountId in (${obj.excludeList.join(",")})`;
  }
  return `update ${T.name} set ${NOTKEYLIST.filter((item) =>
    Object.keys(obj).includes(item)
  )
    .map((item) => `${item}=?`)
    .join(", ")} ${excludeSql}`;
};

const INSERT_OR_REPLACE = `insert or replace into ${
  T.name
} (${FIELDLIST}) values(${new Array(T.fields.length + 1)
  .join("?")
  .split("")
  .join(",")})`;
const INSERT_OR_REPLACE_TEMPLATE = FIELDLIST;

const QUERY = `select ${FIELDLIST} from ${T.name}`;
const QUERY_BY_KEY = `select ${FIELDLIST} from ${T.name} where ${KEYLIST.map(
  (item) => `${item}=?`
).join(" and ")}`;
const QUERY_BY_KEY_TEMPLATE = KEYLIST.join(",");
const QUERY_ACCOUNT_BY_ACCOUNTID = `select ${FIELDLIST} from ${T.name} where accountId=?`;
const QUERY_ACCOUNT_BY_ACCOUNTID_TEMPLATE = "accountId";

const QUERY_ACCOUNT_BY_ACCOUNTID_TYPE = `select ${FIELDLIST} from ${T.name} where accountId=? and type=?`;
const QUERY_ACCOUNT_BY_ACCOUNTID_TYPE_TEMPLATE = "accountId,type";

const QUERY_ACCOUNT_BY_CORPID = `select ${FIELDLIST} from ${T.name} where corpId=?`;
const QUERY_ACCOUNT_BY_CORPID_TEMPLATE = "corpId";

const DELETE = `delete from ${T.name}`;
const DELETE_BY_KEY = `delete from ${T.name} where ${KEYLIST.map(
  (item) => `${item}=?`
).join(" and ")}`;
const DELETE_BY_KEY_TEMPLATE = [KEYLIST].join(",");
const DELETE_ACCOUNT_BY_ACCOUNTID = `delete from ${T.name} where accountId=?`;
const DELETE_ACCOUNT_BY_ACCOUNTID_TEMPLATE = "accountId";

const CREATE_INDEX_TABLE_ON_KEYS = `create index if not exists ${
  T.name
}${KEYLIST.map((item) => `_${item}`).join("")} on ${T.name}(${KEYLIST.map(
  (item) => `${item}`
).join(",")});`;

const QUERY_FOR_SEARCH_ALL = `select  ${FIELDLIST} from ${
  T.name
} where ${FIELDLIST.split(",").join("||")} like '%'||?||'%' `;
const QUERY_FOR_SEARCH_ALL_TEMPLATE = "__search__";

export const ACCOUNT_SQL = {
  CREATE_TABLE_ACCOUNT: CREATE_TABLE, //创建表
  DROP_TABLE_ACCOUNT: DROP_TABLE, //删除表
  INSERT_OR_REPLACE_ACCOUNT: INSERT_OR_REPLACE, //插入或更新行
  UPDATE_ALL_ACCOUNT: UPDATE_ALL, // 更新行   --补充上一行中没有当前
  QUERY_ACCOUNT: QUERY, //全量查询
  QUERY_ACCOUNT_BY_KEY: QUERY_BY_KEY, //根据主键查询
  QUERY_ACCOUNT_BY_ACCOUNTID, //根据用户id查询
  QUERY_ACCOUNT_BY_CORPID, //根据公司corpId查询
  QUERY_ACCOUNT_BY_ACCOUNTID_TYPE, //根据用户id和type类型联合查询
  QUERY_ACCOUNT_FOR_SEARCH_ALL: QUERY_FOR_SEARCH_ALL, //全字段检索查询，速度较慢
  DELETE_ACCOUNT: DELETE, //清空数据
  DELETE_ACCOUNT_BY_ACCOUNTID, //根据账号删除数据
  DELETE_ACCOUNT_BY_KEY: DELETE_BY_KEY, //根据主键删除行
};

export const ACCOUNT_SQL_TEMPLATE = {
  account_no_key: FIELDLIST,
  [INSERT]: INSERT_TEMPLATE,
  [UPDATE]: UPDATE_TEMPLATE,
  [INSERT_OR_REPLACE]: INSERT_OR_REPLACE_TEMPLATE,
  [QUERY_BY_KEY]: QUERY_BY_KEY_TEMPLATE,
  [QUERY_ACCOUNT_BY_ACCOUNTID]: QUERY_ACCOUNT_BY_ACCOUNTID_TEMPLATE,
  [QUERY_ACCOUNT_BY_CORPID]: QUERY_ACCOUNT_BY_CORPID_TEMPLATE,
  [QUERY_ACCOUNT_BY_ACCOUNTID_TYPE]: QUERY_ACCOUNT_BY_ACCOUNTID_TYPE_TEMPLATE,
  [QUERY_FOR_SEARCH_ALL]: QUERY_FOR_SEARCH_ALL_TEMPLATE,
  [DELETE_ACCOUNT_BY_ACCOUNTID]: DELETE_ACCOUNT_BY_ACCOUNTID_TEMPLATE,
  [DELETE_BY_KEY]: DELETE_BY_KEY_TEMPLATE,
};
export const ACCOUNT = T;
