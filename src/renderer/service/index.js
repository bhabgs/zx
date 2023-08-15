const requireContext = require.context(".", false, /\.js$/);

const api = {};
requireContext.keys().forEach(path => {
  if (path.indexOf("index.js") === -1) {
    Object.assign(api, requireContext(path).default);
  }
});
export default api;
