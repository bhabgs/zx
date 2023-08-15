"use strict";
const path = require("path");
var sqlite3 = require("sqlite3").verbose();
import utils from "../../../modules/utils";

/**
 * 设置是否自动压缩卷；
 * NONE is 0, means disabled auto vaccum;
 * INCREMENTAL is 1, means enable incremental vacuum;
 * FULL is 2, means enable full auto vaccum;
 */
const GLOBAL_AUTO_VACUUM = "PRAGMA auto_vacuum = FULL;";
const GLOBAL_BUSY_TIMEOUT = "PRAGMA busy_timeout = 6000";
const BEGIN = "BEGIN TRANSACTION;";
const COMMIT = "COMMIT TRANSACTION;";
export default class sqliteDB {
  /**
   * 异步的SQL消息队列还是同步的查询请求
   * 要不要新建索引
   * @param {String} name
   */
  constructor() {
    this.instance;
    this.db = null; //用于连内存
    this.fileDb = null; //用于连本地文件
    this.name = "defaultUser";
  }
  getPath() {
    // return ":memory:";// 放到内存速度执行速度是毫秒级的，几乎没有卡顿
    const folder = "sqlite3"; //增加一级目录，如果多账号其下面会有多个文件
    const savePath = path.join(utils.appDataDir, folder);
    if (!utils.dirExists(savePath)) {
      utils.makeDir(savePath);
    }
    const dbFileName = path.join(
      savePath,
      "user_" + Buffer.from(this.name, "utf-8").toString("base64") + ".sqlite"
    );
    return dbFileName;
  }
  connect(name) {
    name && (this.name = name);
    return new Promise((resolve, reject) => {
      const dbFileName = this.getPath();
      console.log(dbFileName);
      let num = 0;
      this.db = new sqlite3.Database(":memory:", (err) => {
        if (err) {
          reject(err);
        } else {
          num = num + 1;
          if (num == 2) {
            resolve(err);
          }
        }
      });
      this.fileDb = new sqlite3.Database(dbFileName, (err) => {
        if (err) {
          reject(err);
        } else {
          num = num + 1;
          if (num == 2) {
            resolve(err);
          }
        }
      });
    });
  }
  /**
   * 以下只包含常用接口，对于事务型或者超大插入的SQL自行单独处理
   * @param {*} sql
   * @param {*} callback
   */
  // 创建表、删除表，增加、修改、删除（不带模式）时使用
  run(sql, inFile = false) {
    return new Promise((resolve, reject) => {
      let obj = inFile ? this.fileDb : this.db;
      if (obj && obj.run) {
        obj.run(sql, (err) => {
          if (err === null) {
            resolve(err);
          } else {
            reject(err);
          }
        });
      }
    });
  }
  // 批量查询，全量查询后处理时使用
  all(sql, inFile = false) {
    return new Promise((resolve, reject) => {
      let obj = inFile ? this.fileDb : this.db;
      if (obj && obj.all) {
        obj.all(sql, (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        });
      }
    });
  }
  // 带模式的批量插入、更新、删除时使用
  prepareForExecute(sql, data, inFile = false) {
    return new Promise((resolve, reject) => {
      let obj = inFile ? this.fileDb : this.db;
      obj.serialize(function () {
        if (obj && obj.prepare) {
          obj.run(BEGIN);
          var stmt = obj.prepare(sql);
          let errs = [];
          let lastError = null;
          for (var i = 0; i < data.length; i++) {
            stmt.run(data[i], function (err) {
              if (err) {
                lastError = err;
              }
              errs.push(err);
            });
          }
          obj.run(COMMIT);
          stmt.finalize(() => {
            if (lastError) {
              reject(lastError, errs);
            } else {
              resolve(lastError);
            }
          });
        }
      });
    });
  }
  // 带模式的批量查询时使用
  prepareForQuery(sql, data, inFile = false) {
    return new Promise((resolve, reject) => {
      let obj = inFile ? this.fileDb : this.db;
      obj.serialize(function () {
        if (obj && obj.prepare) {
          obj.run(BEGIN);
          var stmt = obj.prepare(sql);
          let errs = [];
          let collected = [];
          let lastError;
          for (var i = 0; i < data.length; i++) {
            stmt.all(data[i], function (err, rows) {
              if (err) lastError = err;
              errs.push(err);
              if (rows) {
                collected = collected.concat(rows);
              }
            });
          }
          obj.run(COMMIT);
          stmt.finalize(() => {
            if (lastError) {
              reject(lastError, errs);
            } else {
              resolve(collected);
            }
          });
        }
      });
    });
  }
  close() {
    return new Promise((resolve, reject) => {
      let num = 0;
      this.db.close((err, data) => {
        if (err) {
          reject(err);
        } else {
          num = num + 1;
          if (num == 2) {
            resolve(data);
          }
        }
      });
      this.fileDb.close((err, data) => {
        if (err) {
          reject(err);
        } else {
          num = num + 1;
          if (num == 2) {
            resolve(data);
          }
        }
      });
    });
  }
  backup(fromFileToMemory = false) {
    return null;
  }
  // 单例
  static getInstance() {
    this.instance = this.instance || new sqliteDB();
    return this.instance;
  }
}
