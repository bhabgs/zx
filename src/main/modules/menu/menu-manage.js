import { Menu, MenuItem, remote } from "electron";
let RealMenuItem = MenuItem;
let RealMenu = Menu;
if (process.type.includes("renderer")) {
  RealMenuItem = remote.MenuItem;
  RealMenu = remote.Menu;
}

export const getrule = types => {
  let temp = types.map(type => {
    let temp = { type };
    switch (type) {
      case "undo":
        temp.menu = new RealMenuItem({ label: "撤销", role: "undo" });
        break;
      case "redo":
        temp.menu = new RealMenuItem({ label: "重做", role: "redo" });
        break;
      case "cut":
        temp.menu = new RealMenuItem({ label: "剪切", role: "cut" });
        break;
      case "copy":
        temp.menu = new RealMenuItem({ label: "复制", role: "copy" });
        break;
      case "paste":
        temp.menu = new RealMenuItem({ label: "粘贴", role: "paste" });
        break;
      case "delete":
        temp.menu = new RealMenuItem({ label: "删除", role: "delete" });
        break;
      case "selectAll":
        temp.menu = new RealMenuItem({ label: "全选", role: "selectAll" });
        break;
      case "reload":
        temp.menu = new RealMenuItem({ label: "重新加载", role: "reload" });
        break;
    }

    return temp;
  });

  return temp;
};

export default class MenuManage extends RealMenu {
  constructor({ rules = [] }) {
    super();
    let menuList = getrule(rules);
    if (menuList.length) {
      this.menuList = menuList;
      this.menuList.forEach(item => super.append(item.menu));
    }
  }

  changeEditRuleItemEnabled({ editFlags = {} }) {
    this.menuList.forEach(item => {
      let key = `can${item.type.replace(/^.{1}/, val =>
        val.toLocaleUpperCase()
      )}`;
      item.menu.enabled = editFlags[key];
    });
  }
}
