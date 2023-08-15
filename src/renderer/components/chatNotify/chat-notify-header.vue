<!-- 消息头部 -->
<template>
  <div class="chat-notify-header" :class="`active-${activeIndex}`">
    <button
      v-for="(btn, index) of btnList"
      :key="index"
      @click="goToPage(btn)"
      :class="{ 'active-btn': activeIndex === index }"
    >
      {{ btn.name }}
      <Badge
        class="hint-sign number-badge"
        v-show="unReadTotal[btn.type].total"
        :class="{
          'dot-badge': unReadTotal[btn.type].isDot,
          'low-color': unReadTotal[btn.type].hintType == 1,
          'mid-color': unReadTotal[btn.type].hintType == 2,
          'hot-color': unReadTotal[btn.type].hintType == 3
        }"
        :dot="unReadTotal[btn.type].isDot"
        :count="unReadTotal[btn.type].total"
      ></Badge>
    </button>
  </div>
</template>

<script>
//import..
import { mapGetters, mapActions } from "vuex";
export default {
  name: "zx-notify-header",
  components: {},
  props: {},
  data() {
    //这里存放数据
    return {
      btnList: [
        { name: "对话", path: "chitchat", type: "chat" },
        { name: "通知", path: "notify", type: "notify" }
      ]
    };
  },
  //监听属性 类似于data概念
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany",
      NotifyUnReadCount: "GetNotifyUnReadCount",
      ChatUnreadCount: "GetChatUnreadCount"
    }),
    activeIndex() {
      let result = 0;
      this.btnList.some((item, index) => {
        if (item.path === this.$route.name) {
          result = index;
          return true;
        }
      });
      return result;
    },
    groupDefult() {
      return {
        users: [this.GetCompany],
        disDel: [this.GetCompany]
      };
    },
    unReadTotal() {
      const { $myUtils, ChatUnreadCount, NotifyUnReadCount } = this;
      const { total, hintType, numberTotal, numberType } = NotifyUnReadCount;

      let chat = ChatUnreadCount,
        notify = { total, hintType, isDot: true };

      if (numberTotal > 0) {
        // 如果存在数字通知，则显示数字
        notify = { total: numberTotal, hintType: numberType, isDot: false };
      }
      return { chat, notify };
    }
  },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {},
  //监控data中的数据变化
  watch: {},
  //方法集合
  methods: {
    goToPage(btn) {
      if (this.$route.name != btn.path) {
        sessionStorage.setItem("chat-route-name", btn.path);
        this.$router.push({ name: btn.path });
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
@import "~@/assets/styles/constant";
.chat-notify-header {
  user-select: none;
  width: 100%;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e7e7e7;
  position: relative;
  &::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: -1px;
    height: 2px;
    width: 50%;
    background-color: $--default-theme-color;
    transition: all 0.15s ease-in-out;
  }
  &.active-0 {
    &::after {
      left: 0;
    }
  }
  &.active-1 {
    &::after {
      left: 50%;
    }
  }
  > button {
    position: relative;
    background-color: transparent;
    width: 50%;
    height: 100%;
    font-size: 14px;
    color: #999;
    text-align: center;
    transition: all 0.15s linear;
    &.active-btn {
      color: $--default-theme-color;
    }
  }
  .hint-sign {
    position: absolute;
  }

  .number-badge {
    top: 3px;
    right: 30px;
    line-height: 0;
    &.dot-badge {
      top: 10px;
      right: 38px;
    }
  }
}
</style>
