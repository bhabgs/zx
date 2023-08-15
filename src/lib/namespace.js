/**
 * 命名空间处理类
 */
class NameSpaceUtil {
  /**
   * 字符串转换
   * @param {String} str 输入字符
   */
  static BKDRHash(str) {
    const seed = 31; // 也可以乘以31、131、1313、13131、131313..
    let hash = 0;

    if (str !== undefined && str !== null) {
      for (let i = 0; i < str.length; i++) {
        let n = str.charAt(i);
        hash = (hash >> 4) * seed + n.charCodeAt(0);
      }
    }

    return hash % 0x7fffffff;
  }

  /**
   * 根据用户ID计算命名空间
   * @param {String} accountId 用户ID
   */
  static initNs(accountId) {
    const { BKDRHash, formatNum } = this;
    let hashNum = BKDRHash(accountId);
    let nsNum = (hashNum % 100) + 1;
    let nsStr = formatNum(nsNum); // 3位，不足前置补0
    let nsName = `ns${nsStr}`; // 增加命名空间前缀
    return nsName;
  }

  /**
   * 对字符串或数字进行前置补0
   * @param {String|Number} num 需要前置补0的数或字符
   * @param {Number} d 指定最终字符的位数
   */
  static formatNum(num, d = 3) {
    let str = "";
    if (num !== undefined && num !== null) {
      str = String(num);
      let diffLength = d - str.length;
      while (diffLength > 0) {
        str = "0" + str;
        --diffLength;
      }
    }

    return str;
  }
}

export default NameSpaceUtil;
// module.exports = NameSpaceUtil;
