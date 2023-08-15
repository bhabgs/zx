const fs = require("fs");
const path = require('path')
import utils from "../utils";
export default class FileRw{
  constructor(folderPath="statistics",fileName="statistics"){
    this.fileName = fileName
    this.folderPath = path.join(utils.appDataDir,'logs', folderPath);
    this.filePath = path.join(this.folderPath, this.fileName);
    this.createFolder(this.folderPath)
  }
  /**
   * @description 创建文件夹
   */
  createFolder(folderPath){
    try {
      if (!utils.dirExists(folderPath)) {
        utils.makeDir(folderPath);
      }
    } catch (error) {}
  }
  /**
   * @description 读文件
   */
  read(){
    let isFileExists = utils.fileExists(this.filePath);
    return new Promise ((resolve, reject) =>{
      if(isFileExists){
        fs.readFile(this.filePath, 'utf-8', (err, data) => {
          if (err) return reject(err)
          resolve(data)
        })
      }else {
        reject();
      }
    })
  }
  /**
   * @description 写文件
   */
  write(content){
    let isFileExists = utils.fileExists(this.filePath);
    let saveFunc = isFileExists ? fs.appendFileSync : fs.writeFileSync;
    saveFunc(this.filePath, content);
  }
  /**
   * @description 删除文件
   */
  clear(){
    let isFileExists = utils.fileExists(this.filePath);
    return new Promise ((resolve, reject) =>{
      if(isFileExists){
        fs.unlink(this.filePath,(err)=> {
          if (err) return reject(err)
          resolve(true)
        })
      }else {
        reject();
      }
    })
  }
}
