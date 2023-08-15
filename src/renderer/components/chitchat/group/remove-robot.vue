<template>
  <a-button class="remove-robot-box" type="link" @click="removeHandle"
    >移除群助手</a-button
  >
</template>

<script>
import { Modal } from "ant-design-vue";
export default {
  name: "RemoveRobot",
  props: {
    type: {
      type: String,
      default: "link"
    },
    robot: Object
  },
  created() {},
  methods: {
    async removeHandle() {
      const self = this;
      const { robot, $service, $message } = this;
      let isSubmit = false;
      const modal = Modal.confirm({
        title: "提示",
        closable: false,
        centered: true,
        content: "确定要移除这个群助手吗？",
        icon: h =>
          h("a-icon", {
            props: { type: "exclamation-circle", theme: "filled" }
          }),
        okText: "移除",
        cancelText: "取消",
        width: 400,
        onOk() {
          return new Promise((resolve, reject) => {
            modal.update({
              keyboard: false,
              okButtonProps: {
                disabled: true,
                loading: true
              },
              cancelButtonProps: {
                disabled: true
              }
            });
            isSubmit = true;

            $service
              .removeRobot({
                chatGroupID: robot.groupId,
                chatAccountId: robot.chatAccountId
              })
              .then(() => {
                $message.success(`群助手 ${robot.chatRobotName} 移除成功`);
                self.$emit("del-robot");
              })
              .catch(e => {
                console.error(e);
              })
              .finally(() => {
                isSubmit = false;
                setTimeout(() => {
                  modal.destroy();
                }, 300);
              });
          });
        },
        onCancel: () =>
          new Promise((resolve, reject) => {
            if (!isSubmit) {
              resolve();
            }
          })
      });
    }
  }
};
</script>

<style lang="scss" scoped>
$--button-color: #ea5858;
$--button-bg: url(~@/assets/image/delete_icon.png) no-repeat 0 center/14px 14px;
.remove-robot-box {
  padding: 0;
  height: 20px;
  line-height: 18px;
  text-indent: 10px;
  font-size: 14px;
  color: $--button-color;
  background: $--button-bg;

  &:hover,
  &:focus {
    color: $--button-color;
    background: $--button-bg;
    opacity: 0.8;
  }
}
</style>
