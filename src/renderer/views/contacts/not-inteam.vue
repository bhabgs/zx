<template>
  <div class="not-in-team">
    <img src="@/assets/image/contacts/not_inteam.png" alt />
    <p>成为协会会员 获取更多行业人脉！</p>
    <p class="line-two">快去手机端加人「中国煤炭加工利用协会」吧！</p>
    <el-button type="text" @click="showDialog">会员等级说明</el-button>
    <el-dialog
      title="会员等级说明"
      :visible.sync="dialogVisible"
      :show-close="true"
      @close="closeShowDialog"
      custom-class="vip-level-describe"
    >
      <div class="vip-level-describe-content">
        <div class="vip-level-describe-content-header">
          <img src="~@/assets/visitor/vip-left.png" alt />
          <span>会员权益</span>
          <img src="~@/assets/visitor/vip-right.png" alt />
        </div>
        <div class="vip-level-describe-content-middle">
          <!-- <div
            v-for="item in showTableList"
            :key="item.type"
            :class="`vip-level-describe-item-${item.type}`"
          >
            <div class="vip-level-describe-item-title">{{ item.lable }}</div>
            <div
              class="vip-level-describe-item-factor"
              v-for="ele in item.value"
              :key="ele"
              v-html="ele"
            ></div>
          </div>-->
          <img class="vip-property" :src="vipProperty" alt />
        </div>
        <div class="vip-level-describe-tip">快去手机端升级会员吧！</div>
      </div>
      <span slot="footer" class="dialog-footer"></span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "NotInTeam",
  data() {
    return {
      dialogVisible: false,
      showTableList: [
        {
          lable: "专属特权",
          type: "label",
          value: [
            "名录",
            "行业圈",
            "碳排放计算器",
            "即时通讯<br />消息收纳",
            "组织知识库",
            "协同管理系统",
            "协同业务<br />构建平台",
            "同事圈",
            "好友圈",
            "名录",
            "待办事项"
          ]
        },
        {
          lable: "个人用户",
          type: "person",
          value: [
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `试算`,
            `<img src='${require('@/assets/visitor/has-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`,
            `<img src='${require('@/assets/visitor/no-auth.png')}'>`
          ]
        },
        {
          lable: "普通会员",
          type: "normalVip",
          value: [
            "仅可见自己",
            "浏览",
            "试算",
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-blue.png')}'>`
          ]
        },
        {
          lable: "认证会员",
          type: "registeVip",
          value: [
            "协会行业人脉",
            "浏览+发圈",
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`,
            `<img src='${require('@/assets/visitor/has-auth-yellow.png')}'>`
          ]
        }
      ],
      vipProperty: ""
    }
  },
  mounted() {
    this.getVipProperty();
  },
  methods: {
    async getVipProperty() {
      this.vipProperty = require("@/assets/visitor/vip-property.png");
    },
    showDialog() {
      this.dialogVisible = true
    },
    closeShowDialog() {
      this.dialogVisible = false
    }
  }
};
</script>

<style lang="scss">
.not-in-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fff;
  img {
    width: 130px;
    height: 270px;
  }
  p {
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #5d616b;
    margin-top: 24px;
    &.line-two {
      margin-top: 8px;
    }
  }
}
</style>

<style lang="scss">
.vip-level-describe {
  width: 340px !important;
  height: 490px !important;
  margin-top: calc(50vh - 260px) !important;
  border-radius: 8px !important;
  display: flex;
  flex-direction: column;
  .el-dialog__header {
    height: 48px;
    background: #f4f6f8;
    border-radius: 8px 8px 0 0;
    display: flex;
    align-items: center;
    padding: 0 16px;
    flex-shrink: 0;
    .el-dialog__title {
      color: #5d616b;
    }
    .el-dialog__headerbtn {
      top: 12px;
    }
  }
  .el-dialog__body {
    flex: 1;
    overflow-y: auto;
    padding: 22px;
    .vip-level-describe-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      .vip-level-describe-content-header {
        display: flex;
        align-items: center;
        img {
          width: 28px;
          height: 10px;
          margin: 0 6px;
        }
        span {
          font-size: 16px;
          font-family: PingFangSC-Semibold, PingFang SC;
          font-weight: 600;
          color: #d3af7c;
        }
      }
      .vip-level-describe-content-middle {
        display: flex;
        align-items: center;
        > div {
          width: 74px;
          height: 310px;
          .vip-level-describe-item-title {
            font-size: 12px;
            font-family: PingFangSC-Semibold, PingFang SC;
            color: #5d616b;
            height: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .vip-level-describe-item-factor {
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 10px;
            font-family: PingFangSC-Semibold, PingFang SC;
            color: #8f959e;
            height: 25px;
            line-height: 1.2;
            img {
              width: 14px;
              height: 14px;
            }
          }
          &.vip-level-describe-item-label {
            background: #f6f6f6;
            border-radius: 0px 0px 0px 8px;
            * {
              color: #5d616b;
              font-weight: 600;
            }
          }
          &.vip-level-describe-item-person {
            background: #f0f0f0;
            * {
              color: #8f959e;
            }
          }
          &.vip-level-describe-item-normalVip {
            background: #e2e9f5;
            * {
              color: #436cbe;
            }
          }
          &.vip-level-describe-item-registeVip {
            background: #fef1e0;
            box-shadow: -2px 1px 4px 0px #d9e2f2;
            border-radius: 0px 0px 8px 0px;
            height: 330px;
            .vip-level-describe-item-title {
              height: 42px;
              background: #f5dcb9;
              box-shadow: 0px 1px 5px 0px #d8bf9c;
            }
            * {
              color: #66524a;
            }
          }
        }
        > img {
          width: 308px;
          height: 340px;
        }
      }
      .vip-level-describe-tip {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 15px;
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
      }
    }
  }
  .el-dialog__footer {
    padding: 0;
  }
}
</style>