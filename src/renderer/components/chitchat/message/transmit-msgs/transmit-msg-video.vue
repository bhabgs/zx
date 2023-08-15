<template>
  <div class="transmit-msg-video">
    <img :src="thumbnailUrl" alt="" srcset="" />
    <i class="play-btn iconfont icon-play-circle" @click="playVideo()"></i>
  </div>
</template>
<script setup>
import { ipcRenderer } from "electron";
import { MessageModel } from "../../../../WebIM";
import utils from "../../../../plugin/utils";
import { computed, defineProps } from "vue";
const { MessageType } = MessageModel;
const props = defineProps({
  message: {
    type: Object,
    default: () => {},
  },
});
const thumbnailUrl = computed(() => {
  let url = "";
  if (props.message.content) {
    url = `data:image/jpeg;base64,${props.message.content.thumbnailImage}`;
  }
  return url;
});
const url = computed(() => {
  let url = "";
  if (props.message.content) {
    url = props.message.content.videoUrl;
  }
  return url;
});
const isEncrypt = computed(() => {
  const isEncrypt = [MessageType.ZXEncryptVideoMsg].includes(
    props.message.messageType
  );
  return isEncrypt;
});
const playVideo = () => {
  const { messageTime: time, content } = props.message;
  let { name: title, size } = content;
  size = utils.getFileSize(size);
  const data = {
    type: "video",
    list: [
      {
        title,
        time,
        url: url.value,
        isEncrypt: isEncrypt.value,
        describe: [size],
        isPub: false,
        thumb: thumbnailUrl.value,
      },
    ],
  };
  ipcRenderer.invoke("show-media", data);
};
</script>
<style lang="scss">
.transmit-msg-video {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  img {
    max-width: 100%;
    max-height: 100%;
    filter: blur(3px);
  }
  .play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 50px;
    color: #fff;
    cursor: pointer;
    &:hover {
      color: #eee;
    }
  }
}
</style>
