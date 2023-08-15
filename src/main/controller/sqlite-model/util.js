import {
  connectDB,
  clearDB,
  closeDB,
  executeReceive,
  executeQuery,
  executeURL
} from "./index";

let useSqlite = true; //改成false,作为sqlite的降级，当sqlite影响功能开发时可以先去掉本地缓存逻辑；
/**
 * 根据登录账号进行sqlite数据库连接，强烈建议同步调用
 */
const sqliteConnect = async ({ name, isUpgrade }) =>
  useSqlite && (await connectDB({ name, isUpgrade }));

/**
 * 清空sqlite中所有本地缓存数据，用于用户主动理清
 */
const sqliteClear = async () => useSqlite && (await clearDB());

/**
 * 关闭sqlite数据库,退出系统或者electron崩溃时调用
 */

const sqliteClose = async () => useSqlite && (await closeDB());

/**
 * 收到融云消息后，异步修改本地数据
 * 注意：1.消息是异步的，对于顺序敏感的操作会造成数据不一致；
 *  2.对有影响的操作做同步处理（会降低性能）或不做操作（体验稍差，下次登录后增量更新时再优化数据）或者保留原来出错概率很低的异步操作（但下次登录后恢复正确需要依赖后端）
 */
const sqliteReceive = async ({ key, msg }) =>
  useSqlite && (await executeReceive({ key, msg }));
/**
 * 业务查询用到的sqlite查询逻辑
 */
const sqliteQuery = async ({ key, input }) => {
  return useSqlite ? await executeQuery({ key, input }) : [];
};

/**
 * 接口回调执行，对sqlite中的数据进行增删改变更，对每个接口做单独处理
 */

const sqliteUrl = async ({ key, data, input }) => {
  return useSqlite ? await executeURL({ key, data, input }) : [];
};

export default {
  sqliteConnect,
  sqliteClear,
  sqliteClose,
  sqliteReceive,
  sqliteQuery,
  sqliteUrl
};
