import sqliteDB from "../../modules/sqlite";
import {
  SQL,
  TEMPLATE,
  TABLENAME,
  ALLTABLENAMELIST
} from "../../modules/sqlite/sql";
let db = sqliteDB.getInstance();

// 建立数据库连接并创建表
export const connectDB = async ({ name, isUpgrade = true }) => {
  try {
    let result;
    await db.connect(name);

    const updateTime = 1660741924000;
    let isUpgradeSuccess = isUpgrade && (await _beforeUpgrade(updateTime));
    result = await _createDB(); //创建是默认创建所有表，因为创建的表如果存在其实不做任何处理
    await _createDB(true); //文件也要创建库
    await backupDB(false);
    isUpgrade && (await _afterUpgrade(isUpgradeSuccess, updateTime));

    return result;
  } catch (err) {
    console.error(err);
  }
};

// 创建表
const _createDB = async inFile => {
  try {
    const result = await Promise.all([
      db.run(SQL.CREATE_TABLE_UPDATETIME, inFile),
      db.run(SQL.CREATE_TABLE_ACCOUNT, inFile),
      db.run(SQL.CREATE_TABLE_GROUP, inFile),
      db.run(SQL.CREATE_TABLE_GROUP_GROUPMEMBERS, inFile),
      db.run(SQL.CREATE_TABLE_GROUP_GROUPROBOTS, inFile),
      db.run(SQL.CREATE_TABLE_STORAGE, inFile),
      db.run(SQL.CREATE_TABLE_STORAGE_RELLIST, inFile),
      db.run(SQL.CREATE_TABLE_GROUP_ATTRIBUTE, inFile),
      db.run(SQL.CREATE_TABLE_MESSAGE, inFile),
      db.run(SQL.CREATE_TABLE_LOCAL_SEARCH_HISTORY, inFile),
      // 新建机器人数据表
      db.run(SQL.CREATE_TABLE_ROBOT, inFile)
    ]);
    console.log(`create table in ${inFile ? "file" : "memeory"} success.`);
    return result;
  } catch (err) {
    console.error(err);
  }
};

const _beforeUpgrade = async datetime => {
  console.log("start upgrade, the time is", datetime);
  let updateTime;
  let isUpgrade = false;
  let inFile = true;
  await db.run(SQL.CREATE_TABLE_UPDATETIME, inFile); //防止表没有创建
  let list = await db.prepareForQuery(
    SQL.QUERY_UPDATETIME_BY_KEY,
    [["upgrade"]],
    inFile
  );
  if (list && list.length > 0) {
    updateTime = list[0]["updateTime"];
  }
  if (updateTime == null || updateTime < datetime) {
    await _upgrade();
    isUpgrade = true;
  }
  return isUpgrade;
};
const _upgrade = async () => {
  // 每次升级，自行修改要更改的表内容，仅执行一次，注意兼容即可
  console.log("upgrading, please wait for a minute");
  let inFile = true;
  // 收纳组增量存在问题，需要把收纳组清空一下
  // await _deleteDB(TABLENAME.ACCOUNT_NAME, inFile);
  await _dropDB(ALLTABLENAMELIST, inFile);
  // await _deleteDB(ALLTABLENAMELIST, inFile);
};
const _afterUpgrade = async (isSuccess, updateTime) => {
  if (isSuccess) {
    console.log("upgrade success, the new time is", updateTime);
    let inFile = true;
    await db.prepareForExecute(
      SQL.INSERT_OR_REPLACE_UPDATETIME,
      [["upgrade", updateTime]],
      inFile
    );
  }
};

// 删除表中数据
const _deleteDB = async (tableList, inFile) => {
  try {
    let promiseList = [];
    tableList.forEach(item => {
      if (ALLTABLENAMELIST.includes(item)) {
        switch (item) {
          case TABLENAME.ACCOUNT_NAME:
            promiseList.push(SQL.DELETE_ACCOUNT);
            break;
          case TABLENAME.GROUP_NAME:
            promiseList.push(SQL.DELETE_GROUP);
            break;
          case TABLENAME.GROUP_GROUPMEMBERS_NAME:
            promiseList.push(SQL.DELETE_GROUP_GROUPMEMBERS);
            break;
          case TABLENAME.GROUP_GROUPROBOTS_NAME:
            promiseList.push(SQL.DELETE_GROUP_GROUPROBOTS);
            break;
          case TABLENAME.STORAGE_NAME:
            promiseList.push(SQL.DELETE_STORAGE);
            break;
          case TABLENAME.STORAGE_RELLIST_NAME:
            promiseList.push(SQL.DELETE_STORAGE_RELLIST);
            break;
          case TABLENAME.GROUP_ATTRIBUTE_NAME:
            promiseList.push(SQL.DELETE_GROUP_ATTRIBUTE);
            break;
          case TABLENAME.MESSAGE_NAME:
            promiseList.push(SQL.DELETE_MESSAGE);
            break;
          case TABLENAME.ROBOT_NAME:
            promiseList.push(SQL.DELETE_ALL_ROBOT);
            break;
          case TABLENAME.UPDATETIME_NAME:
            // 更新时间表不能随意删
            promiseList.push(SQL.DELETE_UPDATETIME);
            break;
          case TABLENAME.LOCAL_SEARCH_HISTORY_NAME:
            // promiseList.push(SQL.DELETE_LOCAL_SEARCH_HISTORY);
            break;
          default:
            console.log(`${item} is not defined in _deleteDB.`);
            break;
        }
      } else {
        console.log(`${item} is unknown in _deleteDB`);
      }
    });

    if (tableList.includes(TABLENAME.ACCOUNT_NAME)) {
      await db.prepareForExecute(
        SQL.DELETE_UPDATETIME_BY_KEY,
        [["account"]],
        inFile
      );
    }
    if (
      tableList.includes(TABLENAME.GROUP_NAME) ||
      tableList.includes(TABLENAME.GROUP_GROUPMEMBERS_NAME) ||
      tableList.includes(TABLENAME.GROUP_GROUPROBOTS_NAME)
    ) {
      await db.prepareForExecute(
        SQL.DELETE_UPDATETIME_BY_KEY,
        [["group"]],
        inFile
      );
    }
    if (
      tableList.includes(TABLENAME.STORAGE_NAME) ||
      tableList.includes(TABLENAME.STORAGE_RELLIST_NAME) ||
      tableList.includes(TABLENAME.GROUP_ATTRIBUTE_NAME)
    ) {
      await db.prepareForExecute(
        SQL.DELETE_UPDATETIME_BY_KEY,
        [["storage"]],
        inFile
      );
    }
    const result = await Promise.all(
      promiseList.map(item => {
        return db.run(item, inFile);
      })
    );
    console.log("delete table successs.");
    return result;
  } catch (err) {
    console.error(err);
  }
};
// 删除表
const _dropDB = async (tableList, inFile) => {
  try {
    let promiseList = [];
    tableList.forEach(item => {
      if (ALLTABLENAMELIST.includes(item)) {
        switch (item) {
          case TABLENAME.ACCOUNT_NAME:
            promiseList.push(SQL.DROP_TABLE_ACCOUNT);
            break;
          case TABLENAME.GROUP_NAME:
            promiseList.push(SQL.DROP_TABLE_GROUP);
            break;
          case TABLENAME.GROUP_GROUPMEMBERS_NAME:
            promiseList.push(SQL.DROP_TABLE_GROUP_GROUPMEMBERS);
            break;
          case TABLENAME.GROUP_GROUPROBOTS_NAME:
            promiseList.push(SQL.DROP_TABLE_GROUP_GROUPROBOTS);
            break;
          case TABLENAME.STORAGE_NAME:
            promiseList.push(SQL.DROP_TABLE_STORAGE);
            break;
          case TABLENAME.STORAGE_RELLIST_NAME:
            promiseList.push(SQL.DROP_TABLE_STORAGE_RELLIST);
            break;
          case TABLENAME.GROUP_ATTRIBUTE_NAME:
            promiseList.push(SQL.DROP_TABLE_GROUP_ATTRIBUTE);
            break;
          case TABLENAME.MESSAGE_NAME:
            promiseList.push(SQL.DROP_TABLE_MESSAGE);
            break;
          case TABLENAME.ROBOT_NAME:
            promiseList.push(SQL.DROP_TABLE_ROBOT);
            break;
          case TABLENAME.UPDATETIME_NAME:
            // 记录时间的表不应该被随意删除
            // promiseList.push(SQL.DROP_TABLE_UPDATETIME)
            break;
          case TABLENAME.LOCAL_SEARCH_HISTORY_NAME:
            // promiseList.push(SQL.DROP_TABLE_LOCAL_SEARCH_HISTORY);
            break;
          default:
            console.log(`${item} is not defined in _dropDB.`);
            break;
        }
      } else {
        console.log(`${item} is unknown in _dropDB `);
      }
    });
    if (tableList.includes(TABLENAME.ACCOUNT_NAME)) {
      await db.prepareForExecute(
        SQL.DELETE_UPDATETIME_BY_KEY,
        [["account"]],
        inFile
      );
    }
    if (
      tableList.includes(TABLENAME.GROUP_NAME) ||
      tableList.includes(TABLENAME.GROUP_GROUPMEMBERS_NAME) ||
      tableList.includes(TABLENAME.GROUP_GROUPROBOTS_NAME)
    ) {
      await db.prepareForExecute(
        SQL.DELETE_UPDATETIME_BY_KEY,
        [["group"]],
        inFile
      );
    }
    if (
      tableList.includes(TABLENAME.STORAGE_NAME) ||
      tableList.includes(TABLENAME.STORAGE_RELLIST_NAME) ||
      tableList.includes(TABLENAME.GROUP_ATTRIBUTE_NAME)
    ) {
      await db.prepareForExecute(
        SQL.DELETE_UPDATETIME_BY_KEY,
        [["storage"]],
        inFile
      );
    }
    const result = await Promise.all(
      promiseList.map(item => {
        return db.run(item, inFile);
      })
    );
    console.log("drop table successs.");
    return result;
  } catch (err) {
    console.error(err);
  }
};
// 清空数据
export const clearDB = async () => {
  try {
    // 暂时不清理任何数据
    return await _deleteDB([]);
  } catch (err) {
    console.error(err);
  }
};
// 关闭数据库
export const closeDB = async () => {
  try {
    console.log("before close sqlite database ", db);
    // await backupDB({});//关闭时暂时不备份；
    await db.close();
    console.log("sqlite database closed.");
  } catch (err) {
    console.error(err);
  }
};
export const backupDB = async (fromMemoryToFile = true) => {
  try {
    let tag = `backupDB_${fromMemoryToFile}_${new Date().getTime()}_${Math.random()}`;
    console.time(tag);
    let updateTimeList =
      (await executeDB({
        sql: SQL.QUERY_UPDATETIME,
        inFile: !fromMemoryToFile
      })) || [];

    if (updateTimeList.length > 0) {
      await Promise.all([
        _backupTable(
          SQL.QUERY_ACCOUNT,
          SQL.INSERT_OR_REPLACE_ACCOUNT,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_GROUP,
          SQL.INSERT_OR_REPLACE_GROUP,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_GROUP_GROUPMEMBERS,
          SQL.INSERT_OR_REPLACE_GROUP_GROUPMEMBERS,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_GROUP_GROUPROBOTS,
          SQL.INSERT_OR_REPLACE_GROUP_GROUPROBOTS,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_STORAGE,
          SQL.INSERT_OR_REPLACE_STORAGE,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_STORAGE_RELLIST,
          SQL.INSERT_OR_REPLACE_STORAGE_RELLIST,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_GROUP_ATTRIBUTE,
          SQL.INSERT_OR_REPLACE_GROUP_ATTRIBUTE,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_LOCAL_SEARCH_HISTORY,
          SQL.INSERT_OR_REPLACE_LOCAL_SEARCH_HISTORY,
          fromMemoryToFile
        ),
        _backupTable(
          SQL.QUERY_ALL_ROBOT,
          SQL.INSERT_OR_REPLACE_ROBOT,
          fromMemoryToFile
        )
      ]);
      await _backupTable(
        SQL.QUERY_UPDATETIME,
        SQL.INSERT_OR_REPLACE_UPDATETIME,
        fromMemoryToFile
      );
    }
    console.timeEnd(tag);
    console.log("sqlite database backup success.");
  } catch (err) {
    console.error(err);
  }
};
const _backupTable = async (sqlQuery, sqlInsert, fromMemoryToFile) => {
  let data =
    (await executeDB({ sql: sqlQuery, inFile: !fromMemoryToFile })) || [];
  if (data && data.length && data.length > 0) {
    await executeDB({
      sql: sqlInsert,
      data,
      inFile: fromMemoryToFile
    });
    if (fromMemoryToFile) {
      console.log("已保存到", db.getPath());
    }
  }
};
// 对可能sql注入的语句增加校验
const _isSQLSafe = (sql, data) => {
  /**
   * TODO 增加防SQL注入的逻辑
   */
  return true;
};
// 把json数组转化为二维数组
const _convert_type = data => {
  // 目的：将接口中的层次数据转换成字符串存到数据库中
  // 注意：1.更规范的做法是建立新表，查询时关联查询后再组装
  //      2.考虑到部分字段并不是外键且不需要对其进行增删改维护，再加上工期较短，因此这样折中处理。
  //      3.后期优化时，只需要建立新表，查询时组合处理好即可。
  try {
    let result;
    if (typeof data == "object" && data) {
      result = JSON.stringify(data);
    } else {
      result = data;
    }
    return result;
  } catch (err) {
    console.error(err);
    return data;
  }
};
const _convertDataToTemplate = (sql, data, selective = false) => {
  // 将json数组转化为sqlite带模式的语句的结构，二维数组。
  try {
    let filedList;
    const list = data.map(json => {
      if (!TEMPLATE[sql] || selective) {
        filedList = TEMPLATE.account_no_key
          .split(",")
          .filter(item => Object.keys(json).includes(item))
          .map(item => item.trim());
      } else {
        filedList = (TEMPLATE[sql] || "").split(",").map(item => item.trim());
      }
      return filedList.map(field => _convert_type(json[field]));
    });
    return list;
  } catch (err) {
    console.error(err);
    return [];
  }
};

// 查询SQL
const dbQuery = async ({ sql, mode = false, data = [], inFile = false }) => {
  try {
    let result;
    if (mode) {
      if (_isSQLSafe(sql, data)) {
        let modeData = [];
        if (data.type && data.type === "globalContact") {
          let sqlNameCondition = "";
          let sqlMobileCondition = "";
          let sqlCondition = "";
          if (data.name && Array.isArray(data.name)) {
            sqlNameCondition = data.name.reduce((total, current) => {
              return `${
                !total ? total : total + " and"
              } name like '%${current}%'`;
            }, sqlNameCondition);
            sqlNameCondition = `((${sqlNameCondition}) or (${sqlNameCondition.replace(
              /name/g,
              "nickName"
            )}))`;
          }
          sqlMobileCondition = `${
            data.mobile ? "" : "mobile is null or"
          } mobile like '%${data.mobile}%'`;
          sqlCondition = `select *,(case when (${sqlNameCondition} and (visibleState !=-1 or visibleState is null)) then 1 end) as _isName, (case when (${sqlMobileCondition} ) then 1 end) as _isMobile from t_account where _isName is not null and _isMobile is not null order by type;`;
          result = await db.all(sqlCondition, inFile);
        } else if (data.type && data.type === "globalGroup") {
          if (data.mobile) {
            // 群组数字和文字都按照名称搜索
            data.name.push(data.mobile);
          }
          let sqlNameCondition = "";
          let sqlGroupNameCondition = "";
          let sqlCondition = "";
          if (data.name && Array.isArray(data.name)) {
            sqlNameCondition = data.name.reduce((total, current) => {
              return `${
                !total ? total : total + " and"
              } name like '%${current}%'`;
            }, sqlNameCondition);
          }
          sqlGroupNameCondition = sqlNameCondition.replace(
            /name/g,
            "t_group.name"
          );
          sqlCondition = `select t_group.*,t._groupMemberIds,t._groupMemberNames,(case when (${sqlGroupNameCondition}) then 1 end) as _isName,(case when (t._groupMemberNames is not null) then 1 end) as _isGroupMemberNames from t_group left outer join (select id,group_concat(accountId) as _groupMemberIds,group_concat(name,'、') as _groupMemberNames from (select t_group.id,t_account_uniq.accountId,t_account_uniq.name from (select accountId,name,corpId from (select accountId,name,corpId from t_account where (${sqlNameCondition}) order by type asc) group by accountId) as t_account_uniq,t_group_groupmembers,t_group where (t_group.id=t_group_groupmembers.id and t_account_uniq.accountId=t_group_groupmembers.accountId)union select t_group.id,t_account_uniq.accountId,t_account_uniq.name from (select accountId,name,corpId from (select accountId,name,corpId from t_account where (${sqlNameCondition}) order by type asc) group by accountId) as t_account_uniq,t_group where (t_account_uniq.accountId=t_group.owner)) group by id ) as t on t_group.id=t.id where _isName is not null or _isGroupMemberNames is not null;`;
          result = await db.all(sqlCondition, inFile);
        } else if (data.type && data.type === "globalRobot") {
          if (data.mobile) {
            // 群组数字和文字都按照名称搜索
            data.name.push(data.mobile);
          }
          let sqlNameCondition = "";
          let sqlCondition = "";
          if (data.name && Array.isArray(data.name)) {
            sqlNameCondition = data.name.reduce((total, current) => {
              return `${
                !total ? total : total + " and"
              } name like '%${current}%'`;
            }, sqlNameCondition);
          }
          sqlCondition = `select *,(case when (${sqlNameCondition} and (isDel !=1)) then 1 end) as _isName from t_robot where _isName is not null  order by type;`;
          result = await db.all(sqlCondition, inFile);
        } else {
          modeData = _convertDataToTemplate(sql, data);
          if (data.length > 0) {
            result = await db.prepareForQuery(sql, modeData, inFile);
          }
        }
      } else {
        console.error("查询SQL语句中可能存在sql注入等安全性问题，执行已取消。");
      }
    } else {
      result = await db.all(sql, inFile);
    }

    return result;
  } catch (error) {
    console.error(sql, data, error);
  }
};
// 执行SQL
const dbRun = async ({
  sql,
  mode = false,
  data = [],
  inFile = false,
  selective = false
}) => {
  try {
    let result;
    if (mode) {
      if (_isSQLSafe(sql, data)) {
        const modeData = _convertDataToTemplate(sql, data, selective);
        if (data.length > 0) {
          result = await db.prepareForExecute(sql, modeData, inFile);
        }
      } else {
        console.error("执行SQL语句中可能存在sql注入等安全性问题，执行已取消");
      }
    } else {
      result = await db.run(sql, inFile);
    }
    return result;
  } catch (error) {
    console.error(error);
  }
};
// 执行数据库
export const executeDB = async ({
  sql,
  data = [],
  hasReturn = null, //true表示查询语句，false表示操作语句，null表示根据sql语句是否有select判断
  isOpenExecuteTime = false, //为true表示SQL语句的所用时间；false表示不打印；
  inFile = false,
  selective = false // liby 2023-01-30添加，表示update的时候json是否需要按照template转化进行全字段操作
}) => {
  if (sql == SQL.EMPTY_SQL) {
    // 用于写基本逻辑，但暂时并不上线情况
    return null;
  }
  if (!sql) {
    // 用于开发过程，出现未定义SQL或写错SQL的名称问题
    console.error(sql, data, hasReturn);
    return null;
  }
  const len = 60;
  const tag = isOpenExecuteTime
    ? `${
        sql.length > len ? sql.slice(0, len) : sql
      }_${new Date().getTime()}_${Math.random()}_${new Array(
        7 - (data.length + "").length
      ).join("0")}${data.length}`
    : "";
  isOpenExecuteTime && console.time(tag);
  //如果语句中有问号则认为是带模式的查询;
  let mode = sql.indexOf("?") != -1;
  // 如果不传参数，默认有select则时查询语句，否则是执行语句；这个不太准，但大多数情况可以满足；遇到特殊情况调用时传递hasReturn参数
  let isQuery =
    (hasReturn == null && sql.toLowerCase().indexOf("select") != -1) ||
    hasReturn;
  let result;
  if (isQuery) {
    result = await dbQuery({ sql, mode, data, inFile });
  } else {
    result = await dbRun({ sql, mode, data, inFile, selective });
  }
  isOpenExecuteTime && console.timeEnd(tag);
  return result;
};
