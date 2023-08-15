/* "use strict";

const path = require("path");
const Sequelize = require("sequelize");
import { getSavePath, createSavePath } from "../database/db-util";

const platform = process.platform;

const dialectModulePath = path.join(__dirname, platform, "sqlite3");

const sqlite = require("./win32/sqlite3");
console.log("sqlite: ", sqlite);

const savePath = getSavePath("data");
createSavePath("data");

const DefaultSqlName = "sqlite";
console.log("dialectModulePath: ", dialectModulePath);

const _export = {};

class Database extends Sequelize {}

for (const key in Database) {
  _export[key] = Database[key];
}

const create = name => {
  let storageName = `${name || DefaultSqlName}.sqlite`;
  let storagePath = path.join(savePath, storageName);

  let db = new Sequelize({
    dialect: "sqlite",
    dialectModulePath,
    storage: storagePath
  });

  return db;
};

const connect = name => {
  return new Promise((resolve, reject) => {
    let db = Database.create(name);
    db.authenticate()
      .then(() => {
        console.log("Connection has been established successfully");
        resolve(db);
      })
      .catch(e => {
        console.error("Unable to connect to the database: ", e);
        reject(e);
      });
  });
};

_export.create = create;
_export.connect = connect;
export default _export;
 */