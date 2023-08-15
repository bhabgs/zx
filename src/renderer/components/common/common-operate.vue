<!-- 通用按钮操作 -->
<template>
  <div class="common-button">
    <button
      class="ml-2"
      @click="operateHandler({ key: 'group' })"
    >
      <SvgIcon
        name="create-group"
        class=" w-5 h-5 text-white cursor-pointer" />
    </button>
      <!-- <button
      class="operate-btn iconfont"
      v-for="(btn, index) of operateBtns"
      v-show="btn.show"
      :key="`btn-${index}`"
      :class="btn.icon"
      :style="{ color: color }"
      @click="operateHandler(btn)"
    ></button> -->
  </div>
</template>

<script>
//import..

export default {
  name: "common-button",
  components: {},
  props: {
    color: {
      type: String,
      default: "#fff"
    },
    groupDefault: {
      type: Object
    }
  },
  data() {
    //这里存放数据
    return {};
  },
  //监听属性 类似于data概念
  computed: {
    operateBtns() {
      let list = {
        group: {
          key: "group",
          // icon: "icon-tubiaoku_huabanfuben",
          show: true,
          describe: "建群"
        },
        file: {
          key: "file",
          icon: "icon-wenjianjia1",
          show: false,
          describe: "文件传输"
        },
        backstage: {
          key: "backstage",
          icon: "icon-houtai",
          show: false,
          describe: "管理后台"
        }
      };
      return list;
    }
  },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  //监控data中的数据变化
  watch: {},
  //方法集合
  methods: {
    operateHandler(btn) {
      switch (btn.key) {
        case this.operateBtns.group.key:
          // 建群
          this.$root.$emit("create-group", this.groupDefault);
          break;
        case this.operateBtns.file.key:
          // 文件传输
          break;
        case this.operateBtns.backstage.key:
          // 打开管理后台
          break;
      }
    }
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() {},
  beforeCreate() {}, //生命周期 - 创建之前
  beforeMount() {}, //生命周期 - 挂载之前
  beforeUpdate() {}, //生命周期 - 更新之前
  updated() {}, //生命周期 - 更新之后
  beforeDestroy() {}, //生命周期 - 销毁之前
  destroyed() {}, //生命周期 - 销毁完成
  activated() {} //如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style lang="scss" scoped>
//@import url(); 引入公共css类
.common-button {
  display: flex;
  align-items: center;
  .operate-btn {
    margin-left: 11px;
    // font-size: 20px;
    // line-height: 1;
    // opacity: 0.5;
    background-color: transparent;
    width: 22px;
    height: 22px;
    border: 0;
    background-image: url(~@/assets/image/add-group-chat.png);
  }
}
</style>

