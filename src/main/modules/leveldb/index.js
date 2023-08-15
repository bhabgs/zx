"use strict";
const path = require("path");
const levelup = require("levelup");
const leveldown = require("leveldown");

import { getSavePath, createSavePath } from "../database/db-util";

let db = null; // 数据库实例

export default class levelDB {
  /**
   *
   * @param {String} name
   */
  static create(name = "base") {
    const savePath = getSavePath();
    createSavePath();
    let db = levelup(leveldown(path.join(savePath, name)));
    return db;
  }
}
