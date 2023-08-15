const { ipcMain } = require("electron");
import {
  connectDB,
  clearDB,
  closeDB,
  backupDB,
  executeReceive,
  executeQuery,
  executeURL,
  executeDB,
} from "./index";

let useSqlite = true; //改成false,作为sqlite的降级，当sqlite影响功能开发时可以先去掉本地缓存逻辑；
/**
 * 根据登录账号进行sqlite数据库连接，强烈建议同步调用
 */
ipcMain.handle("sqlite-connect", async (event, { name, isUpgrade }) => {
  try {
    return useSqlite && (await connectDB({ name, isUpgrade }));
  } catch (err) {
    console.error(err);
  }
});
/**
 * 清空sqlite中所有本地缓存数据，用于用户主动理清
 */
ipcMain.handle("sqlite-clear", async (event) => {
  try {
    return useSqlite && (await clearDB());
  } catch (err) {
    console.error(err);
  }
});

/**
 * 关闭sqlite数据库,退出系统或者electron崩溃时调用
 */
ipcMain.handle("sqlite-close", async (event) => {
  try {
    return useSqlite && (await closeDB());
  } catch (err) {
    console.error(err);
  }
});

ipcMain.handle("sqlite-execute", async (event, obj) => {
  try {
    return useSqlite && (await executeDB(obj));
  } catch (err) {
    console.error(err);
  }
});
/**
 * 数据库定期备份，从内存备份到磁盘文件
 */
ipcMain.handle("sqlite-backup", async (event) => {
  try {
    console.log("start backup at ", new Date());
    return useSqlite && (await backupDB());
  } catch (err) {
    console.error(err);
  }
});

/**
 * 收到融云消息后，异步修改本地数据
 * 注意：1.消息是异步的，对于顺序敏感的操作会造成数据不一致；
 *  2.对有影响的操作做同步处理（会降低性能）或不做操作（体验稍差，下次登录后增量更新时再优化数据）或者保留原来出错概率很低的异步操作（但下次登录后恢复正确需要依赖后端）
 */
ipcMain.handle("sqlite-receive", async (event, { key, msg }) => {
  try {
    return useSqlite && (await executeReceive({ key, msg }));
  } catch (err) {
    console.error(err);
  }
});

/**
 * 业务查询用到的sqlite查询逻辑
 */
ipcMain.handle("sqlite-query", async (event, { key, input }) => {
  try {
    return useSqlite ? await executeQuery({ key, input }) : [];
  } catch (err) {
    console.error(err);
  }
});

/**
 * 接口回调执行，对sqlite中的数据进行增删改变更，对每个接口做单独处理
 */
ipcMain.handle("sqlite-url", async (event, { key, data, input }) => {
  try {
    return useSqlite ? await executeURL({ key, data, input }) : [];
  } catch (err) {
    console.error(err);
  }
});
