<!--
 * 登录日志
-->
<template>
  <section class="login-log">
    <div class="login-log-mask" @click.stop="closeHandler"></div>
    <div class="login-log-body">
      <div class="login-log-body-title">
        登录日志<button
          class="close-button"
          type="button"
          @click.stop="closeHandler"
        ></button>
      </div>
      <div class="login-log-body-content" v-loading="isRequesting">
        <div v-for="log in logList" class="log-item" :key="log.id">
          <div class="device-name">
            <img
              :src="require(`@/assets/image/login/${log.type}.png`)"
              alt=""
            />
            <span>{{ log.deviceName }}</span>
            <p
              v-if="!!log.statusName"
              class="device-status"
              :style="{ color: log.isCurrent ? '#8f959e' : '#3E7EFF' }"
            >
              {{ log.statusName }}
            </p>
          </div>
          <div class="log-info-item">
            <div class="log-info-item-label">设备类型：</div>
            <div class="log-info-item-value">{{ log.deviceType }}</div>
          </div>
          <div class="log-info-item">
            <div class="log-info-item-label">登录时间：</div>
            <div class="log-info-item-value">{{ log.logDate }}</div>
          </div>
          <div class="log-info-item">
            <div class="log-info-item-label">IP地址：</div>
            <div class="log-info-item-value">{{ log.ipAddress }}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import { machineIdSync } from "node-machine-id";
export default {
  data() {
    return {
      logList: [],
      isRequesting: false,
    };
  },
  mounted() {
    this.getLogList();
  },
  methods: {
    closeHandler() {
      this.$emit("close");
    },
    async getLogList() {
      try {
        const deviceID = machineIdSync();
        this.isRequesting = true;
        const res = await this.$service.getLoginDeviceLog();
        this.logList = (res || []).map((item) => {
          return {
            ...item,
            type: item.clientType == "pc" ? "pc" : "mobile",
            deviceType: item.deviceCode,
            logDate: this.$moment(item.loginTime).format("YYYY/MM/DD HH:mm"),
            ipAddress: `${item.loginIp || ""} ${item.location || ""}`,
            status: item.onLineStatus,
            isCurrent: deviceID == item.deviceId,
            statusName:
              deviceID == item.deviceId
                ? "本机"
                : item.onLineStatus == 1
                ? "已登录"
                : "",
          };
        });
      } catch (error) {
        this.$message.error(error.msg || "获取登录日志失败！");
      } finally {
        this.isRequesting = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.login-log {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999;
  &-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
  }
  > * {
    flex-shrink: 0;
  }
  &-body {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 100000;
    width: 340px;
    height: 400px;
    overflow: hidden;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-content: center;
    align-items: center;
    background: #f3f4f5;
    border-radius: 4px;
    box-shadow: 0 0 8px 0 rgba(0, 0, 0, 0.24);
    &-title {
      width: 100%;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #1f2329;
      flex-shrink: 0;
      .close-button {
        position: absolute;
        top: 17px;
        right: 17px;
        width: 16px;
        height: 16px;
        background-image: url("~@/assets/image/close_icon.png");
        background-repeat: no-repeat;
        background-size: 10px 10px;
        background-position: center center;
      }
    }
    &-content {
      flex: 1;
      width: 100%;
      overflow-y: auto;
      background: #fff;
      padding: 0 16px;
      .log-item {
        border-bottom: 1px solid #e7e7e7;
        padding-bottom: 8px;
        > div {
          display: flex;
          align-items: center;
          &.device-name {
            height: 40px;
            font-size: 14px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            color: #1f2329;
            img {
              width: 20px;
              height: 20px;
              margin-right: 8px;
              flex-shrink: 0;
            }
            > span {
              flex: 1;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            .device-status {
              font-size: 12px;
              font-family: PingFangSC-Regular, PingFang SC;
              font-weight: 400;
              margin-left: auto;
            }
          }
          &.log-info-item {
            font-size: 12px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            color: #5d616b;
            margin-bottom: 8px;
          }
        }
      }
    }
  }
}
</style>
