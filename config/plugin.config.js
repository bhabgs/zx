exports.dotenv = () => {
  const MODE = process.env.MODE_ENV;

  const opt = {
    path: "./.env.dev",
    defaults: "./.env"
  };
  switch (MODE) {
    case "dev":
      // 开发环境
      break;
    case "test":
      // 测试环境
      break;
    case "pre":
      // 预上线环境
      break;
    case "gray":
      // 灰度环境
      break;
    case "prod":
      // 生产环境
      break;
    default:
      break;
  }
  opt.path = `./.env.${MODE}`;

  return opt;
};
