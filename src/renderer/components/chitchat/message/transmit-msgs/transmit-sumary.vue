<template>
  <div class="transmit-sumary" @click="$emit('showCombineDetail')">
    <div class="transmit-sumary-content">
      <span
        >[{{
          transpondData.transType === "single-send" ? "逐条转发" : "合并转发"
        }}]</span
      >
      <div
        class="transmit-sumary-content-title-content"
        :title="title"
        v-html="content"
      ></div>
    </div>
    <div class="transmit-sumary-right">
      共{{ transpondData.messageCount }}条
      <i class="icon iconfont icon-jiantou-right"></i>
    </div>
  </div>
</template>
<script>
export default {
  name: "TransmitSumary",
};
</script>
<script setup>
import { computed, defineProps } from "vue";
const props = defineProps(["transpondData"]);
const title = computed(() => {
  if (props.transpondData.nameList.length < 2 || props.transpondData.user) {
    // 群聊或再次转发时显示content
    if (props.transpondData.content) {
      return props.transpondData.content;
    } else if (props.transpondData.nameList.length < 2) {
      return `群${props.transpondData.nameList[0]}的聊天记录`;
    } else {
      return `${props.transpondData.nameList[0]}和${props.transpondData.nameList[1]}的聊天记录`;
    }
  } else {
    return `${props.transpondData.nameList[0]}和我的聊天记录`;
  }
});
const content = computed(() => {
  if (props.transpondData.nameList.length < 2 || props.transpondData.user) {
    // 群聊或再次转发时显示content
    if (props.transpondData.nameList.length < 2) {
      return `群<span>${props.transpondData.nameList[0]}</span>的聊天记录`;
    } else {
      return `<span class='user-name'>${props.transpondData.nameList[0]}</span>和<span class='user-name'>${props.transpondData.nameList[1]}</span>的聊天记录`;
    }
  } else {
    return `<span>${props.transpondData.nameList[0]}</span>和我的聊天记录`;
  }
});
</script>
<style lang="scss">
.transmit-sumary {
  height: 46px;
  width: 100%;
  background: #f3f4f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: MicrosoftYaHei;
  color: #8f959e;
  border-radius: 4px;
  padding: 0 8px;
  cursor: pointer;
  .transmit-sumary-content {
    overflow: hidden;
    margin-right: 3px;
    display: flex;
    flex: 1;
    > span {
      flex-shrink: 0;
    }
    .transmit-sumary-content-title-content {
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
        }
        &.user-name {
          max-width: 60px;
        }
      }
    }
  }
  .transmit-sumary-right {
    flex-shrink: 0;
    .icon-jiantou-right {
      margin: 0;
      &:before {
        font-size: 14px;
      }
    }
  }
  &:hover {
    .transmit-sumary-right {
      color: #3e7eff;
      .icon-jiantou-right {
        color: #3e7eff;
      }
    }
  }
}
</style>
