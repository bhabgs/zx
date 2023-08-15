<template>
  <div v-if="showUnknownMsg" class="msg-unknown">
    不支持的消息类型，可在手机上查看
  </div>
  <div
    v-else
    class="msg-applink"
    :class="{ 'preview-only': previewOnly }"
    @click.stop="handleOpen"
  >
    <div class="applink-from">
      <img class="icon" :src="logo" :onerror="`this.src='${defaultIcon}'`" />
      {{ from }}
    </div>
    <div class="applink-header">
      {{ title }}
    </div>
    <div class="applink-info" v-if="content">{{ content }}</div>
  </div>
</template>

<script>
import { ipcRenderer, shell } from "electron";
import { MessageModel } from "../../../../WebIM";
import utils from "../../../../plugin/utils";
import { getHashUrl, fileExists } from "../../../../../modules/utils";
const { MessageType } = MessageModel;
import FileManage from "../../../../plugin/file-manage";
import { mapGetters } from "vuex";
import defaultIcon from "@/assets/applink/app_link_default.png";
import reportIcon from "@/assets/applink/app_link_report.png";
import colleagueIcon from "@/assets/applink/app_link_colleague.png";

export default {
  name: "MessageFile",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number },
    isLoading: { type: Boolean },
    previewOnly: { type: Boolean },
  },
  data() {
    return {
      defaultIcon,
    };
  },
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany",
      GetUser: "GetUser",
      allCompany: "GetAllCompany",
    }),
    LoginCompany() {
      let result = {};
      if (this.net_type == "1") {
        result = this.GetCompany;
      } else if (this.allCompany.length) {
        if (this.GetCompany) {
          result = this.GetCompany;
        } else {
          result = this.allCompany[0];
        }
      }
      return result;
    },
    showUnknownMsg() {
      if (this.message.content) {
        if (this.message.content.linkOwner === "知识库") {
          return true;
        }
      }
      return false;
    },
    logo() {
      if (this.message.content) {
        if (this.message.content.linkType == "1") {
          return reportIcon;
        } else if (this.message.content.linkType == "7") {
          return colleagueIcon;
        }
        return this.message.content.linkLogo;
      }
      return "";
    },
    from() {
      const fromMap = {
        1: "汇报",
        2: "项目报",
        3: "审批",
        4: "请假",
        5: "智文",
        6: "智邮",
        7: "圈子",
      };
      const content = this.message.content;
      if (!content) return "";
      if (content.linkType == "1") {
        return "来自" + content.linkOwner + ":";
      } else if (content.linkType == "7") {
        return "来自圈子:";
      }
      return content.linkOwner || fromMap[content.linkType];
    },
    title() {
      if (this.message.content) {
        if (this.message.content.linkType == "1") {
          return this.message.content.linkPeriod;
        }
        return this.message.content.linkTitle || this.message.content.linkOwner;
      }
      return "";
    },
    content() {
      if (this.message.content) {
        return this.message.content.linkContent;
      }
      return "";
    },
  },
  watch: {},
  methods: {
    formatURL(url) {
      let result = url;
      if (result.includes("userCode=_userCode")) {
        result = result.replace("_userCode", this.userCode);
      } else if (url.includes("?")) {
        result = `${url}&userCode=${this.userCode}`;
      } else {
        result = `${url}?userCode=${this.userCode}`;
      }

      result += `&corpId=${this.LoginCompany.corpId}&netType=${
        this.net_type || 1
      }&clientType=${this.$apipath.clientType}`;
      if (this.option && this.option.id) {
        result += `&appId=${this.option.id}`;
      }

      return result;
    },
    handleOpen() {
      if (this.previewOnly) return;
      const data = {
        corpId: this.LoginCompany.corpId,
      };
      this.$service.getUserCode.call(this, data).then((res) => {
        this.userCode = res.data;
        let format = this.formatURL(this.message.content.linkPath);
        window.open(format);
      });
    },
  },
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.msg-applink {
  display: flex;
  flex-direction: column;
  padding: 16px;
  width: 256px;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  &.preview-only {
    cursor: default;
    background: #f3f4f5;
    border-radius: 4px;
  }

  .applink-from {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #8f959e;
    .icon {
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }
  }

  .applink-header {
    color: #1f2329;
    font-weight: 500;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }
  .applink-info {
    color: #8f959e;
    font-size: 12px;
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    white-space: pre;
  }
}
.msg-unknown {
  user-select: none;
  font-size: 13px;
  padding: 10px 15px;
  max-width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  // white-space: pre-wrap;
  color: #999;
}
</style>
