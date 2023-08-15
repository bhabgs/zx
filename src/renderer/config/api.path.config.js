const basicConfig = {
  clientType: process.env.BASE_CLIENT,
  baseURL: process.env.BASE_URL,
  auth: process.env.AUTH,
  contactPath: process.env.API_CONTACT,
  messagePath: process.env.API_MESSAGE,
  chatPath: process.env.API_CHAT,
  oss: process.env.API_OSS,
  micro_app: process.env.API_MICRO_APP,
  push: process.env.API_PUSH,
  smartOa: process.env.API_SMARTOA,
  search: process.env.API_SEARCH,
  platform: process.env.PLATFORM,
  pulsar: process.env.PULSAR_URL,
  notify: process.env.NOTIFY,
  mail: process.env.API_MAIL,
  actionCenter: process.env.API_ACTIONCENTER,
  alioss: {
    doman: process.env.OSS_DOMAN,
    region: process.env.OSS_REGION,
    bucket: process.env.OSS_BUCKET,
    pubBucket: process.env.OSS_PUB_BUCKET,
    accessKeyId: "",
    accessKeySecret: "",
    folder: process.env.OSS_FOLDER
  },
  emojiPath: {
    root: process.env.EMOJI_ROOT,
    child: process.env.EMOJI_CHILD
  },
  appUrl: {
    mail: process.env.APP_MAIL,
    file: process.env.APP_File,
    okrs: process.env.APP_OKRS,
    help: process.env.APP_HELP
  }
};
const apipath = (type = 1, baseURL = process.env.BASE_URL) => {
  let config = basicConfig;
  if (type !== 1) {
    let node = {
      baseURL: baseURL,
      auth: "/auth",
      micro_app: "/microapp/v1",
      contactPath: "/contact/v1",
      oss: "/oss/v1",
      platform: "/platform/v1"
    };
    config = {...basicConfig, ...node};
  }
  return config;
};

export default apipath;
