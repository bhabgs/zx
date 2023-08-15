/*
 * @Author: lixiaowei
 * @Date: 2021-04-08 10:41:14
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-08 10:41:15
 * @Description: file content
 * @FilePath: /zx-client-pc/scripts/notarize.js
 */

require("dotenv").config();
const { notarize } = require("electron-notarize");

exports.default = async function notarizing(context) {
  const appName = context.packager.appInfo.productFilename;
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return;
  }

  let appPath = `${appOutDir}/${appName}.app`;
  let { appleId, appBundleId, ascProvider } = process.env;
  let appleIdPassword = `@keychain:Application Loader: ${appleId}`;

  return await notarize({
    appBundleId,
    appPath,
    ascProvider,
    appleId,
    appleIdPassword
  });
};
