const { BrowserWindow, ipcMain, remote } = require("electron");

import Logger from "../../../modules/logger";

import levelDB from "../../modules/leveldb";

import { dbname } from "../../config";
import { dbkey } from "../../../config";
const util = require("util");

const { base, contact, group, fileCache, fileDown } = dbname;

let basedb, contactdb, fileCacheDB, fileDownDB;

const initDB = () => {
  basedb = new levelDB.create(base);
  contactdb = new levelDB.create(contact);
  fileCacheDB = new levelDB.create(fileCache);
  fileDownDB = new levelDB.create(fileDown);

  [basedb, contactdb, fileCacheDB, fileDownDB].forEach(bindError);
};

const bindError = db => {
  db.on("error", err => {
    console.error(err);
    Logger.error({ type: "Level DB Error", message: util.inspect(err) });
  });
};

initDB();

export const dbSaveData = async ({ db, data }) => {
  let operate = null,
    result = { code: 0, data: null, msg: "" };
  switch (db) {
    case "base":
      operate = basedb;
      break;
    case "contact":
      operate = contactdb;
      break;
    case "fileCache":
      operate = fileCacheDB;
      break;
    case "fileDown":
      operate = fileDownDB;
      break;
    default:
      result.msg = "not found db";
      break;
  }
  if (operate) {
    result.code = 1;
    try {
      if (Array.isArray(data)) {
        const temp_data = data.map(item => ({
          type: "put",
          key: item.key,
          value: JSON.stringify(item.value)
        }));
        result.data = await operate.batch(temp_data);
      } else {
        result.data = await operate.put(data.key, JSON.stringify(data.value));
      }
    } catch (error) {
      result.code = 0;
      result.msg = error && error.message;
    }
  }
  return result;
};

export const dbClearData = async ({ db }) => {
  let operate = null,
    result = { code: 0, data: null, msg: "" };
  switch (db) {
    case "base":
      operate = basedb;
      break;
    case "contact":
      operate = contactdb;
      break;
    case "fileCache":
      operate = fileCacheDB;
      break;
    case "fileDown":
      operate = fileDownDB;
      break;
    default:
      result.msg = "not found db";
      break;
  }
  if (operate) {
    result.code = 1;
    try {
      result.data = await operate.clear();
    } catch (error) {
      result.code = 0;
      result.msg = error && error.message;
    }
  }
  return result;
};

export const dbClearDataAll = async () => {
  let result = { code: 0, data: null, msg: "" };
  try {
    result.code = 1;
    result.data = await Promise.all([
      basedb.clear(),
      contactdb.clear(),
      fileCacheDB.clear(),
      fileDownDB.clear()
    ]);
  } catch (error) {
    result.code = 0;
    result.msg = error && error.message;
  }
};

export const dbGetData = async ({ db, key }) => {
  let result = { code: 0 };
  let data = null;
  try {
    switch (db) {
      case "base":
        data = await basedb.get(key, { asBuffer: false });
        break;

      case "contact":
        data = await contactdb.get(key, { asBuffer: false });
        break;
      case "fileCache":
        data = await fileCacheDB.get(key, { asBuffer: false });
        break;
      case "fileDown":
        data = await fileDownDB.get(key, { asBuffer: false });
        break;
      default:
        result.msg = "not found db";
        break;
    }
    data !== null && (result.code = 1);
    data = JSON.parse(data);
  } catch (error) {
    result.msg = error.message;
    result.type = error.type;
    result.name = error.name;
  }
  result.data = data;
  return result;
};

export const dbGetAllData = async ({
  db,
  keys = [],
  corpids = [],
  accountIds = []
}) => {
  return new Promise((resolve, reject) => {
    let result = {
      data: null
    };
    switch (db) {
      case "base":
        result.data = {};
        basedb
          .createReadStream()
          .on("data", data => {
            let key = data.key.toString();
            if (keys.includes(key)) {
              let value = JSON.parse(data.value.toString());
              result.data[key] = value;
            }
          })
          .on("error", err => {
            reject(err);
          })
          .on("close", () => {})
          .on("end", () => {
            resolve(result);
          });
        break;

      case "contact-corp":
        result.data = [];
        contactdb
          .createReadStream()
          .on("data", data => {
            let key = data.key.toString();
            key = key.split("#");
            if (corpids.length) {
              if (corpids.includes(key[1])) {
                try {
                  let value = JSON.parse(data.value.toString());
                  result.data.push(value);
                } catch (error) {}
              }
            } else if (accountIds.length) {
              if (accountIds.includes(key[0])) {
                try {
                  let value = JSON.parse(data.value.toString());
                  result.data.push(value);
                } catch (error) {}
              }
            }
          })
          .on("error", err => {
            reject(err);
          })
          .on("close", () => {})
          .on("end", () => {
            resolve(result);
          });
        break;

      default:
        reject(new Error({ msg: "not found db" }));
        break;
    }
  });
};

export const dbDelData = async ({ db, key = [] }) => {
  let operate = null,
    result = { code: 0, data: null, msg: "" };
  switch (db) {
    case "base":
      operate = basedb;
      break;
    case "contact":
      operate = contactdb;
      break;
    case "fileCache":
      operate = fileCacheDB;
      break;
    case "fileDown":
      operate = fileDownDB;
      break;
    default:
      result.msg = "not found db";
      break;
  }
  if (operate) {
    result.code = 1;
    try {
      if (Array.isArray(key)) {
        const temp_data = key.map(item => ({
          type: "del",
          key: item
        }));
        result.data = await operate.batch(temp_data);
      } else {
        result.data = await operate.del(key);
      }
    } catch (error) {
      result.code = 0;
      result.msg = error && error.message;
    }
  }
  return result;
};

/**
 * 清除某个数据库
 * type
 */
ipcMain.handle("db-clear-data", async (event, { db }) => dbClearData({ db }));
/**
 * 清除所有数据库
 * type
 */
ipcMain.handle("db-clear-data-all", async (event, {}) => dbClearDataAll());

/**
 * 保存
 * type
 */
ipcMain.handle("db-save-data", async (event, { db, data }) =>
  dbSaveData({ db, data })
);

/**
 * 获取单条数据
 */
ipcMain.handle("db-get-data", async (event, { db, key = "" }) =>
  dbGetData({ db, key })
);

/**
 * 获取多数据
 */
ipcMain.handle(
  "db-getAll-data",
  async (event, { db, keys = [], corpids = [], accountIds = [] }) =>
    dbGetAllData({ db, keys, corpids, accountIds })
);

/**
 * 删除
 */
ipcMain.handle("db-del-data", async (event, { db, key }) =>
  dbDelData({ db, key })
);
