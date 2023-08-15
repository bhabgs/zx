<template>
  <section id="contacts-container">
    <zx-header name="contact"></zx-header>
    <div class="contacts-wrapper">
      <split>
        <contact-list
          slot="left"
          :showGroup="showGroup"
          @changeListType="changeListType"
          @selectGroup="selectGroup"
          @showEmptyCompany="showEmptyCompany"
        ></contact-list>
        <!-- <router-view slot="right"></router-view> -->
        <group-info
          v-if="showGroup"
          slot="right"
          :listType="listType"
        ></group-info>
        <not-in-team
          slot="right"
          v-else-if="!showGroup && !showNoComany && notInPlatform"
        ></not-in-team>
        <no-company
          @showDialog="showDialog"
          slot="right"
          v-else-if="!showGroup && showNoComany"
        ></no-company>
        <dept-info v-else slot="right" :listType="listType"></dept-info>
      </split>
    </div>

    <div class="describe-button" @click="showDialog">
      <img src="~@/assets/visitor/desc.png" alt />
      <span>组织外联说明</span>
    </div>
    <el-dialog
      title="组织/外联说明"
      :visible.sync="dialogVisible"
      :show-close="true"
      @close="closeShowDialog"
      custom-class="org-out-describe"
    >
      <div
        class="describe-list-item"
        :class="[item.needLine ? 'need-line' : '']"
        v-for="item in describeList"
        :key="item.value"
      >
        <div
          class="describe-list-item-label"
          :class="`describe-list-item-label-${item.type}`"
        >
          {{ item.label }}
        </div>
        <div class="describe-list-item-value" v-html="item.value"></div>
      </div>
      <span slot="footer" class="dialog-footer"></span>
    </el-dialog>
  </section>
</template>
<script>
import layouts from "@/components/layouts";
import Split from "@/components/split/split";
import ContactList from "@/views/contacts/contact-list"; // 名录左侧部分
import DeptInfo from "./dept-info";
import GroupInfo from "./group-info";
import NotInTeam from "./not-inteam";
import NoCompany from "./no-company.vue";
import { mapGetters } from "vuex";
export default {
  components: {
    ContactList,
    zxHeader: layouts.zxHeader,
    DeptInfo,
    GroupInfo,
    Split,
    NotInTeam,
    NoCompany
  },
  data() {
    return {
      isGetting: false,
      listType: "organization",
      showGroup: false,
      showNoComany: false,
      dialogVisible: false,
      describeList: [
        {
          type: "org",
          label: "组织关系",
          value:
            "指当前登录用户的入职企业、或与入职企业有集团关系的相关企业及成员的信息名单。<br />包括如：总公司/分公司、母公司/子公司、上级/下级/平级关系企业等。"
        },
        {
          type: "org",
          label: "组织对话",
          value: "指与“组织关系”用户产生的对话。"
        },
        {
          type: "out",
          label: "外联关系",
          value:
            "指与当前登录用户入职企业对应的外部关系企业及成员的信息名单。<br />包括如：登录用户加入的协会机构、服务的公司，作为互联成员可见的互联关系企业、入职企业的公司服务人员等。"
        },
        {
          type: "out",
          label: "外联对话",
          needLine: true,
          value: "指与除了组织成员的一切“外部”关系用户产生的对话。"
        },
        {
          type: "normal",
          label: "群属性",
          value:
            "为了更好的保护用户企业信息及明确区分企业的内外部业务，平台以“组织”“外联”两个属性维度，明确划分了企业内外部信息数据。"
        },
        {
          type: "org",
          label: "组织群",
          value:
            "指在“组织关系”下建立的群组，群组成员不可添加组织关系以外的人员加入。"
        },
        {
          type: "out",
          label: "外联群",
          value:
            "指为进行企业内外的沟通交流，建立的包括组织关系成员、外联关系人员的群组。"
        },
        {
          type: "normal",
          label: "建群",
          value:
            "用户在建群之初，明确出建立的群属性是“组织群”还是“外联群”。<br />选择“组织群”，则仅能选择组织关系的成员，后续也不可添加外联关系成员。<br />选择“外联群”，则可选择组织关系及外联关系的成员。"
        }
      ]
    };
  },
  computed: {
    ...mapGetters(["GetSelectDept"]),
    notInPlatform() {
      let result = false;
      if (this.GetSelectDept.labelType == "0" && this.GetSelectDept.type == 3) {
        // 协会平台且点击公司时如果不在团队中则展示不在团队中页面
        result = !this.GetSelectDept.inTeam;
      }
      return result;
    }
  },
  mounted() {},
  watch: {
    $route: {
      immediate: true,
      handler(to, from) {
        if (
          to.path.includes("/main/contacts/") &&
          (!from || !from.path.includes("/main/contacts/"))
        ) {
          this.updateUserInfo();
        }
      }
    },
    GetSelectDept: {
      immediate: true,
      handler() {
        this.showGroup = false;
        this.showNoComany = false;
      }
    }
  },
  methods: {
    changeListType(listType) {
      this.listType = listType;
    },
    showDialog() {
      this.dialogVisible = true;
    },
    closeShowDialog() {
      this.dialogVisible = false;
    },
    async updateUserInfo() {
      if (this.isGetting) return;
      this.isGetting = true;
      try {
        await this.$service.getUserInfo();
      } catch (e) {}
      this.isGetting = false;
    },
    selectGroup() {
      this.showGroup = true;
      this.showNoComany = false;
    },
    showEmptyCompany() {
      this.showNoComany = true;
      this.showGroup = false;
    }
  }
};
</script>
<style lang="scss" scoped>
#contacts-container {
  display: flex;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  .contacts-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  .describe-button {
    width: 26px;
    height: 26px;
    position: absolute;
    right: 0;
    bottom: 80px;
    background: #3e7eff;
    border-radius: 14px 0px 0px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    cursor: pointer;
    padding-left: 8px;
    transition: all 0.5s ease-out;
    &:hover {
      width: 100px;
    }
    img {
      width: 14px;
      height: 14px;
      margin-right: 4px;
    }
    span {
      white-space: nowrap;
      flex: 1;
      overflow: hidden;
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #ffffff;
    }
  }
}
</style>

<style lang="scss">
.org-out-describe {
  width: 800px !important;
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
    .describe-list-item {
      padding-bottom: 8px;
      &-label {
        height: 38px;
        font-size: 14px;
        font-family: PingFangSC-Semibold, PingFang SC;
        font-weight: 600;
        color: #1f2329;
        display: flex;
        align-items: center;
        position: relative;
        &.describe-list-item-label-org,
        &.describe-list-item-label-out {
          padding-left: 10px;
          &::after {
            content: "";
            height: 14px;
            position: absolute;
            left: 0;
            top: 14px;
            width: 2px;
          }
        }
        &.describe-list-item-label-org {
          color: #3e7eff;
          &::after {
            background-color: #3e7eff;
          }
        }
        &.describe-list-item-label-out {
          &::after {
            background-color: #36d18e;
          }
          color: #36d18e;
        }
      }
      &-value {
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #666666;
      }
      &.need-line {
        border-bottom: 1px solid #e7e7e7;
      }
    }
  }
  .el-dialog__footer {
    padding: 0;
  }
}
</style>
