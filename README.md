# 智信

> 智信客户端

#### Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:9080
npm run dev // 开发环境
npm run dev:test  // 测试环境
npm run dev:pre // 预上线环境
npm run dev:gray  // 灰度环境
npm run dev:prod  // 生产环境

# build electron application for production

# 注意：dev、test 环境打包直接输出独立于其他环境安装模式的包，无需修改 electron-builder.yml，其余环境需要独立安装包只需要修改 .electron-vue/utils.js 中 SuffixMode 值即可

npm run build // 开发环境
npm run build:test  // 测试环境
npm run build:pre // 预上线环境
npm run build:gray  // 灰度环境
npm run build:prod  // 生产环境

# run unit & end-to-end tests
npm test

# tips || FAQ

##  npm install error
 try install below first and then npm install and suggest the version of node is v14.17.6.

 npm install -g node-sass
 npm install -g node-gyp
 npm install -g eslint
 npm install -g eslint-plugin-html


# lint all JS/Vue component files in `src/`
npm run lint

```

---

This project was generated with [electron-vue](https://github.com/SimulatedGREG/electron-vue)@[8fae476](https://github.com/SimulatedGREG/electron-vue/tree/8fae4763e9d225d3691b627e83b9e09b56f6c935) using [vue-cli](https://github.com/vuejs/vue-cli). Documentation about the original structure can be found [here](https://simulatedgreg.gitbooks.io/electron-vue/content/index.html).
