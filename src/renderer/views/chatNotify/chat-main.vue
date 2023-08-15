<!-- 对话通知 -->
<template>
  <section id="chatNotify-main" class="relative">
    <zx-header name="chat"></zx-header>
    <!-- 抽屉 -->
    <split 
      ref="split"
      :actionValue="actionValue"
      :actionWidth="actionWidth"
    >
      <section class="left-wrapper" slot="left">
        <chat-list-header @operate-select="handleOperateSelect"></chat-list-header>
        <dialog-storagelist></dialog-storagelist>
        <!-- <notify-list v-show="$route.name === 'notify'"></notify-list> -->
      </section>
      <section class="right-wrapper" slot="right">
        <chitchat class="chatNotify-body"></chitchat>
        <!-- <notify
          v-show="$route.name === 'notify'"
          class="chatNotify-body"
        ></notify> -->
      </section>
    </split>
    <!-- 会话列表行动中心弹窗 -->
    <div
      class="action-list-box bottom"
      :style="{
        width: actionWidth + 'px',
        transform: `translate(0, ${actionDialog ? '0' : '100%'})`
      }"
    >
      <ActionCenterList
        v-if="actionDialog"
        :stickyBgColor="actionStickyColor"
        @close="handleActionClose"
      ></ActionCenterList>
    </div>
    <!-- 会话页面行动中心弹窗 -->
    <div
      class="action-list-box right"
      :style="{
        width: actionWidth + 'px',
        right: chatActionDialog ? '0' : `-${actionWidth}px`
      }"
    >
      <ActionCenterList
        v-if="chatActionDialog"
        :chatName="chatActionData.chatType === 1 ? chatActionData.name : `与${chatActionData.name}的`"
        :targetId="chatActionData.id"
        :actionChatType="chatActionData.chatType"
        :stickyBgColor="chatActionStickyColor"
        @close="handleChatActionClose"
      ></ActionCenterList>
    </div>
    <!-- 选择人员弹窗 -->
    <a-modal
      v-model="orgModal"
      wrapClassName="organize-modal"
      :maskClosable="false"
      :closable="true"
      :footer="null"
      width="440"
      destroyOnClose
      @cancel="handleOrganizeCancel"
    >
      <select-organize-modal
        ref="organizeModal"
        :removeSelf="true"
        @close="handleOrganizeCancel"
        @confirm="handleOrganizeConfirm"
      ></select-organize-modal>
    </a-modal>
  </section>
</template>

<script>
//import..
import layouts from "@/components/layouts";
// import chatNotifyHeader from "@/components/chatNotify/chat-notify-header";
import ChatListHeader from "@/components/chatNotify/chat-list-header";
import Chitchat from "@/views/chatNotify/chitchat";
import Notify from "@/views/chatNotify/notify";
import DialogStoragelist from "@/components/chitchat/dialog-storagelist";
import Split from "@/components/split/split";
import NotifyList from "@/components/chatNotify/notify-list";
import ActionCenterList from "@/components/chatNotify/action-center-list";
import SelectOrganizeModal from "@/components/chitchat/select-organize-modal.vue";
import { mapActions } from "vuex";
import { ConversationModel } from "../../WebIM";
import { ipcRenderer } from "electron";
export default {
  name: "ChatMain",
  components: {
    ChatListHeader,
    zxHeader: layouts.zxHeader,
    Chitchat,
    Notify,
    DialogStoragelist,
    Split,
    NotifyList,
    ActionCenterList,
    SelectOrganizeModal
  },
  props: {},
  data() {
    //这里存放数据
    return {
      dialogType: "organization",
      actionDialog: false,
      actionWidth: 365,
      actionValue: 0,
      actionStickyColor: '',

      chatActionDialog: false,
      chatActionData: {},
      chatActionStickyColor: '',

      orgModal: false,
    };
  },
  watch: {
    $route(to, from) {
      if (to.name === "chitchat") {
        this.dialogType = to.query.type || "organization";
        this.SetChitchatType(this.dialogType);
      }
    }
  },
  //生命周期 - 创建完成（可以访问当前this实例）
  created() {},
  //生命周期 - 挂载完成（可以访问DOM元素）
  mounted() {
    // 监听行动中心聊天页面回调事件
    this.$root.$on('open-action-list-chat', this.handleOpenChatAction);
    this.$root.$on('action-list-close', this.handleActionClose);
    // 监听收消息的通知
    window.eventHub.$on("acStateChanged", this.acStateChanged);
    window.eventHub.$on("open-organize-modal", this.openOrganizeModal);
  },
  beforeCreate() {}, //生命周期 - 创建之前
  beforeMount() {}, //生命周期 - 挂载之前
  beforeUpdate() {}, //生命周期 - 更新之前
  updated() {}, //生命周期 - 更新之后
  beforeDestroy() {
    this.$root.$off('open-action-list-chat', this.handleOpenChatAction);
    this.$root.$off('action-list-close', this.handleActionClose);
    window.eventHub.$off("acStateChanged", this.acStateChanged);
    window.eventHub.$off("open-organize-modal", this.openOrganizeModal);
  }, //生命周期 - 销毁之前
  destroyed() {}, //生命周期 - 销毁完成
  activated() {}, //如果页面有keep-alive缓存功能，这个函数会触发
  //监听属性 类似于data概念
  computed: {},
  //方法集合
  methods: {
    ...mapActions(["SetChitchatType"]),

    handleOperateSelect(type) {
      if (type === 'action') {
        this.actionDialog = !this.actionDialog;
        if (this.actionDialog) {
          let clientWidth = document.body.clientWidth - 60;
          this.actionValue = this.actionWidth / clientWidth;
          this.actionStickyColor = "";
        }
      } else {
        this.handleActionClose();
      }
    },
    handleActionClose() {
      this.actionDialog = false;
      this.actionValue = 0;
    },
    handleOpenChatAction(data) {
      if (data && !this.chatActionDialog) {
        this.chatActionDialog = true;
        this.chatActionData = { ...data };
        this.chatActionStickyColor = "";
      } else {
        this.handleChatActionClose();
      }
    },
    handleChatActionClose() {
      this.chatActionDialog = false;
      this.chatActionData = {};
    },
    // 监听行动中心回传数据
    acStateChanged(data) {
      if (data) {
        // 改变顶部颜色
        if (data.stickyKey) {
          let key = '';
          if (this.chatActionData.id) {
            const type = this.chatActionData.chatType === 1 ? 'group' : 'chat';
            key = `${type}/${this.chatActionData.id}`;
          }
          if (data.stickyKey === 'action-list') {
            this.actionStickyColor = data.isSticky ? data.stickyBgColor : '';
          } else if (data.stickyKey === key) {
            this.chatActionStickyColor = data.isSticky ? data.stickyBgColor : '';
          }
        }
      }
    },
    // 组织架构选人
    openOrganizeModal() {
      this.orgModal = true;
    },
    handleOrganizeCancel() {
      this.orgModal = false;
    },
    handleOrganizeConfirm(selectObj) {
      if (selectObj && selectObj.id) {
        this.orgModal = false;
        setTimeout(() => {
          const path = `/create/${selectObj.conversationType === ConversationModel.IMConversationEnum.GROUP ? 'group' : 'chat' }/${selectObj.id}`;
          ipcRenderer.invoke('open-operation-page', { to: "operation", data: { path } });
        }, 100);
      } else {
        this.$message.warning("选择人员异常，请重新选择");
      }
    }
  }
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
  .action-list-box {
    position: fixed;
    background-color: #F4F6F8;
    overflow: hidden;
    box-shadow: 0 0 10px 1px rgba(0,0,0,0.1);
    transition-duration: 300ms;
    z-index: 888;
    &.bottom {
      left: 60px;
      top: 120px;
      height: calc(100% - 120px);
      border-top-right-radius: 8px;
    }
    &.right {
      top: 88px;
      bottom: 0;
      border-top-left-radius: 8px;
    }
  }
}
</style>

<style lang="scss">
.organize-modal {
  display: flex;
  align-content: center;
  justify-content: center;
  .ant-modal {
    width: auto !important;
    max-width: none;
    position: static;
    margin: 0;
    padding: 0;
  }
  .ant-modal-content {
    overflow: hidden;
  }
  .ant-modal-body {
    padding: 0 !important;
  }
}
</style>
