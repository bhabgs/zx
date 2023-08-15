<template>
  <section class="select-dialog">
    <div class="select-left">
      <div class="select-result">
        <Tag
          v-for="(item, n) in selectData"
          :key="n"
          closable
          @on-close="tagCloseHandle(item)"
          >{{ item.name }}</Tag
        >
        <div class="search-container">
          <input
            v-model="searchVal"
            type="text"
            placeholder="搜索联系人、群组"
            @focus="inputFocusHandle"
            @blur="inputBlurHandle"
          />
        </div>
      </div>
      <search-result
        :visible="IsSearch"
        class="search-result"
        :search="searchVal"
        @selectresult="selectSearchHandle"
      ></search-result>
    </div>
    <div class="select-right">
      <h5 class="last-contacts-title">最近联系人</h5>
      <ul class="last-contacts" ref="lastcontacts">
        <li
          v-for="(row, key) in ConversationSort.all"
          :key="key"
          class="contact-item"
          @click="selectDialogHandle(row)"
        >
          <user-photo
            :class="{ 'is-selected': selectMap[row.id] }"
            class="iconfont select-icon"
            :user="row"
            v-if="
              row.conversationType ===
                ConversationModel.IMConversationEnum.PRIVATE
            "
          ></user-photo>
          <group-photo
            :class="{ 'is-selected': selectMap[row.id] }"
            class="iconfont select-icon"
            :group="row"
            v-if="
              row.conversationType ===
                ConversationModel.IMConversationEnum.GROUP
            "
          ></group-photo>
          <div class="content-info">
            <p class="item-name only-line">{{ row.name }}</p>
            <group-sign :type="row.groupType"></group-sign>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script>
import { mapGetters } from "vuex";
import { ConversationModel } from "@/WebIM";

export default {
  name: "SelectDialog",
  props: { value: {}, VisibleState: {} },
  data() {
    return {
      ConversationModel,
      IsSearch: false,
      searchVal: "",
      selectData: [],
      selectMap: {}
    };
  },
  created() {},
  mounted() {},
  beforeDestroy() {},
  computed: {
    ...mapGetters({ ConversationSort: "GetConversationSort" })
  },
  watch: {
    selectData(val) {
      this.$emit("input", [...val]);
    },
    VisibleState(val) {
      if (val) {
        this.resetData();
      }
    }
  },
  methods: {
    inputFocusHandle() {
      this.IsSearch = true;
    },
    inputBlurHandle() {
      this.IsSearch = false;
    },
    selectSearchHandle(item) {
      let dialogue = null,
        converType = null,
        id = "";
      if (item.isgroup) {
        converType = ConversationModel.IMConversationEnum.GROUP;
        id = item.id;
      } else {
        converType = ConversationModel.IMConversationEnum.PRIVATE;
        id = item.accountId;
      }
      dialogue = new ConversationModel.IMConversation(
        {
          id,
          avatar: item.avatar,
          name: item.name,
          creator: item.creator,
          createAt: item.createAt,
          count: item.groupNumber
        },
        converType
      );
      this.selectDialogHandle(dialogue);
      this.searchVal = "";
      this.IsSearch = true;
    },
    tagCloseHandle(data) {
      this.selectDialogHandle(data);
    },
    selectDialogHandle(item) {
      if (this.selectMap[item.id]) {
        for (let i = 0; i < this.selectData.length; i++) {
          const dialog = this.selectData[i];
          if (dialog.id === item.id) {
            this.selectData.splice(i, 1);
            break;
          }
        }
        this.$delete(this.selectMap, item.id);
      } else {
        this.selectData.push(item);
        this.$set(this.selectMap, item.id, true);
      }
    },
    resetData() {
      this.selectData.splice(0);
      this.selectMap = {};
      this.searchVal = "";
      this.IsSearch = false;
      this.$nextTick(() => {
        let box = this.$refs.lastcontacts;
        if (box) {
          box.scrollTop = 0;
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.select-dialog {
  height: 350px;
  display: flex;
  overflow: hidden;
  .select-left,
  .select-right {
    height: 350px;
  }
  .select-left {
    overflow-y: auto;
    position: relative;
    padding: 15px;
    flex: 0 0 60%;
    width: 60%;
    border-right: 1px solid #eee;
    .select-result {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: flex-start;
      .ivu-tag {
        height: 32px;
        line-height: 32px;
        margin: 0 6px 6px 0;
      }
    }
    .search-container {
      width: 110px;
      height: 32px;
      > input {
        padding: 5px;
        width: 100%;
        height: 100%;
        border: 1px solid #eee;
        border-radius: 4px;
      }
    }
    .search-result {
      position: absolute;
      margin-top: 15px;
      width: calc(100% - 30px);
      height: 250px;
      border-radius: 4px;
      border: 1px solid #eee;
    }
  }
  .select-right {
    flex: 0 0 40%;
    width: 40%;
    overflow: hidden;
    .last-contacts-title {
      padding: 0 20px;
      height: 40px;
      line-height: 40px;
      font-size: 14px;
      font-weight: 500;
    }
    .last-contacts {
      width: 100%;
      height: 310px;
      overflow: hidden auto;
      > li {
        padding: 10px 0;
        display: flex;
        align-items: center;
        cursor: pointer;
        border-bottom: 1px solid #f4f5f6;
        transition: background-color 0.2s linear;
        &:first-of-type {
          border-top: 1px solid #f4f5f6;
        }
        &:hover {
          background-color: #f4f5f6;
        }
      }

      .content-info {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        user-select: none;
      }
    }
  }

  /* 选中状态 */
  .select-icon {
    position: relative;
    &::after {
      opacity: 0;
      content: "\e674";
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba($color: #000, $alpha: 0.65);
      font-size: 16px;
      color: #fefefe;
      transition: opacity 0.15s linear;
    }
    &.is-selected {
      &::after {
        opacity: 1;
      }
    }
  }
}
</style>
