<template>
  <div id="app">
    <header id="setting-panel-header">
      设置 <i class="iconfont icon-close close-button" @click="closeHandle"></i>
    </header>
    <div id="setting-panel-body">
      <a-menu v-model="activeMenu" class="menu-box" @select="selectMenuHandle">
        <template v-for="row of menuList">
          <a-menu-item :key="row.key" v-if="row.show">{{
            row.title
          }}</a-menu-item>
        </template>
      </a-menu>
      <component class="right-contanier" :is="isComponent"></component>
    </div>
  </div>
</template>

<script>
import ShortcutKey from "./component/shortcut-key";
import ThemeColor from "./component/theme-color";

export default {
  name: "SettingPanel",
  components: { ShortcutKey, ThemeColor },
  data() {
    return {
      menuList: [
        { title: "账户与安全", key: "account", show: false },
        { title: "通知", key: "notify", show: false },
        {
          title: "快捷键",
          key: "shortcut",
          show: true,
          component: "ShortcutKey"
        },
        {
          title: "主题色",
          key: "theme",
          show: true,
          component: 'ThemeColor'
        }
      ],
      activeMenu: [],
      isComponent: ""
    };
  },
  created() {
    this.setSelectMenu(null, true);
  },
  mounted() {},
  watch: {},
  computed: {},
  methods: {
    setSelectMenu(item, init = false) {
      if (!item && !init) {
        return;
      }
      const { activeMenu, menuList } = this;
      if (init) {
        const menu = menuList.find(menu => menu.show);
        if (menu) {
          activeMenu.splice(0);
          activeMenu.push(menu.key);
          this.isComponent = menu.component;
        }
      }
    },
    /**
     * @description 关闭当前窗口
     */
    closeHandle() {
      window.close();
    },
    /**
     * @description 菜单项选择回调
     */
    selectMenuHandle({ key }) {
      this.isComponent = this.menuList.find((item) => item.key === key).component;
    }
  }
};
</script>

<style lang="scss">
$--header-height: 50px;
#app {
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  border-radius: 10px;

  div,
  p,
  section,
  ul,
  li,
  ol,
  a,
  input,
  button,
  header,
  main,
  footer,
  i {
    user-select: none;
    padding: 0;
    margin: 0;
    color: #000;
    font-size: 14px;
  }

  #setting-panel-header {
    width: 100%;
    height: $--header-height;
    line-height: $--header-height;
    background-color: #eaedf2;
    text-align: center;
    position: relative;
    -webkit-app-region: drag;
    font-size: 14px;
    font-family: MicrosoftYaHei-Bold, MicrosoftYaHei;
    // font-weight: bold;
    color: #1f2329;
    > .close-button {
      position: absolute;
      top: 50%;
      right: 15px;
      transform: translateY(-50%);
      padding: 5px;
      color: #8f959e;
      font-size: 11px;
      cursor: pointer;
      line-height: 1;
      -webkit-app-region: no-drag;

      &:hover {
        color: #6c7177;
      }
    }
  }

  #setting-panel-body {
    display: flex;
    height: calc(100vh - 50px);
  }
  .menu-box {
    width: 161px;
    flex-shrink: 0;
    border-right: 1px solid #dde0e3;
    color: #1f2329;
    > .ant-menu-item {
      padding: {
        left: 40px;
      }
      &.ant-menu-item-selected {
        background: #F0F5FF;
        color: #3E7EFF;
      }
    }
  }

  .right-contanier {
    padding: 16px 14px;
    overflow: hidden auto;
    flex: 1;
  }
}
</style>
