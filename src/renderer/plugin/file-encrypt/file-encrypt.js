/*
 * @Author: lixiaowei
 * @Date: 2020-10-20 18:12:08
 * @LastEditors: lixiaowei
 * @LastEditTime: 2020-11-14 14:23:14
 * @Description: 文件加解密
 * @FilePath: /zx-client-pc/src/renderer/plugin/file-encrypt/file-encrypt.js
 */
import crypto from "crypto";
import { ipcRenderer } from "electron";
import fs from "fs";
import path from "path";
import { Duplex } from "stream";
import stream from "stream";
import util from "util";

import { fileExists, tmpdirExists, getRandomId } from "../../../modules/utils";
import Service from "../../service";
import { EncryptTransform, DecryptTransform } from "./cryption-tools";

const pipeline = util.promisify(stream.pipeline);

const algorithm = "aes-128-cbc"; // aes算法128秘钥长度cbc加密模式
const iv = "16-Bytes--String"; // 偏移量
const headLength = 36; // 加密文件流追加头部长度

let tmpCryptionDir;

const highWaterMark = 64 * 1024;

/**
 * aseEncrypt
 * 文件流加密
 * @param {Buffer} data 需要进行加密的流
 * @param {string} key 加密的秘钥
 */
function aseEncrypt(data, key) {
  let encipher = crypto.createCipheriv(algorithm, key, iv);
  encipher.setAutoPadding(true);
  return encipher;
}
/**
 * aseDecrypt
 * 文件流解密
 * @param {Buffer} data 需要进行解密的流
 * @param {string} key 解密的秘钥
 */
function aseDecrypt(data, key) {
  let decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAutoPadding(true);
  return decipher;
}

/**
 * 文件加密
 * @param {Buffer} filePath 需要加密的文件流
 * @returns {Buffer} 加密后的文件流
 */
async function encryptFileBuffer(filePath) {
  return new Promise(async (resolve, reject) => {
    try {
      console.time("encrypt!!!!");
      if (typeof filePath !== "string") {
        reject({ code: 0, message: "参数类型错误" });
        return;
      }
      if (!fileExists(filePath)) {
        reject({ code: 0, message: "本地文件不存在" });
        return;
      }

      let secret = await getKey();
      if (secret) {
        let headBuf = Buffer.alloc(headLength, secret.uuid);

        let reader = fs.createReadStream(filePath, { highWaterMark });

        let tmpname = getRandomId("", 4);
        checkTmpDir();
        const tmppath = path.join(tmpCryptionDir, tmpname);

        let write = fs.createWriteStream(tmppath, {});
        let writeHeadSuccess = false;
        write.write(headBuf, err => {
          if (err) {
            reject({ code: 0, message: "加密失败" });
          } else {
            writeHeadSuccess = true;
          }
        });

        if (writeHeadSuccess) {
          return;
        }
        const transformStream = new EncryptTransform();
        await pipeline(
          reader,
          transformStream,
          aseEncrypt(null, secret.decode),
          write
        );
        console.timeEnd("encrypt!!!!");

        resolve(tmppath);
      } else {
        reject({ code: 0, message: "未获取到秘钥" });
      }
    } catch (error) {
      console.error(error);
      reject({ code: 0 });
    }
  });
}

/**
 * 文件解密
 * @param {Buffer} filePath 需要解密的文件流
 */
async function decryptFileBuffer(filePath, savePath) {
  if (typeof filePath !== "string") {
    reject({ code: 0, message: "参数类型错误" });
    return;
  }
  if (!fileExists(filePath)) {
    reject({ code: 0, message: "本地文件不存在" });
    return;
  }
  console.time("decrypt-1!!!!!");
  console.time("decrypt-2!!!!!");

  let headUUID = await getHead(filePath, headLength);
  headUUID = headUUID.toString("utf-8");
  let secret = await getKeyByUuid(headUUID);
  if (secret) {
    const readerStream = fs.createReadStream(filePath, {
      highWaterMark,
      start: headLength
    });
    const transformStream = new DecryptTransform();
    let result = readerStream
      .pipe(transformStream)
      .pipe(aseDecrypt(null, secret.decode));
    console.timeEnd("decrypt-1!!!!!");
    return result;
  } else {
    throw { code: 0, message: "未获取到唯一标记" };
  }
}
function bufferToStream(buffer) {
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}
async function decryptFileBufferFromStream(stream) {
  if (stream.length) {
    let headUUID = stream.slice(0, headLength);
    headUUID = headUUID.toString("utf-8");
    let secret = await getKeyByUuid(headUUID);
    if (secret) {
      const readerStream = bufferToStream(
        stream.slice(headLength, stream.length)
      );
      const transformStream = new DecryptTransform();
      let result = readerStream
        .pipe(transformStream)
        .pipe(aseDecrypt(null, secret.decode));
      return result;
    } else {
      throw { code: 0, message: "未获取到唯一标记" };
    }
  } else {
    reject({ code: 0, message: "参数类型错误" });
    return;
  }
}

async function getKey(flag = 1) {
  let result = await ipcRenderer.invoke("get-current-secret");
  if (!result && flag < 4) {
    try {
      await Service.getAllSecret();
    } catch (error) {}
    return getKey(++flag);
  } else {
    return result;
  }
}

async function getKeyByUuid(uuid, flag = 1) {
  let result = await ipcRenderer.invoke("get-secret", uuid);
  if (!result && flag < 4) {
    try {
      await Service.getSecretByUUID(uuid);
    } catch (error) {}
    return getKeyByUuid(uuid, ++flag);
  } else {
    return result;
  }
}

function checkTmpDir() {
  tmpCryptionDir = tmpdirExists("upload", true);
}

function getHead(filePath, length) {
  return new Promise((resolve, reject) => {
    const readerStream = fs.createReadStream(filePath);
    readerStream.once("readable", () => {
      console.log("run in reader readable");
      const headResut = readerStream.read(length);
      console.log(headResut.toString());
      resolve(headResut);
      readerStream.destroy();
    });
    // 最多20s等待期
    setTimeout(() => {
      reject();
    }, 20000);
  });
}

export default {
  encryptFileBuffer,
  decryptFileBuffer,
  decryptFileBufferFromStream,
  bufferToStream
};
