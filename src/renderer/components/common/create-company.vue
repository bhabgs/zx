<template>
  <el-dialog
    title="创建企业/组织/团队"
    :visible.sync="dialogVisible"
    :before-close="closeHandler"
    :show-close="true"
    custom-class="create-company"
  >
    <div class="create-company-content">
      <div class="create-company-content-item">
        <div class="create-company-content-item-label">企业/团队信息</div>
        <div class="create-company-content-item-value">
          <el-input v-model="formInfo.corpName" placeholder="请填写企业/团队名称"></el-input>
          <el-input v-model="formInfo.num" type="number" :min="0" placeholder="请填写企业/团队人数"></el-input>
        </div>
      </div>
      <div class="create-company-content-item">
        <div class="create-company-content-item-label">备注</div>
        <div class="create-company-content-item-value remark-area">
          <el-input
            placeholder="请填写您的备注"
            v-model="formInfo.content"
            type="textarea"
            :maxlength="200"
            resize="none"
            :autosize="{
              minRows: 6, maxRows: 8
            }"
          ></el-input>
          <div class="total-num">({{ formInfo.content.length }}/200)</div>
        </div>
      </div>
      <div class="message-tip">
        <p>客服电话：400-616-0057</p>
        <p>法定工作日：上午9:00~12:00-下午13:00~17:00</p>
      </div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeHandler" :disabled="isRequesting">取消</el-button>
      <el-button type="primary" @click="confirmHandle" :disabled="isRequesting">提交</el-button>
    </span>
  </el-dialog>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "CreateCompany",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    dialogVisible() {
      return this.visible;
    },
    ...mapGetters({
      GetUser: "GetUser",
    }),
  },
  data() {
    return {
      formInfo: {
        corpName: "",
        num: null,
        content: "",
        channel : "WEBAPP"
      },
      isRequesting: false
    }
  },
  watch: {
    visible(newVal, oldVal) {
      if (newVal) {
        this.formInfo = {
          corpName: "",
          num: null,
          content: ""
        }
      }
    }
  },
  methods: {
    async confirmHandle() {
      try {
        this.isRequesting = true;
        const res = await this.$service.createCorp.call(this, {
          ...this.formInfo
        })
        const h = this.$createElement;
        this.$msgbox({
          title: "",
          message: h("div", null, [
            h('div', { attrs: { class: "create-success-confirm-title" } }, [
              h('img', { attrs: { style: "width:18px;height:18px;margin-right:4px;", src: require('@/assets/visitor/success.png') } }),
              h('span', { style: "font-size: 16px;font-family: PingFangSC-Medium, PingFang SC;font-weight: 500;color: #36D18E;" }, '您的留言发送成功')
            ]),
            h('p', { attrs: { class: "create-success-confirm-content" } }, "您的留言我们已经收到，会有客服与您联系，请保持手机畅通。")
          ]),
          customClass: "create-success-confirm",
          showCancelButton: false,
          showClose: false,
          confirmButtonText: '确定',
        }).then(action => {
          this.$emit("closeCreateCompany");
        });

      } catch (error) {
        console.log(error);
      } finally {
        this.isRequesting = false;
      }
    },
    closeHandler() {
      this.$emit("closeCreateCompany");
    }
  }
}
</script>

<style lang="scss">
.create-company {
  width: 304px !important;
  height: 506px !important;
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
    overflow: auto;
    padding: 0 16px;
    .create-company-content {
      .create-company-content-item {
        .create-company-content-item-label {
          height: 38px;
          display: flex;
          align-items: center;
          font-size: 12px;
          font-family: PingFangSC-Semibold, PingFang SC;
          font-weight: 600;
          color: #1f2329;
        }
        .create-company-content-item-value {
          .el-input__inner {
            width: 100%;
            height: 34px;
            margin-bottom: 8px;
          }
          &.remark-area {
            background: #ffffff;
            border-radius: 4px;
            border: 1px solid #d6dce6;
          }
          .el-textarea__inner {
            border: none;
          }
          .total-num {
            font-size: 12px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            color: #8f959e;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 8px;
            margin-bottom: 8px;
          }
        }
      }
      .message-tip {
        margin-top: 20px;
        p {
          font-size: 12px;
          font-family: PingFangSC-Regular, PingFang SC;
          font-weight: 400;
          color: #8f959e;
          margin-bottom: 7px;
          line-height: 1;
        }
      }
    }
  }
  .el-dialog__footer {
    padding: 0 16px;
    border-top: 1px solid #e7e7e7;
    height: 56px;
    .dialog-footer {
      height: 100%;
      flex-shrink: 0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      border-radius: 0 0 8px 8px;
      .el-button {
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 34px;
        background-color: #fff;
        &.el-button--default:hover {
          color: #3e7eff;
          border-color: #3e7eff;
        }
        &.el-button--primary {
          background-color: #3e7eff;
          border-color: #3e7eff;
          &:hover {
            background-color: #2E6BE6;
            border-color: #2E6BE6;
          }
        }
      }
    }
  }
}
</style>
<style lang="scss">
.create-success-confirm {
  .el-message-box__header {
    padding: 0;
  }
  .el-message-box__content {
    .create-success-confirm-title {
      display: flex;
      align-items: center;
      margin: 20px 0 14px 0;
    }
    .create-success-confirm-content {
      font-size: 14px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #666666;
    }
  }
  .el-message-box__btns {
    .el-button--primary {
      width: 60px;
      height: 34px;
      background: #3e7eff;
      border-radius: 4px;
    }
  }
}
</style>
