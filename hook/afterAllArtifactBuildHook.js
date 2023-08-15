const { changeVersionAddEnv } = require("../.electron-vue/utils");

exports.default = async function(context) {
  console.log("-----------afterAllArtifactBuildHook--------");
  // console.log(context);
  // changeVersionAddEnv("restore");
  console.log("-----------afterAllArtifactBuildHook--------");
};
