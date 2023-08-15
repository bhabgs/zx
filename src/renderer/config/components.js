export default Vue => {
  const requireComponent = require.context(
    "@/components/common",
    true,
    /\.(vue|js)$/
  );
  const layoutsComponent = require.context(
    "@/components/layouts",
    true,
    /\.(vue)$/
  );
  requireComponent.keys().forEach(fileName => {
    const componentConfig = requireComponent(fileName);
    const componentName = componentConfig.default.name;
    Vue.component(componentName, componentConfig.default || componentConfig);
  });
  layoutsComponent.keys().forEach(fileName => {
    const componentConfig = layoutsComponent(fileName);
    const componentName = componentConfig.default.name;
    Vue.component(componentName, componentConfig.default || componentConfig);
  });
};
