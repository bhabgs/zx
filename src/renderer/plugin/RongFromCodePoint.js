/*! http://mths.be/fromcodepoint v0.1.0 by @mathias,   fromCodePoint兼容 */
(function() {
  var defineProperty = (function() {
    // IE 8 only supports `Object.defineProperty` on DOM elements
    try {
      var object = {};
      var $defineProperty = Object.defineProperty;
      var result = $defineProperty(object, object, object) && $defineProperty;
    } catch (error) {}
    return result;
  })();
  var stringFromCharCode = String.fromCharCode;
  var floor = Math.floor;
  var RongFromCodePoint = function(codeList) {
    var MAX_SIZE = 0x4000;
    var codeUnits = [];
    var highSurrogate;
    var lowSurrogate;
    var index = -1;
    var length = codeList.length || [];
    if (!length) {
      return "";
    }
    var result = "";
    while (++index < length) {
      var codePoint = Number(codeList[index]);
      if (
        !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
        codePoint < 0 || // not a valid Unicode code point
        codePoint > 0x10ffff || // not a valid Unicode code point
        floor(codePoint) != codePoint // not an integer
      ) {
        throw RangeError("Invalid code point: " + codePoint);
      }
      if (codePoint <= 0xffff) {
        // BMP code point
        codeUnits.push(codePoint);
      } else {
        // Astral code point; split in surrogate halves
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        codePoint -= 0x10000;
        highSurrogate = (codePoint >> 10) + 0xd800;
        lowSurrogate = (codePoint % 0x400) + 0xdc00;
        codeUnits.push(highSurrogate, lowSurrogate);
      }
      if (index + 1 == length || codeUnits.length > MAX_SIZE) {
        result += stringFromCharCode.apply(null, codeUnits);
        codeUnits.length = 0;
      }
    }
    return result;
  };
  if (defineProperty) {
    defineProperty(String, "RongFromCodePoint", {
      value: RongFromCodePoint,
      configurable: true,
      writable: true
    });
  } else {
    String.RongFromCodePoint = RongFromCodePoint;
  }
})();