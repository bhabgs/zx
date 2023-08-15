import { ipcRenderer } from "electron";
let badge = require("../assets/image/login/logo.png");
(function() {
  if ("Notification" in window) {
    Notification.requestPermission(function(permission) {});
  }
})();
export default (title, option) => {
  let instance = "";
  let notifyOpt = {
    badge,
    tag: "智信",
    icon: badge,
    ...option
  };
  if (!("Notification" in window)) {
    instance = false;
  } else if (Notification.permission === "granted") {
    instance = new Notification(title, notifyOpt);
  } else if (Notification.permission === "denied") {
    Notification.requestPermission(function(permission) {
      if (permission === "granted") {
        instance = new Notification(title, notifyOpt);
      }
    });
  }
  if (instance) {
    instance.onclick = function() {
      window.focus();
      ipcRenderer.send("activate-win");
    };
  }
  return instance;
};
