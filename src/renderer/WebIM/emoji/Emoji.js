import EmojiMap from "./emojiMap";
import Config from "./emoji.config";

export default class Emoji {
  static EmojiReg = null;
  constructor() {}

  static init(config = {}) {
    Emoji.setEmojiReg();
  }

  static setEmojiReg({ rule = "" } = {}) {
    try {
      let emojiData = Emoji.getEmojiMap();
      let keyList = Object.keys(emojiData.map);
      keyList = keyList.map(item =>
        item.replace(/^\[|\^|\$|\+|\.|\*|\?|\||\(|\)|\]$/g, e => `\\${e}`)
      );
      let regStr = keyList.join("|");
      Emoji.EmojiReg = new RegExp(regStr, rule);
      return Emoji.EmojiReg;
    } catch (error) {}
  }

  static emojiToHTML(emojiContent) {}

  /**
   * 将字符串中的unicode码转化为可以显示的原生emoji字符
   * @param  {string} content 必填，需要转化的包含emoji的字符串
   * @param  {regExp} reg      可选，标识unicode码的匹配范围
   * @return {string}          转化后的字符串
   */
  static unicodeToEmoji(content, reg) {
    try {
      reg = reg || Config.UnicodeReg;
      return content.replace(reg, function(unicode) {
        return Emoji.calculateUTF(unicode);
      });
    } catch (error) {
      return content;
    }
  }

  static calculateUTF(char) {
    let unicodes = escape(char).split("%u");
    unicodes = unicodes.filter(code => code !== "");
    unicodes = unicodes.map(code => {
      let startWithF = code.indexOf("f") === 0 || code.indexOf(code, "F") === 0;
      let isFE0F = code === "FE0F" || code === "fe0f";
      if (startWithF && !isFE0F) {
        return "0x1" + code;
      }
      return "0x" + code;
    });
    return String.RongFromCodePoint(unicodes);
  }

  static symbolToEmoji(text) {}

  static symbolToHTML(text) {
    try {
      let tempResult = null;
      let result = null;
      let emojiData = Emoji.getEmojiMap();
      let neafArray = text.split(/\n/g);
      if (neafArray.length) {
        neafArray.forEach((item, index) => {
          let currentResult = [];
          if (item.search(Emoji.EmojiReg) !== -1) {
            item.replace(Emoji.EmojiReg, (matching, index, source) => {
              currentResult.push({
                type: "txt",
                content: source.substring(0, index)
              });

              let src = `${emojiData.path}${emojiData.map[matching]}`;
              currentResult.push({
                type: "emoji",
                content: src,
                code: matching
              });
              let len = index + matching.length;
              let nextText = source.substr(len);
              if (nextText.length) {
                let nextResult = Emoji.symbolToHTML(nextText);
                nextResult &&
                  (currentResult = currentResult.concat(nextResult));
              }
            });
          } else {
            currentResult.push({
              type: "txt",
              content: item
            });
          }

          !tempResult && (tempResult = []);
          tempResult.push(currentResult);
        });
        tempResult.forEach((item, index) => {
          !result && (result = []);
          item.forEach(child => {
            result.push(child);
          });
          let tempResultLength = tempResult.length - 1;
          if (index !== tempResultLength) {
            result.push({ type: "txt", content: "\n" });
          }
        });
      }
      return result;
    } catch (error) {}
  }

  static getEmoji() {}

  static getCodeKey() {
    return "data-zhixin-emoji-text";
  }

  static getEmojiMap() {
    return EmojiMap;
  }

  static pathToSymbol(path) {
    let emojiData = Emoji.getEmojiMap();
    let emojiMap = emojiData.map;
    const emojiPath = emojiData.path;
    let emojiTxt = "";
    for (const key in emojiMap) {
      if (emojiMap.hasOwnProperty(key)) {
        const imgName = emojiMap[key];
        const currentPath = emojiPath + imgName;
        if (currentPath.includes(path)) {
          emojiTxt = key;
          break;
        }
      }
    }
    return emojiTxt;
  }
}
