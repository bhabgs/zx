const requireContext = require.context(".", false, /\.js$/);

export default Vue => {
  requireContext.keys().forEach(path => {
    if (path.indexOf("index.js") === -1) {
      const requireItem = requireContext(path).default;
      Vue.filter(requireItem.name, requireItem.instance);
    }
  });
};
