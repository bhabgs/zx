<!-- 全文检索-聊天记录 -->
<template>
  <div class="search-tab-pane-record">
    <!-- 没有搜索关键词时展示历史搜索 -->
    <local-history
      v-if="!search && showLocalHistory.length && showHistory"
      :showList="showLocalHistory"
      @selectHandle="selectHandle"
      @clearLocal="clearLocal"
      @hideHistory="hideHistory"
    ></local-history>
    <search-filter
      v-if="search && searchResultList.length"
      :filterList="filterList"
      @resetFilter="resetFilterHandle"
      @selectFilter="selectFilterHandle"
    >
      <Dropdown
        placement="bottom-start"
        trigger="click"
        transfer
        transfer-class-name="select-chat-type"
        @on-click="selectChatTypeHandle"
      >
        <span class="active-item search-filter-item">
          {{ curSelectCommand.label
          }}<i class="el-icon-arrow-down el-icon--right"></i>
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
    <ul class="record-search-list" v-if="!!search">
      <li
        class="record-search-item"
        v-for="(item, index) in filterResultList"
        :key="item.suiteId"
      >
        <div class="record-search-item-info">
          与“<span
            class="record-search-item-info-name"
            v-html="item.dialogueName"
          ></span
          >”的聊天记录
          <span class="record-search-item-info-num">{{ item.messageNum }}</span>
        </div>
        <div
          class="record-search-item-info-content"
          v-if="item.searchInfo && item.searchInfo.length"
        >
          <search-record-item
            v-for="record in item.searchInfo"
            :key="record.contentId"
            :record="record"
            @showMessage="
              record =>
                showMessageHandle({
                  ...record,
                  search,
                  contentTime: record.time || item.dialogueTime,
                  dialogueId: item.dialogueId,
                  dialogueType: item.dialogueType
                })
            "
          ></search-record-item>
        </div>
        <div class="record-search-item-info-content" v-else>
          <search-record-item
            :record="item"
            @showMessage="
              record =>
                showMessageHandle({
                  ...record,
                  search,
                  contentTime: item.dialogueTime
                })
            "
          ></search-record-item>
        </div>
        <div
          class="record-item-more"
          v-if="item.hasNextPage"
          @click="getMoreMessageHandle(item, index)"
        >
          查看更多结果
        </div>
      </li>
    </ul>
    <!-- 没有搜索关键词而且没有历史搜索展示缺省页面 -->
    <no-data
      v-if="showNoData || !filterResultList.length"
      :search="search"
      :noSearchResult="!filterResultList.length"
    ></no-data>
  </div>
</template>

<script>
import SearchMixin from "@/mixin/search-mixin";
import { mapGetters } from "vuex";
export default {
  name: "TabPaneRecord",
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
    recordInfo: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      searchResultList: [],
      filterResultList: [],
      commandList: [
        { label: "全部聊天方式", value: "all" },
        { label: "群组", value: "group" },
        { label: "私聊", value: "private" }
      ],
      selectCommand: "all",
      filterList: [
        { label: "仅看“组织”", value: "0", check: false },
        { label: "仅看“外部”", value: "1", check: false }
      ] // 筛选项列表
    };
  },
  mounted() {
    this.setDefaultFilter();
    this.getFilterResult();
  },
  computed: {
    ...mapGetters({
      companyUser: "GetCompany",
      allOrganizationUserIds: "GetAllOrganizationUserIds"
    }),
    showLocalHistory() {
      return this.localHistory.filter(item => item.type === "record");
    },
    curSelectCommand() {
      return this.commandList.find(item => item.value === this.selectCommand);
    }
  },
  watch: {
    recordInfo: {
      handler(newVal, oldVal) {
        let result = [];
        if (this.recordInfo.dialogueData) {
          result = (this.recordInfo.dialogueData.dialogueList || []).map(
            item => {
              return {
                ...item,
                hasNextPage: item.messageNum > 1
              };
            }
          );
        }
        this.searchResultList = [...result];
        this.filterResultList = [...this.searchResultList];
        this.getFilterResult();
      },
      deep: true
    }
  },
  beforeDestroy() {},
  methods: {
    selectChatTypeHandle(command) {
      this.selectCommand = command;
      this.getFilterResult();
    },
    getFilterResult() {
      const result = this.searchResultList.filter(item => {
        let flag = false;
        if (this.selectCommand == "all") {
          flag = true;
        } else {
          flag = item.dialogueType.toLowerCase() === this.selectCommand;
        }
        if (flag) {
          const filter = this.filterList.find(item => item.check);
          if (filter) {
            if (item.dialogueType.toLowerCase() === "group") {
              const groupInfo = this.GroupInfoMap[item.dialogueId];
              const groupType =
                groupInfo && (groupInfo.type || groupInfo.form || 0);
              if (filter.value == "0") {
                flag = groupType < 10;
              } else {
                flag = groupType >= 10;
              }
            } else {
              if (filter.value == "0") {
                flag = this.allOrganizationUserIds.includes(item.dialogueId);
              } else {
                flag = !this.allOrganizationUserIds.includes(item.dialogueId);
              }
            }
          }
        }
        return flag;
      });
      this.filterResultList = [...result];
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
      this.selectCommand = "all";
      this.resetFilter();
      this.getFilterResult();
    },
    async getMoreMessageHandle(record, index) {
      if (record.hasNextPage) {
        try {
          const postData = {
            corpId: this.companyUser.corpId,
            accountId: this.companyUser.accountId,
            id: record.suiteId,
            searchContent: this.search,
            pageNum: record.pageNum || 1,
            pageSize: 10,
            lastContentTime: record.dialogueTime,
            type: 1,
            esSearchTime: this.recordInfo.esSearchTime
          };
          const res = await this.$service.searchRecordList.call(this, postData);
          if (res.code === "M0000" && res.data) {
            if (record.searchInfo && Array.isArray(record.searchInfo)) {
              record.searchInfo.push(...(res.data.searchInfo || []));
              record.pageNum += 1;
              record.hasNextPage = res.data.hasNextPage;
            } else {
              record = {
                ...record,
                ...res.data,
                pageNum: res.data.pageNum + 1
              };
            }
            this.$set(this.filterResultList, index, record);
          } else {
            throw res.msg;
          }
        } catch (error) {
          this.$message.error(error || "获取聊天记录失败！");
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.search-tab-pane-record {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  .record-search-list {
    flex: 1;
    overflow-y: auto;
    .record-search-item {
      border-bottom: 1px solid #e7e7e7;
      .record-search-item-info {
        height: 32px;
        display: flex;
        align-items: center;
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
        &-name {
          color: #1f2329;
        }
        &-num {
          margin-left: 8px;
        }
      }
      .record-search-item-info-content {
        ::v-deep .search-record-item {
          &:nth-last-child(1) {
            &::after {
              height: 0;
            }
          }
        }
      }
      .record-item-more {
        height: 38px;
        border-top: 1px solid #e7e7e7;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #3e7eff;
        display: flex;
        align-items: center;
        cursor: pointer;
      }
    }
  }
}
</style>
