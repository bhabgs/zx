const axios = require("axios");
const fs = require("fs");

(async function() {
  try {
    let res = await axios.default.post(
      "https://zhixin.zhiguaniot.com/api/platform/v1/getVersion",
      {
        pageNum: 1,
        pageSize: 30,
        appType: "3",
        type: "zx"
      },
      {
        headers: {
          authorization: "Bearer 2f49c1a2-142b-4007-b189-c1376810f98c",
          clienttype: "manager"
        },
        responseType: "json"
      }
    );
    let list = res.data.data.records;
    list = list.filter(
      a => new Date(a.updateAt).getTime() > new Date("2020-01-01").getTime()
    );
    let text = list.map(a => {
      let t = `${new Date(a.updateAt).toLocaleDateString()} v${a.code}\n`;
      let c = JSON.parse(a.content);
      c.forEach(i => {
        t += `\t${i.text}\n`;
      });
      return t;
    });
    text = text.join("\n\n");
    fs.writeFileSync(__dirname + "/version.txt", text);
    console.log("res: ", list);
    console.log("text: ", text);
  } catch (error) {
    console.error(error);
  }
})();
