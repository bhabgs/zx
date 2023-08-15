<template>
  <header class="base-header header-container">
    <div class="title-box" v-text="title.content" :style="`font-size: ${title.fontSize};`"></div>
    <div class="header-center">
      <slot></slot>
    </div>
    <div class="right-box">
      <user-photo class="self-avatar" :user="userInfo" :hasInfo="true"></user-photo>
      <system-menu class="system-menu"></system-menu>
    </div>
  </header>
</template>
<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "BaseHeader",
  components: {},
  props: {
    title: {
      type: Object,
      default: () =>({})
    }
  },
  data() {
    return {};
  },
  created() {},
  beforeDestroy() {},
  mounted() {},
  computed: {
    ...mapGetters({
      userInfo: "GetUser",
      OpenDialog: "GetOpenDialog",
      Groups: "GetGroups",
      GetCompany: "GetCompany",
      AllUserMap: "GetAllUserMap",
      LoginCompany: "GetCompany"
    })
  },
  watch: {},
  methods: {}
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/layout/header";
$--title-box-width: 183px;
$--right-box-width: 177px;
$--nav-width: calc(100% - 183px - 177px);
.base-header {
  -webkit-app-region: drag;
  border: 0;
  .title-box {
    flex-shrink: 0;
    width: $--title-box-width !important;
    padding: {
      left: 14px;
    }
    font-size: 20px;
    color: #fff;
    white-space: nowrap;
  }

  .header-center {
    flex: 1;
  }

  .right-box {
    // width: $--right-box-width;
    flex-shrink: 0;
    box-sizing: border-box;
    flex-shrink: 0;
    flex: unset;
    padding: 0;
    padding-right: 20px;
    .self-avatar {
      margin-left: 40px;
    }
  }
}
</style>
