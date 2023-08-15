<template>
  <div
    class="zx-combine-msg"
    @click="$showCombineMsg({ ...message.content, origin: message })"
  >
    <div class="zx-combine-msg-title" :title="title" v-html="content"></div>
    <div class="zx-combine-msg-content">
      <div
        v-for="(item, index) in message.content.summaryList"
        :key="item + index"
      >
        {{ item }}
      </div>
    </div>
    <div class="zx-combine-msg-footer">聊天记录</div>
  </div>
</template>
<script>
export default {
  name: "MessageCombine",
};
</script>
<script setup>
import { computed, defineProps } from "vue";
// import { showCombineMsg } from "@/components/popwin";
const props = defineProps(["message"]);
const content = computed(() => {
  if (props.message.content.nameList.length < 2) {
    return `群<span style="font-weight:bold;">${props.message.content.nameList[0]}</span>的聊天记录`;
  } else {
    return `<span class='user-name' style="font-weight:bold;">${props.message.content.nameList[0]}</span>和<span class='user-name' style="font-weight:bold;">${props.message.content.nameList[1]}</span>的聊天记录`;
  }
});
const title = computed(() => {
  if (props.message.content.content) {
    return props.message.content.content;
  } else if (props.message.content.nameList.length < 2) {
    return `群${props.message.content.nameList[0]}的聊天记录`;
  } else {
    return `${props.message.content.nameList[0]}和${props.message.content.nameList[1]}的聊天记录`;
  }
});
</script>
<style lang="scss">
.zx-combine-msg {
  width: 244px;
  cursor: pointer;
  background: #fff;
  &-title {
    height: 30px;
    padding: 0 16px;
    line-height: 30px;
    font-size: 14px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #1f2329;
    overflow: hidden;
    display: flex;
    width: fit-content;
    max-width: 100%;
    > * {
      flex-shrink: 0;
    }
    > span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      &:nth-last-child(1) {
        flex: 1;
        margin: 0 3px;
      }
      &:nth-child(1) {
        margin-right: 3px;
      }
      &.user-name {
        max-width: 60px;
      }
    }
  }
  &-content {
    max-height: 54px;
    overflow: hidden;
    font-size: 12px;
    padding: 0 16px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #8f959e;
    margin-bottom: 10px;
    > div {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  &-footer {
    display: flex;
    align-items: center;
    border-top: 1px solid #e7e7e7;
    height: 27px;
    padding: 0 16px;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #5d616b;
  }
}
</style>
