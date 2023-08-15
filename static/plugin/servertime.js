let serverUrl = null;  // 同步时间服务器URL
let interval = null;   // 服务器时钟计时器
let timeout = null;    // 服务器不可用时重新拉取服务器时间计时器

process.on('message', function (m) {
  // 主进程发送服务器url后，开始同步时间
  serverUrl = m.timeServerUrl;
  if (timeout) {
    // 如果有等待重试的计时器则清除
    clearTimeout(timeout);
  }
  getServerTime();
});

/**
 * 同步服务器时间函数
 * 通过对服务器发送get请求，获取响应头中的date，即服务器时间
 * 通过一个interval，每秒钟对服务器时间加1秒，本地形成一个服务器时钟
 * 本地服务器时钟运行一段时间后会有时间误差，因此每隔固定时间（例如15分钟）需要重新同步一次服务器时间
 */
function getServerTime() {
  if (!serverUrl) {
    return;
  }

  let http = require("http");
  if (serverUrl.startsWith("https")) {
    http = require("https");
  }

  const req = http.request(serverUrl, (res) => {
    const serverDate = new Date(res.headers.date);
    let serverTime = serverDate.getTime();
    let count = 0;

    if (interval !== null) {
      // 清理掉之前的时钟interval
      clearInterval(interval);
    }

    interval = setInterval(() => {
      count += 1;
      serverTime += 1000;
      // 将服务器时间发送给主进程保存
      process.send({ serverTime });
      // console.log("服务器时间: " + new Date(serverTime));
      if (count === 15 * 60) {
        // 每15分钟重新校准一次时间
        console.log(`重新校准服务器时间, 当前存储服务器时间: ${new Date(serverTime)}, 本地时间: ${new Date()}`);
        if (timeout) {
          // 如果有等待重试的计时器则清除
          clearTimeout(timeout);
        }
        getServerTime();
      }
    }, 1000);
  });

  req.on('error', (e) => {
    // 服务器请求失败，1分钟后重试
    console.error(`校准服务器时间失败: ${e.message}`);
    if (timeout) {
      // 如果有等待重试的计时器则清除
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      getServerTime();
    }, 60 * 1000);
  });

  req.end();
}