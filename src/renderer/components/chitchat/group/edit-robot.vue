<template>
  <section>
    <a-modal
      v-model="modalVisible"
      wrapClassName="mt-ant-design-modal-wrap"
      dialogClass="mt-ant-design-modal-dialog"
      title="自定义助手"
      cancelText="取消"
      okText="确定"
      :centered="true"
      :footer="status === 2 ? null : undefined"
      forceRender
      :confirmLoading="isSubmit"
      :ok-button-props="{
        props: {
          disabled: disabledModalButton.cancel
        }
      }"
      :cancel-button-props="{ props: { disabled: disabledModalButton.submit } }"
      @cancel="cancelHandle"
      @ok="okHandle"
    >
      <div class="robot-edit-body">
        <div class="edit-robot-avatar">
          <img
            v-show="robotResult.chatRobotImage"
            :src="robotResult.chatRobotImage"
            alt=""
          />
        </div>
        <template v-if="status === 1">
          <ul class="robot-base-info-box">
            <li
              v-for="row of robotInfo"
              :key="row.key"
              class="edit-robot-split-box"
            >
              <span class="robot-split-box-left label-text"
                >{{ row.label }}<i v-show="row.require">*</i></span
              >
              <a-input
                class="robot-split-box-right"
                :disabled="row.disabled"
                :placeholder="row.placeholder"
                :maxLength="row.maxLength"
                :allowClear="row.allowClear"
                v-model.trim="row.value"
              ></a-input>
            </li>
          </ul>
          <div class="webhook-wrapper" v-if="editType === 2">
            <webhook :hook="robotResult.webHookUrl"></webhook>
          </div>
          <div class="edit-robot-split-box safety-setting-box">
            <span class="robot-split-box-left label-text"
              >安全设置<i>*</i></span
            >
            <div class="robot-split-box-right safety-setting-body">
              <div v-for="row of safetySettingOpt" :key="row.key">
                <a-tooltip placement="topLeft" :mouseEnterDelay="0.3">
                  <template slot="title" v-if="row.tip">{{ row.tip }}</template>
                  <a-checkbox
                    :checked="checkBoxVal[row.key]"
                    @change="
                      e => {
                        checkBoxVal[row.key] = e.target.checked;
                      }
                    "
                    >{{ row.label }}</a-checkbox
                  >
                </a-tooltip>
                <div
                  class="safety-setting-edit-box"
                  v-show="checkBoxVal[row.key]"
                >
                  <ul v-if="row.type === 'mult'">
                    <li
                      v-for="(item, index) of row.value"
                      :key="row.key + index"
                    >
                      <a-input
                        :disabled="row.disabled"
                        :placeholder="row.placeholder"
                        :maxLength="row.maxLength"
                        v-model="item.text"
                        allowClear
                      ></a-input
                      ><span
                        class="close-icon"
                        v-show="row.value.length !== 1"
                        @click="deleteHandle(row, index)"
                        ><a-icon type="close-circle" theme="filled"
                      /></span>
                    </li>
                    <li v-show="row.value.length < 10">
                      <a-button
                        class="add-button"
                        type="link"
                        @click="addHandle(row)"
                        ><a-icon type="plus-circle" />{{
                          row.key === "keyword" ? "添加关键词" : "添加地址"
                        }}</a-button
                      >
                      <span class="descripe-text">(最多添加10个)</span>
                    </li>
                  </ul>
                  <ul v-if="row.key === 'sign'">
                    <li><a-input disabled v-model="row.value"></a-input></li>
                    <li class="descripe-text">点击上方密钥即可复制</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <!-- 机器人条款暂时取消 -->
          <!-- <div class="robot-protocol" v-if="editType === 1">
            <a-checkbox
              :checked="checkBoxVal.protocol"
              @change="
                e => {
                  checkBoxVal.protocol = e.target.checked;
                }
              "
            ></a-checkbox>
            <span>我已阅读并同意</span>
            <a-button type="link">《自定义群助手服务及免责条款》</a-button>
          </div> -->
          <div class="robot-edit-operate-wrapper" v-if="editType === 2">
            <remove-robot
              :robot="{ groupId: group.id, ...robot }"
              type="link"
              @del-robot="
                {
                  $emit('remove-robot');
                  modalVisible = false;
                }
              "
            ></remove-robot>
          </div>
        </template>
        <div v-if="status === 2" class="robot-edit-success-box">
          <p>1.添加机器人</p>
          <div>
            <p>2.设置webhook，点击设置说明查看如何配置以使机器人生效</p>
            <webhook :hook="robotResult.webHookUrl"></webhook>
          </div>
        </div>
      </div>
      <div
        v-if="status === 2"
        class="robot-edit-success-footer ant-modal-footer"
      >
        <a-button @click="finishCreateHandle">完成</a-button>
      </div>
    </a-modal>
  </section>
</template>

<script>
import webhook from "./webhook";
import RemoveRobot from "./remove-robot";
import { message } from "ant-design-vue";

export default {
  name: "EditRobot",
  components: { webhook, RemoveRobot },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    group: Object,
    editType: Number, // 编辑类型，1--新建，2--再次编辑
    robot: Object // 需要编辑的机器人信息
  },
  data() {
    return {
      robotInfo: [
        {
          label: "群助手名称",
          key: "name",
          require: true,
          value: "",
          maxLength: 20,
          allowClear: true,
          originKey: "chatRobotName",
          placeholder: "请输入(限20字以内)",
          warn: "名称不能为空"
        },
        {
          label: "添加到群组",
          key: "group",
          require: true,
          value: "",
          disabled: true
        },
        {
          label: "回调地址",
          key: "url",
          require: false,
          value: "",
          originKey: "serviceAddress",
          allowClear: true
        }
      ], // 机器人基本信息
      checkBoxVal: {
        keyword: false,
        // sign: false,
        ip: false
        // protocol: false
      }, // 机器人复选框相关
      safetySettingOpt: [
        {
          label: "自定义关键词",
          key: "keyword",
          tip: "设定后，只有包含关键词的消息内容才会被正常发送",
          originKey: "chatRobotKeyWord",
          originEnableKey: "keywordEnable",
          type: "mult",
          warn: "请填写关键词",
          value: [{ text: "" }],
          maxLength: 10,
          placeholder: "请输入(限10字以内)",
          repeat: false // 能否重复
        },
        // {
        //   label: "加签",
        //   key: "sign",
        //   tip: "",
        //   originKey: "chatRobotsecret",
        //   type: "sign",
        //   value: ""
        // },
        {
          label: "IP地址",
          key: "ip",
          tip: "设定后，只有来自IP地址范围内的请求才会被正常处理",
          originKey: "chatRobotIp",
          originEnableKey: "ipEnable",
          type: "mult",
          warn: "请填写IP地址",
          value: [{ text: "" }],
          reg: /^[\d\w\.]+$/i,
          repeat: true
        }
      ], // 机器人安全设置
      isSubmit: false, // 是否正在提交
      status: 1, // 修改状态，1--编辑，2--提交成功
      modalVisible: false,
      robotResult: {} // 创建成功后后台返回信息
    };
  },
  created() {},
  mounted() {
    const { robotInfo, group, robot, editType } = this;
    for (const item of robotInfo) {
      if (item.key === "group") {
        this.$set(item, "value", group.name);
        break;
      }
      if (item.key === "name" && editType === 2) {
        this.$set(item, "value", robot.chatRobotName);
      }
      if (item.key === "url" && editType === 2) {
        this.$set(item, "value", robot.serviceAddress);
      }
    }
    if (editType === 2) {
      // 再次编辑处理数据
      console.log(robot);
      this.robotResult.chatRobotImage = robot.chatRobotImage;
      this.getRomoteRobotInfo();
    }
    this.$nextTick(() => {
      this.modalVisible = true;
    });
  },
  destroyed() {},
  computed: {
    disabledModalButton() {
      let result = { cacel: false, submit: false };
      if (this.isSubmit) {
        result = { cacel: true, submit: true };
      }
      return result;
    }
  },
  watch: {
    modalVisible(val) {
      if (!val) {
        setTimeout(() => {
          this.$emit("update:visible", false);
        }, 300);
      }
    }
  },
  methods: {
    deleteHandle(row, index) {
      row.value.splice(index, 1);
    },
    addHandle(row) {
      if (row.value.length < 10) {
        row.value.push({ text: "" });
      }
    },
    async okHandle() {
      message.destroy();
      const { robotInfo, checkBoxVal, safetySettingOpt, $service } = this;
      console.log(robotInfo, checkBoxVal, safetySettingOpt);
      let flag = true;
      let data = {
        chatGroupID: this.group.id
      };

      // 处理基本信息
      for (const info of robotInfo) {
        if (info.require && info.originKey && !info.value) {
          this.$message.warning(info.warn);
          flag = false;
          return;
        }
        if (info.key === "name") {
          let alreadyRobotName = (this.group.groupRobots || []).every(
            (robot, index) => {
              let a =
                robot.chatRobotName === info.value &&
                (this.editType === 1 ||
                  robot.chatAccountId !== this.robot.chatAccountId);
              return !a;
            }
          );

          if (!alreadyRobotName) {
            this.$message.warning("机器人昵称已占用，请修改");
            return;
          }
        }
        if (info.originKey && info.value) {
          data[info.originKey] = info.value;
        }
      }

      // 处理安全设置
      let safetyData = this.disposeSafetySetting();
      if (!safetyData || !safetyData.flag) {
        return;
      }

      data = {
        ...data,
        ...safetyData.data
      };

      this.isSubmit = true;
      console.log(data);
      try {
        if (this.editType === 2) {
          // 编辑
          data.chatAccountId = this.robot.chatAccountId;
          let result = await $service.updateRobot(data);
          this.modalVisible = false;
        } else if (this.editType === 1) {
          // 新建
          let result = await $service.craeteRobot(data);
          this.robotResult = result;
          this.status = 2;
        }
        this.$emit("update-group");
      } catch (error) {
        console.error(error);
      }
      setTimeout(() => {
        this.isSubmit = false;
      }, 200);
    },
    /**
     * 处理安全配置参数
     */
    disposeSafetySetting() {
      const { safetySettingOpt, checkBoxVal } = this;
      let flag = false;
      let data = {};
      Object.entries(checkBoxVal);
      let isSelect = false;
      Object.keys(checkBoxVal).forEach(key => {
        if (checkBoxVal[key]) {
          flag = true;
        }
      });
      if (!flag) {
        this.$message.warning("请设置安全配置");
        return { flag, data };
      }
      for (const item of safetySettingOpt) {
        if (checkBoxVal[item.key]) {
          flag = true;
          let a = item.value.find(row => !row.text.trim());
          if (a) {
            flag = false;
            this.$message.warning(item.warn);
            return;
          }
          if (item.reg) {
            a = item.value.find(row => !item.reg.test(row.text));
            if (a) {
              this.$message.warning(`${a.text} 格式不正确`);
              flag = false;
              return;
            }
          }
          let valueList = item.value.map(row => row.text);

          if (!item.repeat) {
            // 不允许重复，进行重复项判断处理
            let result = valueList.every((text, index, arr) => {
              let flag = arr.lastIndexOf(text) === index;
              !flag && this.$message.warning(`配置项 ${text} 重复`);
              return flag;
            });

            if (!result) {
              flag = false;
              return;
            }
          }
          data[item.originKey] = JSON.stringify(
            item.value.map(row => row.text)
          );
          data[item.originEnableKey] = true;
        } else {
          data[item.originEnableKey] = false;
        }
      }

      return { flag, data };
    },
    cancelHandle() {},
    finishCreateHandle() {
      this.modalVisible = false;
    },
    async getRomoteRobotInfo() {
      try {
        let result = await this.$service.getRobotInfo({
          robotAccountId: this.robot.chatAccountId
        });
        console.log(result);
        this.robotResult = result;
        this.disposeRemoteRobotInfo(result);
      } catch (e) {
        console.error(e);
      }
    },
    /**
     * 处理远程获取的机器人详情信息
     */
    disposeRemoteRobotInfo(info) {
      // 处理安全设置数据
      let ipValue = null,
        keywordValue = null;
      for (const item of this.robotInfo) {
        if (item.key === "name") {
          this.$set(item, "value", info.chatRobotName);
        }
        if (item.key === "url") {
          this.$set(item, "value", info.serviceAddress);
        }
      }
      if (info.chatRobotIp && info.ipEnable) {
        this.$set(this.checkBoxVal, "ip", true);
        ipValue = JSON.parse(info.chatRobotIp);
        ipValue = ipValue.map(item => ({ text: item }));
      }
      if (info.chatRobotKeyWord && info.keywordEnable) {
        this.$set(this.checkBoxVal, "keyword", true);
        keywordValue = JSON.parse(info.chatRobotKeyWord);
        keywordValue = keywordValue.map(item => ({ text: item }));
      }
      this.safetySettingOpt.forEach(item => {
        switch (item.key) {
          case "keyword":
            keywordValue && this.$set(item, "value", keywordValue);
            break;
          case "ip":
            ipValue && this.$set(item, "value", ipValue);
            break;
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.robot-edit-body {
  padding: 20px 40px;
  overflow: hidden scroll;
  height: 400px;
  color: #000000;

  .edit-robot-split-box {
    display: flex;
    align-items: center;

    > .robot-split-box-left {
      flex-shrink: 0;
      width: 100px;
      padding: {
        right: 18px;
      }
    }
    > .robot-split-box-right {
      flex: 1;
    }
  }

  .label-text {
    text-align: right;
    font-size: 14px;
    color: #000000;
    line-height: 19px;

    > i {
      padding: {
        top: 4px;
      }
      font-size: 22px;
      color: #da3f3f;
      font-style: normal;
      display: inline-block;
      font-style: normal;
      vertical-align: middle;
    }
  }

  .robot-base-info-box {
    margin: {
      top: 32px;
      bottom: 20px;
    }

    > li {
      margin-bottom: 5px;
    }
  }

  .edit-robot-avatar {
    text-align: center;
    > img {
      width: 60px;
      height: 60px;
      border-radius: 50%;
    }
  }

  .safety-setting-box {
    padding: 20px 0;
    border: 1px solid #e7e7e7 {
      left: 0;
      right: 0;
    }

    > span {
      align-self: flex-start;
    }

    > div {
      > div {
        &:not(:last-of-type) {
          margin: {
            bottom: 20px;
          }
        }
      }
    }
  }

  .robot-protocol {
    margin: {
      top: 20px;
    }
    > button {
      padding: 0;
      height: 20px;
    }
  }

  .safety-setting-edit-box {
    > ul {
      margin: {
        top: 15px;
      }
      > li {
        display: flex;
        align-items: center;

        &:not(:first-of-type) {
          margin: {
            top: 5px;
          }
        }

        &:last-of-type {
          margin: {
            top: 10px;
          }
        }

        > input {
          width: 300px;
          margin: {
            right: 5px;
            top: 5px;
          }
        }

        > button {
          padding: 0;
          font-size: 14px;
        }
      }
    }

    .add-button {
      margin-right: 5px;
      height: 20px;
    }

    .descripe-text {
      font-size: 12px;
      font-family: MicrosoftYaHei;
      color: #999999;
      line-height: 16px;
    }

    .close-icon {
      margin: 5px;
      flex-shrink: 0;
      font-size: 15px;
      color: #e94b3f;
      cursor: pointer;
      line-height: 1;
    }
  }

  .robot-edit-success-box {
    > p:first-of-type {
      padding: {
        top: 40px;
        bottom: 20px;
      }
      border-bottom: 1px solid #e7e7e7;
    }

    > div:first-of-type {
      padding: 20px 0;
    }
  }

  .webhook-wrapper {
    padding: {
      bottom: 20px;
    }
    border-top: 1px solid #e7e7e7;
  }

  .robot-edit-success-footer {
    position: absolute;
    bottom: 0;
    width: 100%;
  }

  .robot-edit-operate-wrapper {
    margin-top: 20px;
  }
}
</style>
