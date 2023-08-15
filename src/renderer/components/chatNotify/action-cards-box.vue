<template>
  <div 
    class="flex flex-col w-full h-full relative"
    :style="{ 
      background: '#EAFAF3'
    }"
  >
    <div class="absolute top-12px left-12px right-12px flex items-center justify-between flex-shrink-0 h-22px">
      <span class="flex items-center flex-shrink-0 h-full">
        <span class="w-4px h-14px rounded-sm bg-primary"></span>
        <span class="text-14px text-#1F2329 leading-normal font-semibold ml-4px">{{ chatName }} 行动中心</span>
      </span>
      <span 
        class="w-5 h-5 flex items-center justify-center cursor-pointer" 
        @click="handleClose"
      >
        <svg-icon 
          name="action-close"
          class="w-4 h-4 text-#8F959E"
        ></svg-icon>
      </span>
    </div>
    <iframe
      ref="iframeEl"
      scrolling="no"
      class="border-none flex-1 overflow-hidden pt-32px"
      :src="iframeURL"
    />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  name: "ActionCardsBox",
  components: {},
  props: {
    chatName: {
      type: String,
      default: "智信"
    },
    targetId: {
      type: String,
      default: ""
    },
    actionChatType: {
      type: Number,
      default: 2
    }
  },
  data() {
    return {
      iframeURL: ""
    };
  },
  computed: {
    ...mapGetters({GetCompany: "GetCompany"}),
  },
  watch: {},
  mounted() {
    let params = "";
    if (this.targetId) {
      const type = this.actionChatType === 1 ? 'group' : 'chat';
      params = `/${type}/${this.targetId}`;
    }
    this.iframeURL = `${process.env.APP_ACTIONCENTER}/zx/chatcard${params}?corpId=${this.GetCompany.corpId}`;
    console.log('this.iframeURL = ', this.iframeURL);
    // 监听收消息的通知
    window.eventHub.$on("refreshActionList", this.refreshActionChatCard);
  },
  beforeDestroy() {
    window.eventHub.$off("refreshActionList", this.refreshActionChatCard);
  },
  methods: {
    // 刷新iframe数据
    refreshActionChatCard(cmdMsg) {
      if (cmdMsg) {
        const data = JSON.parse(cmdMsg);
        if (data && typeof data === "object" && Array.isArray(data.sourceIdList)) {
          const sourceIdList = data.sourceIdList;
          // 获取 sourceId
          let sourceId = this.targetId;
          if (this.actionChatType !== 1) {
            sourceId = [this.GetCompany.accountId, this.targetId].sort().join("_");
          }
          if (sourceIdList.includes(sourceId)) {
            // 通知iFrame
            const iframeEl = this.$refs.iframeEl;
            if (iframeEl) {
              const host = `${process.env.APP_ACTIONCENTER}/zx/chatcard`;
              let message = { source: 'zx-pc' };
              message = JSON.stringify(message);
              iframeEl.contentWindow && iframeEl.contentWindow.postMessage(message, host);
            }
          }
        }
      }
    },
    handleClose() {
      this.$emit("close");
    }
  }
};
</script>

<style lang="scss" scoped>
.action-cards-box {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
}
</style>
