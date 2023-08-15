<template>
  <div class="w-full h-full flex flex-col relative">
    <div 
      class="flex items-center justify-between flex-shrink-0 h-10 px-3"
      :style="{ 
        background: stickyBgColor ? stickyBgColor : '#D2E1FF',
      }"
      >
      <span class="text-3.5 text-#1F2329 font-semibold">{{ chatName }} 行动中心</span>
      <span 
        class="w-5 h-5 flex items-center justify-center cursor-pointer" 
        @click="handleClose"
      >
        <svg-icon 
          name="action-close"
          class="w-4 h-4 text-#1F2329"
        ></svg-icon>
      </span>
    </div>
    <div class="flex-1 overflow-hidden relative" v-loading="loading">
      <iframe 
        ref="iframeEl"
        scrolling="no"
        class="absolute w-full h-full left-0 top-0 border-none overflow-hidden"
        :src="iframeURL"
      />
      <!-- [calc(100%+15px)] -->
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import SvgIcon from '../common/svg-icon.vue';
export default {
  name: "ActionCenterList",
  components: {SvgIcon},
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
    },
    stickyBgColor: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      loading: true,
      iframeURL: ""
    };
  },
  computed: {
    ...mapGetters({GetCompany: "GetCompany"}),
  },
  mounted() {
    let params = "";
    if (this.targetId) {
      const type = this.actionChatType === 1 ? 'group' : 'chat';
      params = `/${type}/${this.targetId}`;
    }
    this.iframeURL = `${process.env.APP_ACTIONCENTER}/zx/home${params}?corpId=${this.GetCompany.corpId}`;
    console.log('this.iframeURL = ', this.iframeURL);
    // 监听收消息的通知
    window.eventHub.$on("refreshActionList", this.refreshActionHomeList);
    // 监听收消息的通知
    window.eventHub.$on("acStateChanged", this.acStateChanged);
  },
  beforeDestroy() {
    window.eventHub.$off("refreshActionList", this.refreshActionHomeList);
    window.eventHub.$off("acStateChanged", this.acStateChanged);
  },
  methods: {
    handleClose() {
      this.$emit("close");
    },
    // 刷新iframe数据
    refreshActionHomeList() {
      const iframeEl = this.$refs.iframeEl;
      if (iframeEl) {
        const host = `${process.env.APP_ACTIONCENTER}/zx/home`;
        let message = { source: 'zx-pc' };
        message = JSON.stringify(message);
        iframeEl.contentWindow && iframeEl.contentWindow.postMessage(message, host);
      }
    },
    // 监听行动中心回传数据
    acStateChanged(data) {
      if (data) {
        // 关闭loading
        if (data.closeLoading) {
          this.loading = false;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.bg-gradient {
  background: linear-gradient(180deg, #D2E1FF 0%, #F4F6F8 100%);
}
</style>




