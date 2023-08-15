<template>
  <el-dialog
    title="创建群聊"
    :visible.sync="dialogVisible"
    :before-close="closeHandler"
    :show-close="false"
    custom-class="create-group-type"
  >
    <div class="create-group-type-title" slot="title">
      <p>发起群聊</p>
      <img
        src="@/assets/image/contacts/close_dialog.png"
        @click="closeHandler"
        alt=""
      />
    </div>
    <p>请选择您要创建的群属性</p>
    <div class="create-group-type-content">
      <div
        class="create-group-type-block"
        v-for="item in typeList"
        :key="item.type"
        :style="{
          backgroundImage: `url(${
            canCreateOrgGroup || item.type == 'outsource'
              ? item.bg
              : canNotCreateBg
          })`
        }"
      >
        <div class="create-group-type-block-header">
          <img
            :src="
              require(`@/assets/image/contacts/${
                canCreateOrgGroup || item.type == 'outsource'
                  ? item.logo
                  : 'no_group'
              }.png`)
            "
            alt=""
          />
          <span
            :style="{
              color:
                canCreateOrgGroup || item.type == 'outsource'
                  ? '#FFFFFF'
                  : '#8F959E'
            }"
            >{{ item.title }}</span
          >
        </div>
        <p
          :style="{
            color:
              canCreateOrgGroup || item.type == 'outsource'
                ? '#FFFFFF'
                : '#8F959E'
          }"
        >
          {{ item.label }}
        </p>
        <el-button
          :disabled="item.type == 'organization' && !canCreateOrgGroup"
          :class="[
            `create-button-${item.type}`,
            canCreateOrgGroup || item.type == 'outsource' ? '' : 'disabled'
          ]"
          @click="createGroup(item)"
          >创建群聊</el-button
        >
      </div>
    </div>
    <div class="no-tip" v-show="!canCreateOrgGroup">
      *您还未加入任何组织，建议您去手机端加入，再创建组织群
    </div>
    <div slot="footer" class="create-group-type-footer"></div>
  </el-dialog>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "CreateGroupType",
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
      GetDirectlyCompany: "GetDirectlyCompany"
    }),
    canCreateOrgGroup() {
      return this.GetDirectlyCompany.length > 0;
    }
  },
  data() {
    return {
      canNotCreateBg: require("@/assets/image/contacts/no_type.png"),
      typeList: [
        {
          bg: require("@/assets/image/contacts/org_type.png"),
          logo: "org_group",
          title: "组织群",
          label: "可选择入职企业、集团公司的人员加入群聊",
          type: "organization"
        },
        {
          bg: require("@/assets/image/contacts/out_type.png"),
          logo: "out_group",
          title: "外联群",
          label: "可选择非内部组织关系的人员加入群聊",
          type: "outsource"
        }
      ]
    };
  },
  methods: {
    closeHandler() {
      this.$emit("closeCreate");
    },
    createGroup(item) {
      if (this.canCreateOrgGroup || item.type == "outsource") {
        this.$emit("closeCreate", item);
      } else {
        this.$message.info("请先创建或加入组织！");
      }
    }
  }
};
</script>

<style lang="scss">
.create-group-type {
  width: 680px !important;
  height: 318px !important;
  transform: translate(0, 50%);
  margin-top: unset !important;
  border-radius: 8px !important;
  display: flex;
  flex-direction: column;
  .el-dialog__header {
    padding: 0;
    height: 48px;
    background: #f4f6f8;
    border-radius: 8px 8px 0px 0px;
    .create-group-type-title {
      display: flex;
      height: 100%;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      font-size: 16px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #5d616b;
      img {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
    }
  }
  .el-dialog__body {
    flex: 1;
    padding: 0 52px;
    p {
      height: 54px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 14px;
      font-family: MicrosoftYaHeiUI;
      color: #8f959e;
    }
    .create-group-type-content {
      display: flex;
      .create-group-type-block {
        width: 260px;
        height: 166px;
        background-size: 100% 100%;
        background-position: center;
        background-repeat: no-repeat;
        display: flex;
        flex-direction: column;
        align-items: center;
        .create-group-type-block-header {
          display: flex;
          font-size: 20px;
          font-family: PingFangSC-Semibold, PingFang SC;
          font-weight: 600;
          color: #ffffff;
          margin-top: 20px;
          img {
            width: 32px;
            height: 32px;
            margin-right: 8px;
          }
        }
        p {
          line-height: 1;
          margin: 20px 0;
          font-size: 12px;
          font-family: PingFangSC-Regular, PingFang SC;
          font-weight: 400;
          color: #ffffff;
          height: auto;
        }
        .el-button {
          padding: 0;
          width: 88px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #fff;
          border-color: transparent;
          &.create-button-organization {
            color: #3e7eff;
          }
          &.create-button-outsource {
            color: #36d18e;
            // &:active {
            //   border-color: #36d18e;
            // }
          }
          &.disabled {
            background: #c9cfd8;
            color: #ffffff;
          }
        }
        &:nth-child(1) {
          margin-right: 56px;
        }
      }
    }
    .no-tip {
      margin-top: 16px;
      font-size: 10px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #ea5858;
    }
  }
  .el-dialog__footer {
    padding: 0;
  }
}
</style>
