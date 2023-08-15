<!-- 全文检索-群组 -->
<template>
  <div class="search-tab-pane-group">
    <!-- 没有搜索关键词时展示历史搜索 -->
    <local-history
      v-if="!search && showLocalHistory.length && showHistory"
      :showList="showLocalHistory"
      @clearLocal="clearLocal"
      @selectHandle="selectHandle"
      @hideHistory="hideHistory"
    ></local-history>
    <search-filter
      v-if="search && group.length"
      :filterList="filterList"
      :showReset="false"
      @selectFilter="selectFilterHandle"
    >
      <Dropdown
        slot="end"
        placement="bottom-start"
        trigger="click"
        transfer
        transfer-class-name="select-group-type"
        @on-click="selectSortTypeHandle"
      >
        <span class="active-item search-sort-item">
          <img src="@/assets/image/search/sort.png" alt="" />{{
            curSelectCommand.label
          }}
        </span>
        <DropdownMenu slot="list">
          <DropdownItem
            v-for="command in commandList"
            :key="command.value"
            :name="command.value"
            :selected="command.value === selectCommand"
            >{{ command.label }}</DropdownItem
          >
        </DropdownMenu>
      </Dropdown>
    </search-filter>
    <div class="group-search-result" v-if="!!search">
      <search-group-item
        v-for="item in showGroupSearchList"
        :groupInfo="item"
        :key="item.id"
        @selectHandle="selectHandle"
      ></search-group-item>
    </div>
    <!-- 没有搜索关键词而且没有历史搜索展示缺省页面 -->
    <no-data
      v-if="showNoData || !showGroupSearchList.length"
      :search="search"
      :noSearchResult="!showGroupSearchList.length"
    ></no-data>
  </div>
</template>

<script>
import SearchMixin from "@/mixin/search-mixin";
export default {
  name: "TabPaneGroup",
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
    group: {
      type: Array,
      default: () => {
        return [];
      }
    }
  },
  data() {
    return {
      filterList: [
        { label: "组织群", value: "0", check: true },
        { label: "外联群", value: "1", check: false }
      ],
      commandList: [
        { label: "最近活跃", value: "active" },
        { label: "最新创建", value: "create" }
      ],
      selectCommand: "active",
      showGroupSearchList: []
    };
  },
  mounted() {
    this.setDefaultFilter();
  },
  computed: {
    showLocalHistory() {
      return this.localHistory.filter(item => item.type === "group");
    },
    searchResultList() {
      return [...(this.group || [])];
    },
    curSelectCommand() {
      return this.commandList.find(item => item.value === this.selectCommand);
    }
  },
  watch: {
    searchResultList: {
      handler() {
        this.getFilterResult();
      },
      deep: true
    }
  },
  beforeDestroy() {},
  methods: {
    getFilterResult() {
      let result = [...this.searchResultList].filter(item => {
        let flag = true;
        const filter = this.filterList.find(item => item.check);
        if (filter) {
          if (filter.value === "0") {
            // 群组10以下是组织群
            flag = item.type < 10;
          } else {
            flag = item.type >= 10;
          }
        }
        return flag;
      });
      if (this.selectCommand === "active") {
        result = result.sort((a, b) => {
          if (a.message && b.message) {
            return b.message.messageTime - a.message.messageTime;
          } else {
            if (a.message) {
              return -1;
            }
            if (b.message) {
              return 1;
            }
          }
        });
      } else {
        result = result.sort((a, b) => {
          const bCreateTime =
            b.createTime || this.$moment(b.createAt).valueOf();
          const aCreateTime =
            a.createTime || this.$moment(a.createAt).valueOf();
          return bCreateTime - aCreateTime;
        });
      }
      this.showGroupSearchList = [...result];
    },
    selectSortTypeHandle(command) {
      this.selectCommand = command;
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
    }
  }
};
</script>

<style lang="scss" scoped>
.search-tab-pane-group {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  .group-search-result {
    flex: 1;
    overflow-y: auto;
  }
  ::v-deep .ivu-dropdown {
    margin-left: auto;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #8f959e;
    height: 24px;
    display: flex;
    align-items: center;
    .search-sort-item {
      > img {
        width: 16px;
        height: 16px;
      }
    }
  }
}
</style>
