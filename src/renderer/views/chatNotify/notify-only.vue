<!-- 对话通知 -->
<template>
  <section id="chatNotify-main">
    <!-- <base-header></base-header> -->
    <zx-header name="notify"></zx-header>
    <split ref="split">
      <section class="left-wrapper" slot="left">
        <notify-list></notify-list>
      </section>
      <section class="right-wrapper" slot="right">
        <notify class="chatNotify-body"></notify>
      </section>
    </split>
  </section>
</template>

<script>
//import..
import Notify from "@/views/chatNotify/notify";
import Split from "@/components/split/split";
import NotifyList from "@/components/chatNotify/notify-list";
export default {
  name: "ChatMain",
  components: {
    Notify,
    Split,
    NotifyList
  },
  props: {},
  data() {
    //这里存放数据
    return {};
  },
  watch: {
    $route(to, from) { }
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() { },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() { },
  beforeCreate() { }, //生命周期 - 创建之前
  beforeMount() { }, //生命周期 - 挂载之前
  beforeUpdate() { }, //生命周期 - 更新之前
  updated() { }, //生命周期 - 更新之后
  beforeDestroy() { }, //生命周期 - 销毁之前
  destroyed() { }, //生命周期 - 销毁完成
  activated() { }, //如果页面有keep-alive缓存功能，这个函数会触发
  //监听属性 类似于data概念
  computed: {},
  //方法集合
  methods: {}
};
</script>
<style lang="scss" scoped>
//@import url(); 引入公共css类
#chatNotify-main {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .wrapper {
    width: 100%;
    height: 100%;
  }

  .left-wrapper {
    @extend .wrapper;
    display: flex;
    flex-direction: column;
  }

  .right-wrapper {
    @extend .wrapper;
  }

  .chatNotify-body {
    flex: 1;
    overflow: hidden;
  }
}
</style>
