<template>
  <div class="search-filter">
    <slot></slot>
    <el-popover
      v-if="showCompanyFilter"
      :value="showCompanyPop"
      placement="bottom-start"
      popper-class="search-filter-company"
      width="280"
      trigger="click"
    >
      <div class="search-filter-company-content">
        <el-tabs v-model="activeCompany">
          <el-tab-pane
            v-for="tab in tabList"
            :key="tab.type"
            :label="tab.name"
            :name="tab.type"
          ></el-tab-pane
        ></el-tabs>
        <div class="search-filter-company-content-list">
          <div
            class="search-filter-company-content-list-item"
            v-for="company in showCompanyList"
            :key="company.corpId"
            @click.stop="selectCompanyHandle(company.corpId)"
          >
            <img
              :src="
                require(`@/assets/image/search/${
                  selectCompany.includes(company.corpId) ? 'checked' : 'check'
                }.png`)
              "
              alt=""
            />
            <span class="search-filter-company-content-list-item-name">{{
              company.getCorpName
            }}</span>
          </div>
        </div>
      </div>
      <div
        slot="reference"
        class="search-filter-item"
        :class="selectCompanyList.length ? 'active-item' : ''"
      >
        {{
          selectCompanyList.length
            ? `已选单位+${selectCompanyList.length}`
            : "单位筛选"
        }}
        <img
          :src="
            require(`@/assets/image/search/${
              selectCompanyList.length ? 'blue-down' : 'down'
            }.png`)
          "
          alt=""
        />
      </div>
    </el-popover>
    <div
      v-for="item in filterList"
      :key="item.value"
      class="search-filter-item"
      :class="item.check ? 'active-item' : ''"
      @click.stop="selectFilter(item)"
    >
      {{ item.label }}
    </div>
    <slot name="end"></slot>
    <div
      class="search-filter-reset"
      v-if="showReset"
      @click.stop="resetHandler"
    >
      重置
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "SearchFilter",
  data() {
    return {
      selectCompany: [], // 用户自己选的公司列表
      activeCompany: "all",
      showCompanyPop: false
    };
  },
  props: {
    showCompanyFilter: {
      type: Boolean,
      default: false
    },
    showReset: {
      type: Boolean,
      default: true
    },
    selectCompanyList: {
      type: Array,
      default: () => {
        return [];
      }
    }, // 确定选中的单位列表
    filterList: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  computed: {
    ...mapGetters({
      companyList: "GetAllCompany",
      companyByReleate: "GetCompanyByRelate"
    }),
    orgCompanyList() {
      const outCompanyIdList = this.outCompanyList.map(item => item.corpId);
      return this.companyList.filter(
        item => !outCompanyIdList.includes(item.corpId)
      );
    },
    outCompanyList() {
      return [...(this.companyByReleate.out || [])].concat([
        ...(this.companyByReleate.other || [])
      ]);
    },
    showCompanyList() {
      if (this.activeCompany === "all") {
        return [...this.companyList];
      } else if (this.activeCompany === "org") {
        return [...this.orgCompanyList];
      } else if (this.activeCompany === "out") {
        return [...this.outCompanyList];
      }
    },
    tabList() {
      return [
        {
          name: `全部单位(${this.companyList.length})`,
          type: "all"
        },
        {
          name: `组织单位(${this.orgCompanyList.length})`,
          type: "org"
        },
        {
          name: `外联单位(${this.outCompanyList.length})`,
          type: "out"
        }
      ];
    }
  },
  created() {},
  mounted() {},
  methods: {
    selectFilter(filter) {
      this.$emit("selectFilter", filter);
    },
    resetHandler() {
      this.selectCompany.splice(0);
      this.$emit("resetFilter");
    },
    selectCompanyHandle(id) {
      if (this.selectCompany.includes(id)) {
        this.selectCompany = this.selectCompany.filter(item => item != id);
      } else {
        this.selectCompany.push(id);
      }
      this.$emit("selecCompanyHandle", this.selectCompany);
    }
  }
};
</script>

<style lang="scss">
.search-filter {
  display: flex;
  flex-wrap: wrap;
  padding-top: 18px;
  border-bottom: 1px solid #e7e7e7;
  .search-filter-reset {
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #8f959e;
    margin-left: auto;
    height: 24px;
    line-height: 24px;
    cursor: pointer;
  }
  .search-filter-item {
    height: 24px;
    padding: 0 8px;
    background: #f4f6f8;
    border-radius: 12px;
    cursor: pointer;
    margin-bottom: 18px;
    margin-right: 8px;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #5d616b;
    display: flex;
    align-items: center;
    justify-content: center;
    img {
      width: 10px;
      height: 6px;
      margin-left: 4px;
    }
    &.active-item {
      background: rgba(62, 126, 255, 0.1);
      color: #3e7eff;
    }
  }
}
</style>
<style lang="scss">
@import "~@/assets/styles/constant";
.search-filter-company {
  padding: 0;
  height: 180px;
  .search-filter-company-content {
    width: 100%;
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding-bottom: 16px;
    box-sizing: border-box;
    .el-tabs {
      height: 36px;
      overflow: hidden;
      flex-shrink: 0;
      .el-tabs__header {
        margin-bottom: 0;
      }
      .el-tabs__nav {
        display: flex;
        .el-tabs__active-bar {
          width: 16px !important;
          left: 20px;
        }
        .el-tabs__item {
          padding: 0 13px !important;
          @include flexCenter;
          height: 36px;
          font-size: 12px;
          font-family: PingFangSC-Regular, PingFang SC;
          font-weight: 400;
          color: #5d616b;
          &.is-active {
            color: #3e7eff;
          }
        }
      }
      .el-tabs__content {
        display: none;
      }
    }
    .search-filter-company-content-list {
      flex: 1;
      padding: 16px;
      padding-bottom: 0;
      overflow-y: auto;
      &-item {
        display: flex;
        align-items: center;
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #5d616b;
        cursor: pointer;
        margin-bottom: 16px;
        > img {
          width: 16px;
          height: 16px;
          margin-right: 10px;
        }
      }
    }
  }
}
</style>
