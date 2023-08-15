<!-- 组织、外联消息头部 -->
<template>
  <div class="chat-list-header">
    <div class="btns-box" :class="`active-${activeIndex}`">
      <button
        v-for="(btn, index) of btnList"
        :key="index"
        @click="goToPage(btn)"
        :class="{ 'active-btn': activeIndex === index }"
      >
        <img
          :src="
            require(`@/assets/outsource/${btn.icon}${activeIndex === index ? '_blue' : ''
              }.png`)
          "
          alt
        />
        <span>{{ 
          btn.name 
        }}<Badge
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
        </span>
      </button>
    </div>
    <div class="operate-box">
      <action-center-icon 
        :showNew="true" 
        @select="handleOperate"
      ></action-center-icon>
    </div>
  </div>
</template>

<script>
//import..
import { mapGetters } from "vuex";
import ActionCenterIcon from '@/components/chatNotify/action-center-icon.vue';
export default {
  name: "chat-List-header",
  components: { ActionCenterIcon },
  props: {},
  data() {
    //这里存放数据
    return {
      btnList: [
        {
          name: "组织",
          icon: "organization",
          path: "chitchat",
          type: "organization"
        },
        { name: "外联", icon: "outsource", path: "chitchat", type: "outsource" }
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
        if (item.type === this.$route.query.type) {
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
      const { ChatUnreadCount, NotifyUnReadCount } = this; 
      // const { total, hintType, numberTotal, numberType } = NotifyUnReadCount; 
 
      // let chat = ChatUnreadCount, 
      //   notify = { total, hintType, isDot: true }; 
 
      // if (numberTotal > 0) { 
      //   // 如果存在数字通知，则显示数字 
      //   notify = { total: numberTotal, hintType: numberType, isDot: false }; 
      // } 
      return ChatUnreadCount;
    }
  },
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() { },
  //监控data中的数据变化
  watch: {},
  //方法集合
  methods: {
    goToPage(btn) {
      const { type } = this.$route.query;
      if (type != btn.type) {
        sessionStorage.setItem("chat-route-type", btn.type);
        this.$router.push({ name: btn.path, query: { type: btn.type } });
        // 收起行动列表
        this.$emit("operate-select", "");
      }
    },
    handleOperate() {
      this.$emit("operate-select", "action");
    }
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() { },
  beforeCreate() { }, //生命周期 - 创建之前
  beforeMount() { }, //生命周期 - 挂载之前
  beforeUpdate() { }, //生命周期 - 更新之前
  updated() { }, //生命周期 - 更新之后
  beforeDestroy() { }, //生命周期 - 销毁之前
  destroyed() { }, //生命周期 - 销毁完成
  activated() { } //如果页面有keep-alive缓存功能，这个函数会触发
};
</script>
<style lang="scss" scoped>
//@import url(); 引入公共css类
@import "~@/assets/styles/constant";
.chat-list-header {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 100%;
  background-color: #fff;
  user-select: none;
  .btns-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    height: 40px;
    background-color: #fff;
    border-bottom: 1px solid #e7e7e7;
    position: relative;
    &::after {
      content: "";
      width: 1px;
      height: 12px;
      position: absolute;
      background: #e7e7e7;
      top: 14px;
      left: 50%;
    }
    &.active-0 {
      .active-btn span {
        color: #3e7eff;
      }
    }
    &.active-1 {
      .active-btn span {
        color: #36d18e;
      }
    }
    > button {
      background-color: transparent;
      width: 50%;
      height: 100%;
      transition: all 0.15s linear;
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
      span {
        position: relative;
        font-size: 14px;
        color: #8f959e;
      }
    }
  }
  .operate-box {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    height: 32px;
    padding: 0 16px;
    background-color: #fff;
    border-bottom: 1px solid #e7e7e7;
  }
  .hint-sign {
    position: absolute;
  }
  .number-badge {
    top: -6px;
    right: 1px;
    line-height: 0;
    &.dot-badge {
      top: -12px;
      right: -6px;
    }
    &.hot-color {
      :deep(.ivu-badge-dot) {
        background-color: #e94b3f !important;
      }
    }
    &.mid-color {
      :deep(.ivu-badge-dot) {
        background-color: #f5ad01 !important;
      }
    }
    &.low-color {
      :deep(.ivu-badge-dot) {
        background-color: #3bca66 !important;
      }
    }
  }
}
</style>
