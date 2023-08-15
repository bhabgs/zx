<!-- content-layout -->
<template>
  <div class="content-layout">
    <slot name="aside" class="chat-aside"></slot>
    <slot name="container" class="chat-body"></slot>
  </div>
</template>

<script>
//import..

export default {
  name: "content-layout",
  components: {},
  props: {},
  data() {
    //这里存放数据
    return {};
  },
  //监听属性 类似于data概念
  computed: {},
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  //监控data中的数据变化
  watch: {},
  //方法集合
  methods: {},
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
.content-layout {
  display: flex;
  .chat-aside {
    width: 261px;
    flex: 0 0 260px;
    border-right: 1px solid #e7e7e7;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #fff;
    position: relative;
  }
  .chat-body {
    flex: 1;
  }
}
</style>
