const ExportObject = {};
const requireList = require.context(".", false, /\.vue$/);

requireList.keys().forEach(fileName => {
  const requireConfig = requireList(fileName);
  const name = fileName.replace(/^\.\//, "").replace(/\.\w+$/, "");
  ExportObject[name] = requireConfig.default || requireConfig;
});

export default ExportObject;
