const { remote, MenuItem } = require("electron");
let RealMenuItem = process.type.includes("renderer")
  ? remote.MenuItem
  : MenuItem;

export const getrule = (types, webContents = null) => {
  let temp = types.map(type => {
    let temp = { type };
    let menuITemOpt = {};
    switch (type) {
      case "undo":
        menuITemOpt.label = "撤销";
        break;
      case "redo":
        menuITemOpt.label = "重做";
        break;
      case "cut":
        menuITemOpt.label = "剪切";
        break;
      case "copy":
        menuITemOpt.label = "复制";
        break;
      case "paste":
        menuITemOpt.label = "粘贴";
        break;
      case "delete":
        menuITemOpt.label = "删除";
        break;
      case "selectAll":
        menuITemOpt.label = "全选";
        break;
      case "reload":
        menuITemOpt.label = "重新加载";
        break;
    }

    if (webContents) {
      menuITemOpt.click = () => webContents[type] && webContents[type]();
    } else {
      menuITemOpt.rule = type;
    }

    temp.menu = new RealMenuItem(menuITemOpt);
    return temp;
  });

  return temp;
};
