<template>
  <div
    class="msg-actioncard"
    @click="msgClickOpenUrlHandle(msgContent.messageLink)"
  >
    <div class="actioncard-img-box" v-if="msgContent.imgUrl">
      <img
        :src="msgContent.imgUrl"
        referrerpolicy="no-referrer"
        referrer="no-referrer"
        @load="loadHandle($event)"
        @error="errorHandle($event)"
      />
    </div>
    <div class="actioncard-info" v-if="msgContent.title || msgContent.content">
      <h6
        v-if="msgContent.title"
        v-text="msgContent.title"
        :title="msgContent.title"
      ></h6>
      <p
        v-if="msgContent.content"
        :title="msgContent.content"
        class="whitespace-pre-wrap"
      >
        {{ msgContent.content }}
      </p>
    </div>
    <div
      class="actioncard-button-box"
      v-if="msgContent.btnList && msgContent.btnList.length"
    >
      <button
        v-for="(btn, idx) of msgContent.btnList"
        :key="idx"
        v-text="btn.btnName"
        :title="btn.btnName"
        @click.stop="msgClickOpenUrlHandle(btn.btnLinkUrl)"
      ></button>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import { MessageModel } from "../../../../WebIM";
export default {
  name: "MessageActioncard",
  props: {
    message: { type: Object, default: () => ({}) },
    index: { type: Number }
  },
  data() {
    return {
      isOpen: false
    };
  },
  mounted() {
    if (
      !this.message.bySelf &&
      this.message.sentStatus === MessageModel.SendStatus.SENT
    ) {
      this.$emit("read", [this.message, this.index]); // 发送已读状态
    }
  },
  computed: {
    text() {
      let text = "";
      if (this.message.content) {
        text = this.message.content.poi;
      }
      return text;
    },
    msgContent() {
      let data = {};
      if (this.message.content) {
        data = this.message.content;
      }
      return data;
    }
  },
  watch: {},
  methods: {
    loadHandle() {},
    errorHandle() {},
    msgClickOpenUrlHandle(url) {
      if (this.isOpen) {
        return;
      }
      this.isOpen = true;
      if (url) {
        window.open(url);
      }
      setTimeout(() => {
        this.isOpen = false;
      }, 500);
    }
  }
};
</script>

<style lang="scss" scoped>
.msg-actioncard {
  padding: 0;
  overflow: hidden;
  max-width: 360px;

  .actioncard-img-box {
    width: 100%;
    max-height: 110px;
    overflow: hidden;

    > img {
      width: 100%;
      max-height: 110px;
    }
  }

  .actioncard-info {
    padding: 6px 10px;

    > h6 {
      line-height: 20px;
      font-size: 13px;
      font-weight: bold;
      color: #333333;
      overflow: hidden;
      // text-overflow: ellipsis;
      // -webkit-line-clamp: 2;
      // display: -webkit-box;
      // -webkit-box-orient: vertical;
    }

    > p {
      font-size: 12px;
      color: #999999;
      line-height: 20px;
      overflow: hidden;
      // text-overflow: ellipsis;
      // -webkit-line-clamp: 2;
      // display: -webkit-box;
      // -webkit-box-orient: vertical;
    }
  }

  .actioncard-button-box {
    display: flex;
    flex-direction: column;

    > button {
      padding: 0 15px;
      width: 100%;
      height: 36px;
      line-height: 36px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
      border-top: 1px solid #e7e7e7;
      color: #4498f0;
      font-size: 13px;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}
</style>
