<template>
  <section class="webhook-box">
    <span>webhook</span>
    <div>
      <div>
        <a-input disabled v-model="hook"></a-input
        ><a-button @click="copyHandle">复制</a-button>
      </div>
      <p>* 请保管好此 Webhook 地址，不要公布在外部网站上，泄露有安全风险</p>
      <p>使用 Webhook 地址，向智信群推送消息</p>
    </div>
  </section>
</template>

<script>
import { clipboard } from "electron";
export default {
  name: "WebHook",
  props: {
    hook: String | undefined
  },
  created() {},
  methods: {
    copyHandle() {
      clipboard.writeText(this.hook);
      this.$message.success("复制成功！");
    }
  }
};
</script>

<style lang="scss" scoped>
$label-height: 34px;
.webhook-box {
  display: flex;
  margin: {
    top: 20px;
  }

  > span {
    width: 100px;
    flex-shrink: 0;
    height: $label-height;
    line-height: $label-height;
  }

  > div {
    > div {
      display: flex;
      align-items: center;

      > button {
        margin: {
          left: 6px;
        }
        padding: 0;
        flex-shrink: 0;
        width: 56px;
        height: $label-height;
        background: #ffffff;
        border-radius: 4px;
        border: 1px solid #4498f0;

        font-size: 14px;
        color: #4498f0;
        line-height: 19px;
      }

      > input {
        height: $label-height;
      }
    }
    > p {
      padding: {
        top: 6px;
      }
      font-size: 12px;
      color: #999999;
      line-height: 16px;
    }
  }
}
</style>
