const request = require("request");
// import moment from "moment";

/**
 * 时间格式化
 * @param {Date} value
 * @param {Number} type 类型，1：聊天，2：会话
 */
function formatDateFilter(value, type = 1) {
  const old = formatDate(value);
  const currentTime = new Date().getTime();
  const current = formatDate(currentTime);
  let differ = new Date(currentTime).setHours(0, 0, 0, 0) - new Date(value).setHours(0, 0, 0, 0);
  differ = differ < 0 ? 0 : differ;
  const differDay = Math.ceil(differ / (24 * 60 * 60 * 1000));
  let result = "";
  if (differDay <= 1) {
    if (isCurrentDay(value)) {
      // 当天
      if (type === 1) {
        result = `${formatNumber(old.M)}月${formatNumber(old.D)}日 ${formatNumber(old.H)}:${formatNumber(old.m)}`;
      } else {
        result = `${formatWeekName(old.week)} ${formatNumber(old.H)}:${formatNumber(old.m)}`;
      }
    } else {
      // 昨天
      if (type === 1) {
        result = `${formatNumber(old.M)}月${formatNumber(old.D)}日 昨日 ${formatNumber(old.H)}:${formatNumber(old.m)}`;
      } else {
        result = `昨日 ${formatWeekName(old.week)}`;
      }
    }
  } else {
    // 昨天之前
    if (compare(old.Y, current.Y) === 0) {
      // 当年
      result = `${formatNumber(old.M)}月${formatNumber(old.D)}日 ${formatWeekName(old.week)}`;
    } else {
      // 非当年
      result = `${old.Y}年${formatNumber(old.M)}月${formatNumber(old.D)}日`;
    }
    if (type === 1) {
      result += ` ${formatNumber(old.H)}:${formatNumber(old.m)}`
    }
  }

  return result;
}

function isCurrentDay(value) {
  const old = formatDate(value);
  const currentTime = new Date().getTime();
  const current = formatDate(currentTime);
  return compare(old.Y, current.Y) === 0 &&
    compare(old.M, current.M) === 0 &&
    compare(old.D, current.D) === 0;
}

function formatWeekName(week, key = "") {
  let name = "";
  name = `${key}${["天", "一", "二", "三", "四", "五", "六"][week]}`;
  return name;
}

/**
 * @description 格式化时间
 * @param {Date} time - 需要格式化的时间
 * @returns {Object}
 */
function formatDate(time) {
  let date = new Date(time);
  let Y = date.getFullYear();
  let M = +date.getMonth() + 1;
  let D = date.getDate();
  let H = date.getHours();
  let m = date.getMinutes();
  let s = date.getSeconds();
  let week = date.getDay();

  return {
    Y,
    M,
    D,
    H,
    m,
    s,
    week
  };
}

/**
 * 比较两个数字的大小
 * @param {number} a
 * @param {number} b
 */
function compare(a, b) {
  if (a > b) {
    return 1;
  } else if (a == b) {
    return 0;
  } else if (a < b) {
    return -1;
  }
}

/**
 * 数字补位
 * @param {number} num - 需要处理的数字
 */
function formatNumber(num) {
  if (num < 10) {
    return "0" + num;
  }
  return num;
}

/**
 * @description 防抖动处理
 * @param {Function} fn 处理函数
 * @param {Number} delay 延时时间(ms)
 */
function Debounce(fn, delay) {
  let timeout;
  return function() {
    clearTimeout(timeout);
    let args = arguments;
    let context = this;
    timeout = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}
/**
 * @description 函数节流
 * @param {Function} fn 处理函数
 * @param {Number} delay 延时(ms)
 */
function throttle(fn, delay = 160) {
  let timeout;
  let start = Date.now();
  return function() {
    let context = this,
      args = arguments,
      current = Date.now() - 0;
    clearTimeout(timeout);
    if (current - start >= delay) {
      fn.apply(context, args);
      start = current;
    } else {
      timeout = setTimeout(() => {
        fn.apply(context, args);
      }, delay);
    }
  };
}

function randomNumber(start, end) {
  const LENG = end - start;
  const num = Math.ceil(Math.random() * LENG) + start;
  return num;
}

function pingSimulate(ip) {
  let url = ip.includes("http") ? ip : `http://${ip}`;
  return new Promise((resolve, reject) => {
    request.head(url, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(true);
      }
    });
  });
}

/**
 * Utils 工具集
 */
const utils = {
  browser: {
    Chrome: (function() {
      let userAgent = window.navigator.userAgent;
      if (
        userAgent.indexOf("Chrome") > -1 &&
        userAgent.indexOf("Safari") > -1 &&
        userAgent.indexOf("Edge") === -1
      ) {
        return true;
      }
      return false;
    })(),
    Firefox: (function() {
      let userAgent = navigator.userAgent;
      if (userAgent.indexOf("Firefox") > -1) {
        return true;
      }
      return false;
    })(),
    Safari: (function() {
      let userAgent = navigator.userAgent;
      if (
        userAgent.indexOf("Safari") > -1 &&
        userAgent.indexOf("Chrome") == -1
      ) {
        return true;
      }
      return false;
    })(),
    Edge: (function() {
      let userAgent = navigator.userAgent;
      if (userAgent.indexOf("Edge") > -1) {
        return true;
      }
      return false;
    })(),
    Opera: (function() {
      let userAgent = navigator.userAgent;
      if (userAgent.indexOf("OPR") > -1) {
        return true;
      }
      return false;
    })(),
    IE: (function() {
      let userAgent = navigator.userAgent;
      let isIE =
        userAgent.indexOf("compatible") > -1 && userAgent.indexOf("MSIE") > -1;
      let isIE11 =
        userAgent.indexOf("Trident") > -1 && userAgent.indexOf("rv:11.0") > -1;
      if (isIE || isIE11) {
        return true;
      }
      return false;
    })()
  },
  formatDateFilter,
  isCurrentDay,
  formatDate,
  compare,
  formatNumber,
  Debounce,
  throttle,
  randomNumber,
  pingSimulate,
  deepClone(data) {
    let type = utils.dataType(data),
      o;
    if (type === "array") {
      o = [];
      data.forEach(item => {
        o.push(utils.deepClone(item));
      });
    } else if (type === "object") {
      o = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          o[key] = utils.deepClone(data[key]);
        }
      }
    } else if (type === "set") {
      o = new Set();
      data.forEach(item => {
        o.add(utils.deepClone(item));
      });
    } else if (type === "map") {
      o = new Map();

      for (const key in data) {
        o.set(key, utils.deepClone(data[key]));
      }
    } else {
      o = data;
    }

    return o;
  },
  /**
   * 根据新消息数量返回提示类型
   * @param {number} num 数量
   * @returns 1: 少、2: 中、3: 多
   */
  getHintType(num) {
    num = +num;
    if (num > 0 && num <= 3) {
      return 1;
    } else if (num > 3 && num <= 10) {
      return 2;
    } else if (num > 10) {
      return 3;
    }
  },
  hintType(unReadTotal) {
    let type = 1;
    switch (true) {
      case unReadTotal > 10 && unReadTotal <= 30:
        type = 2;
        break;
      case unReadTotal > 30:
        type = 3;
        break;
    }
    return type;
  },
  /**
   * 数组去重
   * @param {* string} key 如果数组中数据为对象时，去重标准的key
   */
  distinctArray(key) {
    // 数组去重
    let isObj = false;

    if (this instanceof Array && this.length > 1) {
      if (typeof this[0] == "object") {
        isObj = true;
      }
      if (isObj && !key) {
        return;
      }
      for (let i = 0; i < this.length; i++) {
        const item = this[i];
        for (let j = this.length - 1; j > i; j--) {
          const row = this[j];
          if (isObj && item[key] == row[key]) {
            this.splice(j, 1);
            i--;
            break;
          } else if (!isObj && item == row) {
            this.splice(j, 1);
            i--;
            break;
          }
        }
      }
    }
    return this;
  },

  dataType(obj) {
    let toString = Object.prototype.toString;
    let typeMap = {
      "[object Boolean]": "boolean",
      "[object String]": "string",
      "[object Number]": "number",
      "[object Array]": "array",
      "[object Undefined]": "undefined",
      "[object Null]": "null",
      "[object Function]": "function",
      "[object Object]": "object",
      "[object RegExp]": "regExp",
      "[object Date]": "date",
      "[object Set]": "set",
      "[object Map]": "map",
      "[object HTMLDivElement]": "html"
    };
    return typeMap[toString.call(obj)];
  },
  getFileSize(size) {
    const g = Math.pow(1024, 3);
    const m = Math.pow(1024, 2);
    const k = Math.pow(1024, 1);
    switch (true) {
      case size > g:
        size = `${(size / g).toFixed(2)}G`;
        break;
      case size > m:
        size = `${(size / m).toFixed(2)}M`;
        break;
      case size > k:
        size = `${(size / k).toFixed(2)}K`;
        break;
      default:
        size = `${size}B`;
        break;
    }
    return size;
  },
  encodeHtmlStr(str) {
    const replaceRule = [
      {
        symbol: "&",
        html: "&amp;"
      },
      {
        symbol: "<",
        html: "&lt;"
      },
      {
        symbol: ">",
        html: "&gt;"
      },
      {
        symbol: '"',
        html: "&quot;"
      },
      {
        symbol: "'",
        html: "&#39;"
      }
    ];

    replaceRule.forEach(rule => {
      let regExp = new RegExp(rule.symbol, "g");
      str = str.replace(regExp, rule.html);
    });
    return str;
  },
  replaceUri: function(str, callback) {
    let result = "";
    let protocol = "((?:http|https|ftp)\\:\\/\\/)?";
    let ip =
      "(?:(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])\\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]{1}[0-9]{1}|[0-9])";
    let host = "(?!@)(?:[a-z0-9-]{1,36}\\.)+[a-z]{2,6}";
    let port = "(?:\\:[0-9]{1,5})?";
    let path = "(?:[a-zA-Z0-9.,;?\\'+&%$#=~_\\-!()*\\/]*)";
    let uriReg = new RegExp(
      protocol + "(?:(?:" + ip + ")|(?:" + host + "))" + port + path,
      "ig"
    );

    result = str.replace(uriReg, function(uriStr, prot) {
      let lastIndex = arguments[arguments.length - 2];
      let prevChar = str.substr(lastIndex - 1, 1);
      let isEmail = prevChar === "@";
      let notDomain = !chkDomain(uriStr, prot);
      if (isEmail || notDomain) {
        return uriStr;
      }
      return callback.apply(null, arguments);
    });
    return result;
  },
  replaceEmail: function(str, callback) {
    let result = "";
    let emailReg = /\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/gi;

    result = str.replace(emailReg, callback);

    return result;
  },
  getFullPath(file) {
    let result = null;
    if (window.URL && window.URL.createObjectURL) {
      result = window.URL.createObjectURL(file);
    }
    return result;
  },
  getThumbnail(obj, area) {
    return new Promise((resolve, reject) => {
      let canvas = document.createElement("canvas"),
        context = canvas.getContext("2d");

      let img = new Image();

      img.onload = function() {
        let target_w = 0,
          target_h = 0;

        let imgarea = img.width * img.height;
        let _y = 0,
          _x = 0,
          maxWidth = 240,
          maxHeight = 240;
        if (imgarea > area) {
          let scale = Math.sqrt(imgarea / area);
          scale = Math.ceil(scale * 100) / 100;
          target_w = img.width / scale;
          target_h = img.height / scale;
        } else {
          target_w = img.width;
          target_h = img.height;
        }

        canvas.width = target_w;
        canvas.height = target_h;

        context.drawImage(img, 0, 0, target_w, target_h);

        try {
          if (canvas.width > maxWidth || canvas.height > maxHeight) {
            if (target_w > maxWidth) {
              _x = (target_w - maxWidth) / 2;
              target_w = maxWidth;
            }
            if (target_h > maxHeight) {
              _y = (target_h - maxHeight) / 2;
              target_h = maxHeight;
            }

            let imgData = context.getImageData(_x, _y, target_w, target_h);
            context.createImageData(target_w, target_h);
            canvas.width = target_w;
            canvas.height = target_h;
            context.putImageData(imgData, 0, 0);
          }
          let _canvas = canvas.toDataURL("image/jpeg", 0.5);
          resolve(_canvas);
        } catch (error) {
          reject(obj);
        }
      };
      img.src = this.getFullPath(obj);
    });
  },
  getRandomId(zwj = "", size = 8) {
    const S4 = () =>
      (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    const result = Array.from(new Array(size)).map(a => S4());

    return result.join(zwj);
  },
  getFileTypeByName(name) {
    name = name || "";
    let index = name.lastIndexOf(".");
    return index === -1 ? "" : name.substr(index + 1);
  },
  isEmptyObject(obj) {
    return Object.keys(obj).length === 0;
  },
  base64ToBlob(base64Data, type) {
    var mimeType;
    if (type) {
      mimeType = {
        type: type
      };
    }
    base64Data = base64Data.replace(/^(.*)[,]/, "");
    var sliceSize = 1024;
    var byteCharacters = atob(base64Data);
    var bytesLength = byteCharacters.length;
    var slicesCount = Math.ceil(bytesLength / sliceSize);
    var byteArrays = new Array(slicesCount);
    for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
      var begin = sliceIndex * sliceSize;
      var end = Math.min(begin + sliceSize, bytesLength);
      var bytes = new Array(end - begin);
      for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
        bytes[i] = byteCharacters[offset].charCodeAt(0);
      }
      byteArrays[sliceIndex] = new Uint8Array(bytes);
    }
    return new Blob(byteArrays, mimeType);
  },
  getFileIconClass(type = "") {
    let class_name = "";
    type = type.toLocaleLowerCase();
    switch (true) {
      case ["ai"].includes(type):
        class_name = "ai-file";
        break;

      case ["arm"].includes(type):
        class_name = "arm-file";
        break;

      case ["css"].includes(type):
        class_name = "css-file";
        break;

      case ["doc"].includes(type):
        class_name = "doc-file";
        break;

      case ["eps"].includes(type):
        class_name = "eps-file";
        break;

      case ["gif"].includes(type):
        class_name = "gif-file";
        break;

      case ["html"].includes(type):
        class_name = "html-file";
        break;

      case ["jpg"].includes(type):
        class_name = "jpg-file";
        break;

      case ["json"].includes(type):
        class_name = "json-file";
        break;

      case ["mp3"].includes(type):
        class_name = "mp3-file";
        break;

      case ["mp4"].includes(type):
        class_name = "mp4-file";
        break;

      case ["pdf"].includes(type):
        class_name = "pdf-file";
        break;

      case ["png"].includes(type):
        class_name = "png-file";
        break;

      case ["ppt"].includes(type):
        class_name = "ppt-file";
        break;

      case ["txt"].includes(type):
        class_name = "txt-file";
        break;

      case ["vid"].includes(type):
        class_name = "vid-file";
        break;

      case ["wav"].includes(type):
        class_name = "wav-file";
        break;

      case ["xls"].includes(type):
        class_name = "xls-file";
        break;

      case ["xml"].includes(type):
        class_name = "xml-file";
        break;

      case ["zip"].includes(type):
        class_name = "zip-file";
        break;

      default:
        class_name = "unknown-file";
        break;
    }

    return class_name;
  },
  /**
   * 识别文本中的超链接，转成a标签
   * @param {String} val 文本
   * @returns  {String}
   */
  linkTest(val) {
    const regex = /(https?|ftp|file):\/\/[-A-Za-z0-9+&@#/%?=~_|!:,.;]+[-A-Za-z0-9+&@#/%=~_|]/g;
    val = val.replace(regex, e => {
      return `<a target="_blank" href="${e}">${e}</a>`;
    });
    return val;
  }
};

export default utils;
