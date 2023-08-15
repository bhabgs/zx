<template>
  <div
    class="flex items-center flex-1 h-full overflow-hidden cursor-pointer"
    @click="handleOperate"
  >
    <span 
      class="flex items-center justify-center flex-shrink-0 w-5 h-5 relative"
    >
      <svg-icon 
        name="action-entry"
        class="w-4 h-4 text-#8F959E flex-shrink-0"
        :class="[unreadNum ? 'text-#FA4141' : '']"
      ></svg-icon>
      <!-- 数字 -->
      <span
        v-if="unreadNum"
        class="absolute -right-1.5 -top-1 z-10 w-3 h-3 text-2.5 leading-3 flex-shrink-0 bg-#FA4141 rounded-full text-center text-white font-normal"
        :class="[unreadNum > 9 ? 'w-4.5 -right-3' : '']"
        >{{ unreadNum > 9 ? "9+" : unreadNum }}</span
      >
      <!-- 圆点 -->
      <span
        v-else-if="!unreadNum && unreadPot"
        class="absolute -right-0.75 -top-0.5 z-10 w-2.5 h-2.5 flex-shrink-0 rounded-full"
        :class="[potclass]"
      ></span>
    </span>
    <!-- 个数 -->
    <span 
      v-if="actionCount"
      class="flex items-end h-full flex-shrink-0 pb-1 mr-0.25"
    >
      <span
        class="flex-shrink-0 text-#8F959E text-3 h-3.5 leading-3.5"
        >{{ actionCount > 99 ? '99+' : actionCount }}</span
      >
    </span>
    <!-- 新动态 -->
    <span 
      v-if="showNew"
      class="ml-4 text-3 h-full text-#8F959E overflow-hidden"
    >
      <span 
        v-if="newMsgInfo"
        class="flex items-center h-full overflow-hidden"
      >
        <span class="flex items-center flex-1 h-full overflow-hidden relative">
          <span ref="titleRef" class="truncate">{{ newMsgInfo }}</span>
          <marquee
            v-show="isMarquee"
            class="z-10 absolute bg-white left-0 top-0 right-0 h-full"
            behavior="scroll" 
            direction="left" 
            loop="-1"
            scrolldelay="300"
            scrollamount="10"
            onmouseover="this.stop()"
            onmouseout="this.start()"
          >
            <span class="flex-1 leading-8">{{ newMsgInfo }}</span>
          </marquee>
        </span>
        <span v-if="ActionCenterUnread.lastAbbreviationType === 1" class="ml-3 flex-shrink-0">有新动态</span>
      </span>
    </span>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { ipcRenderer } from "electron";

export default {
  name: "ActionCenterIcon",
  components: {},
  props: {
    targetId: {
      type: String,
      default: ""
    },
    actionChatType: {
      type: Number,
      default: 2
    },
    showNew: {
      type: Boolean,
      default: false
    },
    actionCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      diffLevel: 2,
      isMarquee: false
    };
  },
  computed: {
    ...mapGetters({
      ActionCenterUnread: "GetActionCenterUnread"
    }),
    unreadNum() {
      return this.Unread.num || 0;
    },
    unreadPot() {
      return this.Unread.pot || 0;
    },
    potclass() {
      const point = this.unreadPot;
      const low = this.diffLevel === 2 ? 10 : 3;
      const high = this.diffLevel === 2 ? 30 : 10;
      if (point > high) {
        return "bg-#FA4141";
      } else if (point <= high && point > low) {
        return "bg-#FEAC00";
      } else if (point <= low) {
        return "bg-#36D18E";
      }
    },
    // 角标
    Unread() {
      let result = {};
      const unreadList = this.ActionCenterUnread && this.ActionCenterUnread.actionCornerMarkList;
      if (Array.isArray(unreadList) && unreadList.length) {
        let num = 0;
        let pot = 0;
        if (this.targetId) {
          const matchItem = unreadList.find((item) => 
            item.groupOrAccountId === this.targetId && item.chatType === this.actionChatType
          );
          if (matchItem) {
            num = matchItem.sourceUnreadNumber || 0;
            pot = matchItem.sourceUnreadPot || 0;
          }
        } else {
          unreadList.forEach((item)=> {
            num += item.sourceUnreadNumber || 0;
            pot += item.sourceUnreadPot || 0
          });
        }
        result = {num, pot};
      }
      // result = {num: 0, pot: 10};
      return result;
    },
    newMsgInfo() {
      return (this.ActionCenterUnread && this.ActionCenterUnread.lastAbbreviationInfo) || "";
    }
  },
  watch: {
    ActionCenterUnread: {
      handler(val) {
        if (val && this.showNew) {
          this.checkTitle();
        }
      },
      deep: true,
      immediate: true
    },
  },
  mounted() {
    if (this.showNew) {
      this.checkTitle();
    }
  },
  methods: {
    checkTitle() {
      this.$nextTick(() => {
        const titleRef = this.$refs.titleRef;
        if (titleRef) {
          this.isMarquee = titleRef.scrollWidth > titleRef.clientWidth;
        }
      });
    },
    handleOperate() {
      this.$emit("select");
    },
    handleNewMsg() {
      if (this.ActionCenterUnread.actionId) {
        const path = `/detail/${this.ActionCenterUnread.actionId}`;
        const query = { type: 'preview' };
        ipcRenderer.invoke('open-operation-page', { to: "operation", data: { path, query } });
      }
    }
  }
};
</script>
