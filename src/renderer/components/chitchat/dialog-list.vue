<template>
  <div class="dialog-list" :class="dialogType">
    <ul class="dialog-container">
      <li
        class="dialog-item"
        v-for="(row, index) in ConversationSort"
        :key="`${row.conversationType}_${row.id}`"
        :title="row.name"
        @click="selectDialog(row, index)"
        @contextmenu.prevent="contextmenuHandle($event, row)"
        :class="{
          'is-selected':
            row.id === OpenDialog.id &&
            row.conversationType === OpenDialog.conversationType,
          'is-top': row.istop
        }"
      >
        <div v-if="row.istop" class="top-sign"></div>
        <user-photo
          class="avatar-box"
          :user="row"
          v-if="row.conversationType === IMConversationEnum.PRIVATE"
        ></user-photo>
        <group-photo
          class="avatar-box"
          :group="row"
          v-if="row.conversationType === IMConversationEnum.GROUP"
        ></group-photo>
        <div class="msg-container">
          <div class="msg-container-left">
            <p class="item-name only-line">{{ row.name }}</p>
            <group-sign
              v-if="row.conversationType === IMConversationEnum.GROUP"
              :type="row.groupType"
            ></group-sign>
            <p
              class="item-time only-line"
              :class="{
                current: $myUtils.isCurrentDay(row.message.messageTime)
              }"
              v-if="row.message && row.message.content"
            >
              {{ $myUtils.formatDateFilter(row.message.messageTime, 2) }}
            </p>
          </div>
          <div class="msg-container-right">
            <div class="msg-info-wrapper">
              <message-info
                :key="
                  `${row.conversationType}_${row.id}_${row.message.messageTime}`
                "
                v-if="row.message"
                :info="row"
              ></message-info>
            </div>
            <div v-if="row.isStar || row.isHint" class="set-top-sign">
              <i v-if="row.isStar" class="star-sign iconfont icon-xingbiao"></i>
              <i v-if="row.isHint" class="iconfont icon-xiaoximiandarao"></i>
            </div>
          </div>
        </div>
        <div class="hint-badge-container">
          <Badge
            v-if="row.reminderNumber"
            class="hint-sign"
            :class="{
              scale: row.conversationType === IMConversationEnum.PRIVATE,
              'low-color': getHintType(row.reminderNumber) == 1,
              'mid-color': getHintType(row.reminderNumber) == 2,
              'hot-color': getHintType(row.reminderNumber) == 3
            }"
            :count="row.reminderNumber"
            :dot="row.isHint"
          ></Badge>
        </div>
      </li>
    </ul>
    <transition name="fade" mode="out-in">
      <ul
        class="menu-box"
        ref="dialogMenu"
        :style="`top: ${top}px; left: ${left}px; visibility: ${IsShow?'visible':'hidden'}`"
      >
        <li
          class="menu-item"
          @click.stop="selectMenuHandle({ type: 1, data: contextMenuData })"
        >
          <button>{{ contextMenuData.istop ? "取消置顶" : "置顶会话" }}</button>
        </li>
        <li
          class="menu-item"
          v-if="contextMenuData.conversationType === IMConversationEnum.GROUP"
          @click.stop="selectMenuHandle({ type: 2, data: contextMenuData })"
        >
          <button>
            {{ contextMenuData.isHint ? "取消免打扰" : "免打扰" }}
          </button>
        </li>
        <li
          v-if="false && contextMenuData.isgroup"
          class="menu-item"
          @click.stop="selectMenuHandle({ type: 2, data: contextMenuData })"
        >
          <button>群设置</button>
        </li>
        <li
          class="menu-item"
          @click.stop="selectMenuHandle({ type: 3, data: contextMenuData })"
        >
          <button>删除会话</button>
        </li>
        <li
          v-if="false"
          class="menu-item"
          @click.stop="selectMenuHandle({ type: 4, data: contextMenuData })"
        >
          <button>添加新成员</button>
        </li>
        <li
          class="menu-item"
          @click.stop="selectMenuHandle({ type: 5, data: contextMenuData })"
        >
          <button>清空聊天记录</button>
        </li>
      </ul>
    </transition>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel, IMSDKServer } from "../../WebIM";
import globalConfig from "@/global.config";
import messageInfo from "./dialog/message-info";

const robot = globalConfig.robot;

export default {
  name: "DialogList",
  components: { messageInfo },
  data() {
    return {
      MessageModel,
      ConversationModel,
      IMConversationEnum: ConversationModel.IMConversationEnum,
      MessageType: MessageModel.MessageType,
      contextMenuData: {},
      top: 0,
      left: 0,
      IsShow: false,
      dialogMenuHeight: 200,
      isLoadingNextDialog: false // 是否正在加载下一页
    };
  },
  mounted() {
    window.addEventListener("click", this.closeContextMenu);
    window.addEventListener("resize", this.closeContextMenu);
    window.eventHub.$on("open-dialog", this.openConverHandle);
    let watchConver = this.$watch("ConversationSort", () => {
      watchConver();
      this.$nextTick(() => {
        if (this.ConversationSort.length) {
          setTimeout(() => {
            this.selectDialog(this.ConversationSort[0], 0);
          }, 300);
        }
      });
    });
    window.eventHub.$on("send-hander", this.changeConversationScrollView);
  },
  activated(){
    this.changeConversationScrollView();
  },
  beforeDestroy() {
    window.eventHub.$off("open-dialog", this.openConverHandle);
    window.removeEventListener("click", this.closeContextMenu);
    window.removeEventListener("resize", this.closeContextMenu);
    window.eventHub.$off("send-hander", this.changeConversationScrollView);
  },
  computed: {
    ...mapGetters({
      TopMap: "GetTopMap",
      AtMsgMap: "GetAtMsgMap",
      GetCompany: "GetCompany",
      AllUserMap: "GetAllUserMap",
      GetConversationSort: "GetConversationSort",
      dialogType: "GetChitchatType",
      OpenDialog: "GetOpenDialog"
    }),
    ConversationSort() {
      let result = [];
      if (this.dialogType === "organization") {
        result = this.GetConversationSort.organizationList || [];
      } else {
        result = this.GetConversationSort.outsourceList || [];
      }
      return result;
    },
    AtMeMsgMap() {
      let result = {};
      for (const key in this.AtMsgMap) {
        const item = this.AtMsgMap[key];
        if (item.includes(this.GetCompany.accountId)) {
          result[key] = true;
        }
      }

      return result;
    }
  },
  watch: {
    ConversationSort: {
      deep: false,
      handler(val, old) {
        if (val.length !== old.length) {
          this.changeConversationScrollView();
        }
      }
    },
    OpenDialog: {
      deep: true,
      handler(val, old) {
        if (val.id !== old.id) {
          this.changeConversationScrollView();
        }
      }
    }
  },
  methods: {
    ...mapActions([
      "SetOpenDialog",
      "DeleteDialog",
      "ClearDialogMessage",
      "ChangeNoMoreMsg"
    ]),
    getHintType(num) {
      return this.$myUtils.getHintType(num);
    },
    openConverHandle({ id }) {
      for (let i = 0; i < this.ConversationSort.length; i++) {
        let conver = this.ConversationSort[i];
        if (conver.id === id) {
          this.selectDialog(conver, i);
          break;
        }
      }
    },
    selectDialog(item, index) {
      if (
        item.id !== this.OpenDialog.id ||
        item.conversationType !== this.OpenDialog.conversationType
      ) {
        const data = {
          ...item,
          groupType: this.dialogType === "outsource" ? 10 : 0
        };
        this.SetOpenDialog({
          ...data
        });
        try {
          IMSDKServer.clearConversitionUnreadCount(
            data.conversationType,
            data.id
          );
        } catch (error) {}
      }
    },
    selectMenuHandle({ type, data }) {
      let onOff = null;
      switch (type) {
        case 1:
          // 置顶设置
          if (data.istop) {
            onOff = 2; // 取消
          } else {
            onOff = 1; // 添加
          }
          this.setDialogAtte(data, 1, onOff);
          data.id === this.OpenDialog.id && this.changeConversationScrollView();
          break;
        case 2:
          // 免打扰设置
          if (data.isHint) {
            onOff = 2; // 取消
          } else {
            onOff = 1; // 添加
          }
          this.setDialogAtte(data, 2, onOff);
          break;
        case 3:
          // 删除会话
          this.deleteDialog(data);
          this.ChangeNoMoreMsg({
            data: data.id,
            action: "del",
            conversationType: data.conversationType
          });
          break;
        case 4:
          break;
        case 5: // 清空聊天记录
          this.ClearDialogMessage({ ...data, clearLatest: true });
          this.ChangeNoMoreMsg({
            data: data.id,
            action: "del",
            conversationType: data.conversationType
          });
          data.id === this.OpenDialog.id && this.changeConversationScrollView();
          break;

        default:
          break;
      }
      this.closeContextMenu();
      window.eventHub.$emit("native-click");
    },
    setDialogAtte(data, operateType, onOff) {
      this.$service.setGroupAttribute.call(this, {
        beId: data.id,
        conversationType: data.conversationType,
        operateType,
        onOff
      });
    },
    deleteDialog(data) {
      this.DeleteDialog({ data });
    },
    contextmenuHandle(e, data) {
      this.IsShow = false;
      this.contextMenuData = data;
      setTimeout(()=>{
        if (this.$refs.dialogMenu) {
          this.dialogMenuHeight =
            this.$refs.dialogMenu.clientHeight || this.dialogMenuHeight;
        }
        const xEvent = e.clientX;
        const yEvent = e.clientY;
        const winY = window.innerHeight;
        this.top = yEvent;
        this.left = xEvent;
        if (yEvent + this.dialogMenuHeight > winY) {
          this.top = yEvent - this.dialogMenuHeight;
        }
        this.IsShow = true;
      },200)
      

    },
    closeContextMenu() {
      this.IsShow = false;
      this.contextMenuData = {};
    },
    limit(array) {
      if (array) {
        return array.slice(0, 4);
      }
      return array;
    },
    changeConversationScrollView() {
      this.$nextTick(() => {
        const activeDom = document.querySelector(".is-selected");
        activeDom && activeDom.scrollIntoViewIfNeeded(false);
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.dialog-list {
  width: 100%;
  height: 100%;
  overflow: hidden auto;
  user-select: none;
  .dialog-container {
    width: 100%;
    .dialog-item {
      position: relative;
      display: flex;
      align-items: center;
      padding: {
        left: 5px;
        right: 10px;
      }
      width: 100%;
      height: 60px;
      background-color: #fff;
      transition: 0.1s linear;
      &:hover {
        cursor: pointer;
        background-color: $--menu-hover-bgcolor;
      }

      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 0;
        border-bottom: 1px solid #e7e7e7;
      }

      &.is-selected {
        // @include menu-select-style;
        color: #fff;
        &.is-top {
          .top-sign {
            display: none;
          }
        }
        .item-name,
        .item-time,
        .msg-info-box {
          color: #fff !important;
        }
        .msg-info-box {
          ::v-deep * {
            color: #fff !important;
          }
        }
      }

      &.is-top {
        // background-color: #f5f8fc;
        position: relative;
        .top-sign {
          position: absolute;
          width: 12px;
          height: 12px;
          top: 2px;
          right: 2px;
          // background-image: url("~@/assets/image/top-sign-in.png");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          // > div {
          //   width: 90%;
          //   height: 90%;
          //   border-radius: 11px 0 0;
          //   background: #fff;
          //   position: absolute;
          //   right: 0;
          //   bottom: 0;
          // }
        }
      }

      .star-sign {
        width: 12px;
        height: 12px;
        font-size: 12px;
        flex: 0 0 12px;
        color: #ffbe00;
      }
      .avatar-box {
        margin: {
          right: 10px;
          left: 5px;
        }
        width: 40px;
        height: 40px;
        flex-basis: 40px;
        flex-shrink: 0;
        border-radius: 100%;
        overflow: hidden;
      }
      .msg-container {
        width: calc(100% - 84px);
        // height: 100%;
        flex: 1 1 calc(100% - 84px);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        font-size: 14px;
        overflow: hidden;
        line-height: 1;
        .msg-container-left {
          margin-bottom: 9px;
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          .item-name {
            // display: flex;
            align-items: center;
            color: #000;
            font-size: 14px;
            font-weight: 500;
            line-height: 1;
            margin-right: 6px;
          }
          .group-sign {
            margin: 0 6px;
          }
          .item-time {
            margin-left: auto;
            flex-shrink: 0;
            height: 15px;
            line-height: 15px;
            max-width: 120px;
            white-space: nowrap;
            font-size: 12px;
            color: #bbb;
          }
        }
        .msg-container-right {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 16px;

          .msg-info-wrapper {
            flex: 1;
            overflow: hidden;
          }
          .iconfont {
            font-size: 12px;
          }
          .set-top-sign {
            color: #bbb;
          }
        }
      }

      .hint-badge-container {
        position: absolute;
        left: 40px;
        top: 6px;
        font-size: 0;
        .ivu-badge {
          line-height: 0;
          font-size: 0;
        }
        .hint-sign {
          ::v-deep .ivu-badge-dot {
            top: 3px;
            right: -15px;
          }
        }
      }
    }
  }

  .menu-box {
    position: fixed;
    z-index: 999;
    width: 150px;
    background: rgba(255, 255, 255, 1);
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    > li:not(:last-of-type) {
      border-bottom: 1px solid #e7e7e7;
    }
    .menu-item {
      width: 100%;
      height: 48px;
      > button {
        width: 100%;
        height: 48px;
        background-color: transparent;
        transition: background-color 0.15s linear;
        font-size: 14px;
        color: #000;
        &:hover {
          background-color: $--menu-hover-bgcolor;
        }
      }
    }
  }
  ::v-deep .at-user {
    color: #f74c31;
  }
  &.organization {
    .is-selected {
      background: linear-gradient(
        90deg,
        rgba(62, 126, 255, 0.8) 0%,
        #3e7eff 100%
      );
    }
    .is-top {
      .top-sign {
        // background: #3e7eff;
        background-image: url("~@/assets/image/top-sign-in.png");
      }
    }
    .item-time {
      &.current {
        color: #3e7eff !important;
      }
    }
  }
  &.outsource {
    .is-selected {
      background: linear-gradient(
        270deg,
        #36d18e 0%,
        rgba(54, 209, 142, 0.8) 100%
      );
    }
    .is-top {
      .top-sign {
        // background: #36d18e;
        background-image: url("~@/assets/image/top-sign-out.png");
      }
    }
    .item-time {
      &.current {
        color: #36d18e !important;
      }
    }
  }
}
</style>
