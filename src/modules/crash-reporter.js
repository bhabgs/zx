const { crashReporter } = require("electron");

function init() {
  crashReporter.start({
    productName: "ZhiXin",
    companyName: "zhiguaniot",
    submitURL: "http://192.168.5.55:33855/crash"
  });
}

module.exports = { init };
