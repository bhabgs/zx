<template>
  <!-- 公司结构 -->
  <div class="company-block" :class="`company-block-${companyType}`">
    <div
      class="company-block-label"
      :class="showCompany.isActive && !showGroup ? 'active-label' : ''"
      :style="{ paddingLeft: `${(showCompany.level) * 16}px` }"
      @click.stop.prevent="selectCompany"
    >
      <img
        :src="
          require(`@/assets/image/contacts/company_${companyType}${showCompany.isActive && !showGroup ? '_active' : ''
            }.png`)
        "
        alt
      />
      <div class="company-block-label-name">
        <div class="company-name" :title="showCompany.label">{{ showCompany.label }}</div>
        <div class="company-pname">{{ showCompany.pname }}</div>
      </div>
      <div class="company-memebr-num" v-if="showCompany.num">{{ showCompany.num }}人</div>
      <mask-icon name="arrow" size="12" color="#D6DCE6" v-if="showArrow" />
    </div>
    <div
      v-show="showType != 'group'"
      class="company-block-content"
      :style="{
        paddingLeft: `${(showCompany.level + 1) * 16}px`,
        height: showCompany.isExpand ? 'auto' : '0px'
      }"
      @click="selectCompany"
    >
      <div class="company-block-dept" v-for="child in showCompany.children" :key="child.id">
        <dept-block
          :showGroup="showGroup"
          :deptInfo="{ ...child, labelType: showCompany.labelType }"
          v-if="child.type == 4"
        ></dept-block>
      </div>
    </div>
  </div>
</template>

<script>
import DeptBlock from "./dept";
import { mapGetters } from "vuex";
export default {
  name: "CompanyBlock",
  components: {
    DeptBlock
  },
  props: {
    companyInfo: {
      type: Object,
      default: () => {
        return {};
      }
    },
    showType: {
      type: String,
      default: "contact"
    },
    contactType: {
      type: String,
      default: "organization"
    },
    showGroup: {
      type: Boolean,
      default: false
    },
    showArrow: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters({
      GetSelectCompanyList: "GetSelectCompanyList"
    }),
    showCompany() {
      return this.companyInfo;
    },
    companyType() {
      const key = this.contactType;
      return key;
    },
    selectCompanyList() {
      return this.GetSelectCompanyList[this.contactType] || [];
    }
  },
  methods: {
    selectCompany() {
      if (this.showType == "group") {
        if (!this.selectCompanyList.includes(this.showCompany.id)) {
          this.$root.$emit("showGroupCompanyDept", {
            ...this.showCompany,
            companyType: this.companyType
          });
        }
      } else {
        if (this.showCompany.level > 0) {
          this.$root.$emit("selectActive", this.showCompany);
        }
      }
    },
    selectAllCompany() {
      if (!this.selectCompanyList.includes(this.showCompany.id)) {
        this.$root.$emit("selectGroupCompany", { ...this.showCompany });
      } else {
        this.$root.$emit("selectGroupCompany", {
          ...this.showCompany,
          isCancel: true
        });
      }
    }
  }
};
</script>

<style lang="scss">
.company-block {
  position: relative;
  &::after {
    position: absolute;
    content: "";
    width: 100%;
    height: 1px;
    background-color: #f4f6f8;
    top: 48px;
    left: 0;
  }
  .company-block-label {
    padding: 12px 16px;
    display: flex;
    gap: 8px;
    align-items: center;
    cursor: pointer;
    img {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
      &.check-company {
        width: 16px;
        height: 16px;
        margin-right: 16px;
        cursor: pointer;
      }
    }
    .company-block-label-name {
      display: flex;
      overflow: hidden;
      .company-name {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 12px;
        font-family: PingFangSC-Semibold, PingFang SC;
        font-weight: 600;
        color: #1f2329;
      }
      .company-pname {
        font-size: 10px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
        margin-top: 4px;
      }
    }
    .company-memebr-num {
      margin-left: auto;
      flex-shrink: 0;
      font-size: 10px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #8f959e;
    }
    &.active-label {
      color: #ffffff !important;
      * {
        color: #ffffff !important;
      }
    }
  }
  .company-block-content {
    padding-left: 16px;
    overflow: hidden;
    transition: all 0.15s ease-in-out;
  }
  &.company-block-organization {
    .company-block-label {
      &.active-label {
        background: linear-gradient(
          90deg,
          rgba(62, 126, 255, 0.8) 0%,
          #3e7eff 100%
        );
      }
    }
  }
  &.company-block-outsource {
    .company-block-label {
      &.active-label {
        background: linear-gradient(
          270deg,
          #36d18e 0%,
          rgba(54, 209, 142, 0.8) 100%
        );
      }
    }
  }
}
</style>
