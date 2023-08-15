<template>
  <div class="chat-records">
    <div class="chat-records-body">
      <el-input
        placeholder="搜索"
        prefix-icon="el-icon-search"
        clearable
        :autofocus="true"
        v-model="searchVal"
      >
      </el-input>
      <div class="chat-records-content">
        <Spin
          fix
          class="loading"
          v-show="chatRecords.length <=0 && isLoading"
        >
          <div class="loader">
            <i class="loading-icon el-icon-loading"></i>
            查找中...
          </div>
        </Spin>
        <iscroll-view
          ref="scrollView"
          @loadNext="loadNextHandler"
          v-show="chatRecords.length > 0 && searchVal.length > 0"
          @scroll="scrollHandler"
        >
          <ul class="chat-records-list">
            <li
              class="chat-records-item"
              v-for="item in chatRecords"
              :key="item.messageId"
              @click="showMessage(item)"
            >
              <user-photo
                class="user-sign"
                :user="item.accountId"
              ></user-photo>
              <div class="right">
                <div class="top">
                  <div class="name">{{item.userName}}</div>
                  <div class="name">{{item.time?$moment(Number(item.time)).format("YYYY/MM/DD HH:mm"):""}}</div>
                </div>
                <div
                  class="bottom"
                  v-html="item.content"
                ></div>
              </div>
            </li>
          </ul>
        </iscroll-view>
        <div
          class="chat-records-noData"
          v-show="chatRecords.length <= 0 && !isLoading && searchVal.length > 0"
        >未找到相关内容</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel } from "../../WebIM";
export default {
  data() {
    return {
      IMConversationEnum: ConversationModel.IMConversationEnum,
      searchVal: "", //查找值
      isLoading: false, //查找中
      interval: null, //记时器
      chatRecords: [], //消息记录
      pageNum: 1, //页码
      hasNextPage: false, //是否有下一页
      scrollTop: 0, //滚动位置
    };
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      corpUser: "GetCompany",
      GetSendUser: "GetSendUser",
    }),
    messageId() {
      // 监测会话窗的名字是否变化
      return this.OpenDialog.id;
    },
  },
  mounted() {
    this.interval = this.$myUtils.Debounce(this.searchRecords, 1000);
  },
  watch: {
    searchVal(newVal, oldVal) {
      if (newVal != oldVal) {
        this.pageNum = 1;
        this.interval();
      }
    },
  },
  methods: {
    clear() {
      this.searchVal = "";
      this.chatRecords = [];
    },
    compareAccountId(string1, string2) {
      let min = string1.length >= string2.length? string2: string1;
      let max = string1.length >= string2.length? string1: string2;;
      for (let i = 0; i < min.length; i++) {
        if(min[i] < max[i]){
          break;
        } else if(min[i] > max[i]) {
          const temp = max;
          max = min;
          min = temp;
          break;
        }
      }
      return {min, max};
    },
    getSuiteId() {
      const accountIds = this.compareAccountId(
        this.messageId,
        this.GetSendUser.id
      );
      return accountIds.min + "A" + accountIds.max;
    },
    async searchRecords() {
      this.isLoading = true;
      let isGroup =
        this.OpenDialog.conversationType === this.IMConversationEnum.GROUP;
      try {
        let postdata = {
          corpId: this.corpUser.corpId,
          accountId: this.corpUser.accountId,
          id: isGroup ? this.messageId : this.getSuiteId(),
          searchContent: this.searchVal,
          pageNum: this.pageNum,
          pageSize: 30,
          type: 1,
        };
        let records = await this.$service.searchRecordList.call(this, postdata);
        if (records.code == "M0000") {
          if (this.pageNum == 1) {
            this.scrollTop = 0;
            this.chatRecords.splice(0);
          }
          this.chatRecords.push(...records.data.searchInfo);
          this.hasNextPage = records.data.hasNextPage;
          this.$nextTick(() => {
            try {
              let scrollView = this.$refs.scrollView;
              scrollView && (scrollView.this.scrollTop = this.scrollTop);
            } catch (error) {}
          });
        } else {
          throw new Error(records);
        }
      } catch (error) {
        this.$Message.error(error.msg || "查找聊天记录失败！");
        this.chatRecords.splice(0);
      }
      this.isLoading = false;
    },
    // 加载下一页
    loadNextHandler() {
      if (this.hasNextPage) {
        this.pageNum += 1;
        this.searchRecords();
      }
    },
    // 滚动事件
    scrollHandler(e) {
      this.scrollTop = e.target.scrollTop;
    },
    showMessage(item) {
      this.$emit("showMessage", item);
    },
  },
};
</script>

<style lang="scss">
.chat-records {
  flex: 1;
  padding: 0 20px;
  overflow: hidden;
  .chat-records-body {
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    .el-input {
      padding: {
        bottom: 10px;
      }
      .el-input__inner {
        height: 30px;
      }
      .el-input__icon {
        line-height: 30px;
      }
    }
    .loading {
      position: absolute;
      top: 40px;
      left: 0;
      right: 0;
      bottom: 0;
      color: #999999;
      font-size: 12px;
    }
    .chat-records-content {
      overflow: hidden;
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      .chat-records-list {
        padding: 10px 0;
        .chat-records-item {
          display: flex;
          padding: 10px;
          box-sizing: border-box;
          overflow: hidden;
          .right {
            width: calc(100% - 60px);
            box-sizing: border-box;
            line-height: 1;
            .top {
              display: flex;
              color: #999999;
              justify-content: space-between;
              font-size: 12px;
              margin: 5px 0;
            }
            .bottom {
              font-size: 12px;
              color: #333;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
          }
          &:hover {
            background: #f6f6f8;
          }
        }
      }
    }
    .chat-records-noData {
      color: #999999;
      font-size: 12px;
    }
  }
}
</style>