<!-- 全文检索-全部 -->
<template>
  <div class="search-tab-pane-all">
    <!-- 没有搜索关键词时展示历史搜索 -->
    <local-history
      v-if="!search && showLocalHistory.length && showHistory"
      :showList="showLocalHistory"
      @clearLocal="clearLocal"
      @selectHandle="selectHandle"
      @hideHistory="hideHistory"
    ></local-history>
    <div class="all-search-result" v-if="search && hasResult">
      <div
        class="all-search-result-wrapper"
        v-for="item in searchResultList"
        v-show="item.value.length"
        :key="item.type"
      >
        <div class="all-search-result-wrapper-title">{{ item.label }}</div>
        <div class="all-search-result-wrapper-content">
          <component
            class="all-search-result-wrapper-content-item"
            v-for="element in item.value"
            :key="element.id || element.suiteId"
            :record="element"
            :user="element"
            :groupInfo="element"
            :is="item.component"
            @selectHandle="selectHandle"
            @showMessage="
              record =>
                showMessageHandle({
                  ...record,
                  search,
                  contentTime: element.dialogueTime
                })
            "
          ></component>
        </div>
        <div
          class="all-search-result-wrapper-more"
          v-if="item.originValue.length > 3"
          @click.stop="changeTabHandle(item)"
        >
          查看更多（共搜到{{ item.originValue.length }}条）
          <img src="~@/assets/image/search/more.png" alt="" />
        </div>
      </div>
    </div>
    <!-- 没有搜索关键词而且没有历史搜索展示缺省页面 -->
    <no-data
      v-if="
        (!search && !showLocalHistory.length) ||
          (search && !hasResult && !isRequesting)
      "
      :search="search"
      :noSearchResult="!hasResult"
    ></no-data>
  </div>
</template>

<script>
import SearchMixin from "@/mixin/search-mixin";
export default {
  name: "TabPaneAll",
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
    },
    group: {
      type: Array,
      default: () => {
        return [];
      }
    },
    recordInfo: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  mounted() {},
  computed: {
    showLocalHistory() {
      return this.localHistory.slice(0, 12);
    },
    recordList() {
      let result = [];
      if (this.recordInfo.dialogueData) {
        result = this.recordInfo.dialogueData.dialogueList || [];
      }
      return [...result];
    },
    searchResultList() {
      return [
        {
          type: "contact",
          label: "联系人",
          value: [...(this.people || [])].slice(0, 3),
          originValue: [...(this.people || [])],
          component: "SearchContactItem"
        },
        {
          type: "group",
          label: "群组",
          value: [...(this.group || [])].slice(0, 3),
          originValue: [...(this.group || [])],
          component: "SearchGroupItem"
        },
        {
          type: "record",
          label: "聊天记录",
          value: [...(this.recordList || [])].slice(0, 3),
          originValue: [...(this.recordList || [])],
          component: "SearchRecordItem"
        }
      ];
    },
    hasResult() {
      return this.people.length || this.group.length || this.recordList.length;
    }
  },
  watch: {},
  beforeDestroy() {},
  methods: {
    changeTabHandle(tab) {
      this.$emit("changeTabHandle", tab.type);
    }
  }
};
</script>

<style lang="scss" scoped>
.search-tab-pane-all {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 8px;
  .all-search-result {
    flex: 1;
    overflow-y: auto;
    &-wrapper {
      &-title {
        height: 36px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #e7e7e7;
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
      }
      &-more {
        cursor: pointer;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 14px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #3e7eff;
        border-bottom: 1px solid #e7e7e7;
        border-top: 1px solid #e7e7e7;
        img {
          width: 7px;
          height: 12px;
        }
      }
      &-content {
        &-item {
          &:nth-last-child(1) {
            ::v-deep .search-group-item-right {
              border: none;
            }
            ::v-deep.search-contact-item-info {
              border: none;
            }
            &::after {
              height: 0;
            }
          }
        }
      }
    }
  }
}
</style>
