const { ipcMain, BrowserWindow } = require("electron");

ipcMain.on("event-transfr", (event, { channel, data }) => {
  if (!channel) return false;
  const winList = BrowserWindow.getAllWindows();
  winList.forEach(win => {
    win.webContents.send(channel, data);
  });
});
