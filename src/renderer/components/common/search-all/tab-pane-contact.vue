<!-- 全文检索-联系人 -->
<template>
  <div class="search-tab-pane-contact">
    <!-- 没有搜索关键词时展示历史搜索 -->
    <local-history
      v-if="!search && showLocalHistory.length && showHistory"
      :showList="showLocalHistory"
      @selectHandle="selectHandle"
      @clearLocal="clearLocal"
      @hideHistory="hideHistory"
    ></local-history>
    <search-filter
      v-if="search && people.length"
      :showCompanyFilter="true"
      :selectCompanyList="selectCompanyList"
      :filterList="filterList"
      @resetFilter="resetFilterHandle"
      @selecCompanyHandle="selecCompanyHandle"
      @selectFilter="selectFilterHandle"
    ></search-filter>
    <!-- 没有搜索关键词而且没有历史搜索展示缺省页面 -->
    <div class="people-search-result" v-if="!!search">
      <search-contact-item
        v-for="item in searchResultList"
        :user="item"
        :key="item.id"
        @selectHandle="selectHandle"
      ></search-contact-item>
    </div>
    <no-data
      v-if="showNoData"
      :search="search"
      :noSearchResult="!searchResultList.length"
    ></no-data>
  </div>
</template>

<script>
import SearchMixin from "@/mixin/search-mixin";
export default {
  name: "TabPaneContact",
  mixins: [SearchMixin],
  props: {
    localHistory: {
      type: Array,
      default: () => {
        return [];
      }
    },
    search: {
      type: String,
      default: ""
    },
    people: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  data() {
    return {
      selectCompanyList: [], // 选中的单位列表
      filterList: [
        { label: "组织成员", value: "0", check: false },
        { label: "外联成员", value: "1", check: false }
      ], // 筛选项列表
      searchResultList: [] // 搜索联系人结果
    };
  },
  mounted() {
    this.setDefaultFilter();
  },
  computed: {
    showLocalHistory() {
      return this.localHistory.filter(
        item => item.type === "contact" || item.type === "robot"
      );
    }
  },
  watch: {
    people: {
      handler(newVal, oldVal) {
        this.searchResultList = [...(newVal || [])];
        this.getFilterResult();
      },
      deep: true,
      immediate: true
    }
  },
  beforeDestroy() {},
  methods: {
    getFilterResult() {
      const result = this.people.filter(people => {
        let flag = false;
        if (this.selectCompanyList.length) {
          // 如果存在单位筛选则判断所选单位和人员单位是否存在交集
          if (people.corpUsers) {
            const peopleCompany = people.corpUsers.map(item => item.corpId);
            if (
              peopleCompany.some(corp => this.selectCompanyList.includes(corp))
            ) {
              flag = true;
            }
          }
        } else {
          // 没有单位筛选则判断为TRUE
          flag = true;
        }
        console.log("AllOrganizationUserIds", this.AllOrganizationUserIds);
        if (flag) {
          const filter = this.filterList.find(item => item.check);
          if (filter) {
            if (filter.value == "0") {
              // 机器人放在组织里
              flag =
                this.AllOrganizationUserIds.includes(people.accountId) ||
                people.accountId.includes("robot_");
            } else {
              flag =
                !this.AllOrganizationUserIds.includes(people.accountId) &&
                !people.accountId.includes("robot_");
            }
          }
        }
        return flag;
      });
      this.searchResultList = [...result];
    },
    selecCompanyHandle(selectCompany) {
      this.selectCompanyList = [...selectCompany];
      this.getFilterResult();
    },
    selectFilterHandle(filter) {
      const index = this.filterList.findIndex(
        item => item.value === filter.value
      );
      const check = !this.filterList[index].check;
      this.filterList = this.filterList.map(item => {
        return {
          ...item,
          check: false
        };
      });
      this.$set(this.filterList, index, {
        ...this.filterList[index],
        check
      });
      this.getFilterResult();
    },
    resetFilterHandle() {
      this.selectCompanyList.splice(0);
      this.resetFilter();
      this.getFilterResult();
    }
  }
};
</script>

<style lang="scss" scoped>
.search-tab-pane-contact {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  .people-search-result {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
