import { promises } from "fs";
import Jimp from "jimp";

/**
 * @description 生产缩略图
 * @param {buffer|string} input buffer数据，或本地文件路径
 * @param {number} area 缩略图最大面积，用来控制等比例缩放
 */
export const localImgToThumbnail = async (input, area) => {
  // let buffer = input;
  if (input === undefined) {
    return new Error("参数为undefined");
  }
  let notBuffer = !Buffer.isBuffer(input);
  let isUint = input instanceof Uint8Array;
  if (notBuffer && typeof input !== "string" && !isUint) {
    return new Error("数据类型无法识别");
  }
  console.time("generate thumbnail！！");
  try {
    let result = {};
    console.time("generate thumbnail read！！");
    let image = await Jimp.read(input);
    console.timeEnd("generate thumbnail read！！");
    let imgarea = image.bitmap.width * image.bitmap.height;
    let target_w = 0,
      target_h = 0,
      scale = 1;

    result.width = image.bitmap.width;
    result.height = image.bitmap.height;

    if (imgarea > area) {
      scale = Math.sqrt(imgarea / area); // 根据面积计算缩放比
    }
    target_w = image.bitmap.width / scale;
    target_h = image.bitmap.height / scale;

    console.time("generate thumbnail resize！！");
    image.resize(target_w, target_h);
    console.timeEnd("generate thumbnail resize！！");

    // console.dir(image);

    result.mime = image._originalMime;
    result.miniWidth = image.bitmap.width;
    result.miniHeight = image.bitmap.height;

    console.time("generate thumbnail to base64！！");

    let buf = await image.getBufferAsync(image._originalMime);
    result.base64 = `data:${image._originalMime};base64,${buf.toString(
      "base64"
    )}`;
    console.timeEnd("generate thumbnail to base64！！");
    console.log(result);

    console.timeEnd("generate thumbnail！！");
    return result;
  } catch (error) {
    throw error;
  }
};

/**
 * 对url追加参数
 * @param {string} url
 * @param {Array<Object>} data 需要追加的参数数组，[ { key, value } ], key为参数名，value 参数值
 */
export const appendUrlParams = (url, data) => {
  let resultUrl = url;
  if (url) {
    let params = "";
    if (data && Array.isArray(data)) {
      data = data.map(item => `${item.key}=${item.value}`);
      params = data.join("&");
    }
    const quesIndex = url.indexOf("?"); // 获取路径中是否已经存在参数
    if (quesIndex === -1) {
      resultUrl = resultUrl + "?" + params;
    } else {
      const hashIndex = url.indexOf("#/"); // 获取路径中是否存在hash值
      if (hashIndex === -1 || quesIndex > hashIndex) {
        resultUrl = `${resultUrl}&${params}`;
      } else {
        const replaceStr = url.includes("/#/") ? "/#/" : "#/";
        resultUrl = resultUrl.replace(replaceStr, `&${params}${replaceStr}`);
      }
    }
  }
  return resultUrl;
};
