<template>
  <section class="select-organize-modal">
    <div class="modal-title">选择行动归属</div>
    <div class="modal-body">
      <div class="modal-tab-box">
        <!-- tabs -->
        <div class="modal-tabs">
          <a-button
            v-for="row of switchBtns"
            :key="row.key"
            type="link"
            :class="{ 'active-btn': activeTab === row.type }"
            @click="switchTabHandle(row)"
            >{{ row.text }}</a-button
          >
        </div>
        <!-- 搜索 -->
        <search-box
          class="modal-search"
          placeholder="搜索联系人、群组"
          @select="searchSelectHandle"
        ></search-box>
      </div>
      <!-- container -->
      <div class="modal-container">
        <!-- 最近联系人 -->
        <ul
          v-if="showComponent.chart"
          class="last-contacts"
          v-show="activeTab === 1"
        >
          <li
            v-for="(row, key) in allConversation"
            :key="key"
            class="contact-item"
            @click="selectDialogHandle(row)"
          >
            <a-checkbox
              v-if="multipleSelect"
              class="mt-checkbox-circle"
              :checked="selectedKeyClassify.all.includes(row.key)"
            ></a-checkbox>
            <img
              v-else
              class="w-20px h-20px flex-shrink-0 rounded-full"
              :src="
                require(`@/assets/image/chitchat/list-radio-${
                  singleCheckObj.conversationType === row.conversationType &&
                  singleCheckObj.id === row.id
                    ? 'checked'
                    : 'uncheck'
                }.png`)
              "
            />
            <user-photo
              class="iconfont select-icon"
              :user="row"
              v-if="row.conversationType === IMConversationEnum.PRIVATE"
            ></user-photo>
            <group-photo
              class="iconfont select-icon"
              :group="row"
              v-if="row.conversationType === IMConversationEnum.GROUP"
            ></group-photo>
            <div class="content-info">
              <p class="item-name only-line">{{ row.name }}</p>
              <group-sign :type="row.groupType"></group-sign>
            </div>
          </li>
        </ul>
        <!-- 群组 -->
        <select-group-list
          v-if="showComponent.group"
          v-show="activeTab === 2"
          :multipleSelect="multipleSelect"
          :selected="selectedIdClassify.group"
          :checkedObj="singleCheckObj"
          @changeSelect="groupSelectHandle"
        ></select-group-list>
        <!-- 组织架构 -->
        <outsource-group-select
          v-if="showComponent.contact"
          v-show="activeTab === 3 && !showDeptAndUser"
          type="organization"
          @showCompanyDept="selectCompanyHandle"
          @currentType="changeCurrentType"
        ></outsource-group-select>
        <!-- 部门人员 -->
        <company-dept-user
          v-if="activeTab === 3 && showDeptAndUser"
          ref="companyDepet"
          :current="currentSelectCorp"
          :type="currentSelectCorp.companyType || 'organization'"
          :multipleSelect="multipleSelect"
          :checkedObj="multipleSelect ? checkedObj : companyCheckObj"
          :disabledObj="{}"
          @backToCompany="showDeptAndUser = false"
          @toggle-user="toggleChecked"
        ></company-dept-user>
      </div>
      <!-- footer -->
      <div
        class="modal-footer flex items-center justify-between flex-shrink-0 h-64px px-16px"
      >
        <span class="flex items-center justify-start">
          <span
            v-if="singleCheckObj.id"
            class="text-14px text-#666 leading-normal truncate"
            >已选：{{ singleCheckObj.name }}</span
          >
          <span v-else class="text-14px text-#999 leading-normal"
            >尚未选择</span
          >
          <span
            v-if="singleCheckObj.id"
            class="ml-16px text-14px flex-shrink-0 text-primary cursor-pointer hover:text-#2E6BE6"
            @click="singleCheckObj = {}"
            >清空已选</span
          >
        </span>
        <span class="flex items-center justify-end ml-16px">
          <el-button
            class="px-14px py-5px bg-white text-#666 leading-normal border-#ccc hover:(bg-white text-primary border-primary)"
            @click="cancelHandle"
            >取消</el-button
          >
          <el-button
            type="primary"
            class="px-14px py-5px bg-primary text-white leading-normal border-primary hover:(bg-#2E6BE6 border-#2E6BE6)"
            @click="confirmHandle"
            >确定</el-button
          >
        </span>
      </div>
    </div>
  </section>
</template>

<script>
import { ConversationModel, MessageModel } from "../../WebIM";
import { mapGetters } from "vuex";
import SearchBox from "./search-box.vue";
import SelectGroupList from "./select-group-list.vue";
import CompanyDeptUser from "@/components/common/group/company-dept-user";
import SvgIcon from "../common/svg-icon.vue";

export default {
  name: "SelectOrganizeModal",
  components: { SearchBox, SelectGroupList, CompanyDeptUser, SvgIcon },
  props: {
    // 是否去除自己
    removeSelf: {
      type: Boolean,
      default: false
    },
    // 是否多选
    multipleSelect: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      IMConversationEnum: ConversationModel.IMConversationEnum,
      MessageType: MessageModel.MessageType,
      switchBtns: [
        { text: "最近联系人", type: 1, key: "chart" },
        { text: "群组", type: 2, key: "group" },
        { text: "组织架构", type: 3, key: "contact" }
      ],
      showComponent: {
        chart: false,
        group: false,
        contact: false
      },
      singleCheckObj: {}, // 单选时记录选中的对象
      activeTab: 0, // 当前展示tab
      showSelectedList: [], // 展示已选择
      checkedObj: {}, // 组织架构选中的人员
      showDeptAndUser: false, // 组织架构选择公司部门
      currentSelectCorp: {} // 组织选择的公司
    };
  },
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany",
      ConversationSort: "GetConversationSort"
    }),
    allConversation() {
      let result = this.ConversationSort.all.map(({ ...item }) => {
        const classifyKey =
          item.conversationType === ConversationModel.IMConversationEnum.GROUP
            ? "group"
            : "private";
        const signKey = `${classifyKey}#${item.id}`;
        item.type = classifyKey;
        item.key = signKey;
        return item;
      });
      // 把自己过滤掉
      if (this.removeSelf) {
        result = result.filter(item => item.id !== this.GetCompany.accountId);
      }
      // 机器人助手过滤掉
      result = result.filter(item => !item.id.includes("robot_"));
      result.sort((a, b) => {
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
      return result;
    },
    selectedKeyClassify() {
      const { showSelectedList } = this;
      const result = { all: [], group: [], private: [], user: [], dept: [] };
      showSelectedList.forEach(item => {
        result.all.push(item.key);
        switch (item.type) {
          case "group":
            result.group.push(item.key);
            break;
          case "user":
            result.user.push(item.key);
            break;
          case "dept":
            result.dept.push(item.key);
            break;
          case "private":
            result.private.push(item.key);
            break;
        }
      });
      return result;
    },
    selectedIdClassify() {
      const { showSelectedList } = this;
      const result = { group: [], user: [], dept: [] };
      showSelectedList.forEach(item => {
        switch (item.type) {
          case "group":
            result.group.push(item.id);
            break;
          case "user":
            result.user.push(item.id);
            break;
          case "dept":
            result.dept.push(item.id);
            break;
        }
      });
      return result;
    },
    companyCheckObj() {
      let obj = {};
      if (this.singleCheckObj && this.singleCheckObj.id) {
        obj[this.singleCheckObj.id] = true;
      }
      return obj;
    }
  },
  watch: {},
  mounted() {
    this.switchTabHandle(this.switchBtns[0]);
  },
  methods: {
    // 取消事件
    cancelHandle() {
      this.$emit("close");
    },
    // 确定回调
    confirmHandle() {
      if (!this.singleCheckObj || !this.singleCheckObj.id) {
        // 尚未进行选择
        this.$message.warning("尚未选择归属");
        return;
      }
      this.$emit("confirm", this.singleCheckObj);
    },
    // tab切换
    switchTabHandle(row) {
      if (!this.showComponent[row.key]) {
        this.showComponent[row.key] = true;
      }
      this.activeTab = row.type;
    },
    // 搜索结果处理
    searchSelectHandle(data) {
      if (this.multipleSelect) {
        if (data.isgroup) {
          this.groupSelectHandle({ item: data, type: "add" });
        } else {
          this.toggleChecked({ ...data, isUser: true });
        }
      } else {
        if (data.isgroup) {
          data = {
            ...data,
            conversationType: ConversationModel.IMConversationEnum.GROUP
          };
        } else {
          data = {
            ...data,
            id: data.accountId,
            conversationType: ConversationModel.IMConversationEnum.PRIVATE
          };
        }
        this.setSingleCheckObj(data);
      }
    },
    // 选择最近联系人
    selectDialogHandle(data) {
      console.log("选中最近联系人 data = ", data);
      if (this.multipleSelect) {
        const { showSelectedList, selectedKeyClassify } = this;
        const { id: dialogId, key, type, conversationType, avatar } = data;
        if (selectedKeyClassify.all.includes(key)) {
          this.deleteSelectedHandle(key);
        } else {
          if (selectedKeyClassify.all.length < 9) {
            const temp_data = {
              avatar,
              id: dialogId,
              conversationType,
              name: data.name,
              type,
              key
            };
            showSelectedList.push(temp_data);
          } else {
            this.$message.info("最多只能选择9个会话");
          }
        }
      } else {
        this.singleCheckObj = data;
      }
    },
    // 群组（取消）选择事件
    groupSelectHandle(data) {
      console.log("选中的群组 data = ", data);
      const { item, type } = data;
      if (this.multipleSelect) {
        if (type === "add") {
          const key = `group#${item.id}`;
          if (!this.selectedKeyClassify.all.includes(key)) {
            if (this.selectedKeyClassify.all.length < 9) {
              const temp_data = {
                id: item.id,
                conversationType: IMConversationEnum.GROUP,
                name: item.name,
                type: "group",
                key
              };
              this.showSelectedList.push(temp_data);
            } else {
              this.$message.info("最多只能选择9个会话");
            }
          }
        } else {
          this.deleteSelectedHandle(`group#${item.id}`);
        }
      } else {
        const data = {
          ...item,
          conversationType: ConversationModel.IMConversationEnum.GROUP
        };
        this.singleCheckObj = data;
      }
    },
    // 组织架构选择事件
    selectCompanyHandle(item) {
      this.currentSelectCorp = item;
      this.showDeptAndUser = true;
    },
    // 处理勾选、取消勾选、删除已选择人员和组织
    async toggleChecked(deptOrUser) {
      if (this.multipleSelect) {
        const { isUser, accountId } = deptOrUser;
        if (isUser) {
          const indexInSelected = this.showSelectedList.findIndex(
            item => item.isUser && item.accountId === accountId
          );
          if (this.checkedObj[accountId]) {
            // 取消勾选人员，删除已选择人员
            if (indexInSelected !== -1) {
              this.showSelectedList.splice(indexInSelected, 1);
            }
            this.$set(this.checkedObj, accountId, false);
          } else {
            if (this.selectedKeyClassify.all.length >= 9) {
              this.$message.info("最多只能选择9个会话");
              return;
            }
            // 勾选人员
            this.showSelectedList.push({
              ...deptOrUser,
              id: accountId,
              type: "user",
              key: `user#${accountId}`
            });
            this.$set(this.checkedObj, accountId, true);
          }
        }
      } else {
        const data = {
          ...deptOrUser,
          id: deptOrUser.accountId,
          userId: deptOrUser.id,
          conversationType: ConversationModel.IMConversationEnum.PRIVATE
        };
        this.setSingleCheckObj(data);
      }
    },
    setSingleCheckObj(data) {
      if (this.removeSelf && data.id === this.GetCompany.accountId) {
        this.$message.warning("不能选择自己");
        return;
      }
      this.singleCheckObj = data;
    },
    /**
     * 删除已选
     */
    deleteSelectedHandle(key) {
      const { showSelectedList, selectedKeyClassify } = this;
      const index = selectedKeyClassify.all.indexOf(key);
      if (index !== -1) {
        showSelectedList.splice(index, 1);
      }
    },
    changeCurrentType(type) {
      this.currentSelectCorpType = type;
    }
  }
};
</script>

<style lang="scss" scoped>
.select-organize-modal {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: 500px;
  height: 70vh;
  overflow: hidden;
  .modal-title {
    height: 48px;
    line-height: 48px;
    background-color: #eaedf2;
    text-align: center;
    font-size: 16px;
    font-weight: 500;
  }
  .modal-body {
    display: flex;
    flex: 1;
    flex-direction: column;
    overflow: hidden;
    position: relative;
    .modal-tab-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      height: 38px;
      padding: 0 16px;
      border-bottom: 1px solid #e7e7e7;
      .modal-tabs {
        height: 100%;
        flex-shrink: 0;
        > button {
          border: none;
          padding: 0;
          height: 100%;
          color: #1f2329;
          font-size: 14px;
          &.active-btn {
            color: #3e7eff;
          }
          &:not(:first-child) {
            margin-left: 24px;
          }
        }
      }
      .modal-search {
        flex: 1;
        margin: 0;
        margin-left: 36px;
        flex-shrink: 0;
        flex-basis: unset;
        height: 26px;
        .search-input {
          background-color: #f4f6f8;
          border-radius: 50%;
        }
        :deep(.search-result) {
          top: 32px;
          left: -60px;
          right: 0;
          width: auto;
          height: 50vh;
        }
      }
    }
    .modal-container {
      flex: 1;
      overflow: hidden;
      .last-contacts {
        width: 100%;
        height: 100%;
        overflow: hidden auto;
        > li {
          padding: 10px 16px;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: background-color 0.2s linear;
          &:hover {
            background-color: #f4f6f8;
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
      .company-dept-user {
        height: 100%;
        :deep(.company-dept-user-breadcrumb) {
          margin-top: 0 !important;
        }
      }
      .outsource-group-select {
        height: 100%;
        padding-top: 0 !important;
        :deep(.organization-outsourtce-header) {
          border-top: none !important;
        }
      }
    }
    .modal-footer {
      border-top: 1px solid #e7e7e7;
    }
  }
}
</style>
