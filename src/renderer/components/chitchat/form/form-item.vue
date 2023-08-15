<template>
  <div
    class="form-item"
    :class="[
      getOption.type == 'member' ? 'form-item-block' : '',
      getOption.hasBottom ? 'hasBottom' : '',
      ['confirm', 'inputNumber'].includes(getOption.type) ? 'can-click' : '',
      getOption.type == 'range' ? 'form-item-card' : '',
    ]"
    @click="handleConfirm"
  >
    <div
      class="item-label"
      v-if="getOption.type !== 'range'"
      v-show="!showSearchMember"
      :class="['quit', 'dismiss'].includes(getOption.key) ? 'dismiss' : ''"
    >
      {{ getOption.label }}
      <div class="child-label">{{ getOption.childLabel }}</div>
      <div class="operate-member" v-show="getOption.type == 'member'">
        <button @click="addMember"></button>
        <button v-show="getOption.search" @click="searchMember"></button>
      </div>
    </div>
    <div
      class="item-label"
      v-if="getOption.type !== 'range'"
      v-show="showSearchMember"
      id="searchInput"
    >
      <el-input
        prefix-icon="el-icon-search"
        v-model="searchVal"
        clearable
      ></el-input>
      <span class="search-clear" @click="cancelSearch">取消</span>
    </div>
    <div
      class="item-content"
      :class="getOption.type == 'confirm' ? 'confirm-item-content' : ''"
    >
      <!-- 开关组件 -->
      <el-switch
        v-show="getOption.type == 'switch'"
        v-model="getOption.value"
        @change="changeValue"
      ></el-switch>
      <!-- 确认框组件,drawer组件（群主移交） -->
      <div class="right-arrows-box" v-show="getOption.type == 'confirm'">
        <span
          class="right-arrows-text"
          v-show="getOption.text !== false"
          v-text="getOption.text"
        ></span>
        <i class="iconfont icon-jiantou-right"></i>
      </div>
      <!-- 成员列表组件展示 -->
      <div class="member-content" v-show="getOption.type == 'member'">
        <div
          class="member-list"
          v-for="(item, index) in showMemberList"
          :key="index"
        >
          <user-photo
            class="user-photo-poper"
            v-if="!item.type || !['more', 'retract'].includes(item.type)"
            :user="item"
            :hasInfo="true"
          ></user-photo>
          <div class="more-button" v-else @click="handleShowMore">
            <img
              v-if="item.type == 'more'"
              src="~@/assets/image/chitchat/more.png"
              alt
            />
            <i v-else class="iconfont icon-jiantou"></i>
          </div>
          <div v-if="item.isOwner" class="owner-logo">
            <img src="~@/assets/image/chitchat/owner.png" alt />
          </div>
          <!-- 群主不能删除，非群主不能展示删除按钮以及展开收起不展示收起按钮 -->
          <div
            class="delete-button"
            v-if="
              !item.isOwner &&
              !['retract3001', '30031more'].includes(item.id) &&
              getOption.isOwner
            "
            @click="deleteMember(item)"
          >
            <img src="~@/assets/image/chitchat/delete-member.png" alt />
          </div>
          <div class="user-name" :title="item.name">
            {{ item.name || item.nickName || "" }}
          </div>
        </div>
        <div
          class="no-member"
          v-show="showSearchMember && showMemberList.length <= 0"
        >
          未找到相关用户
        </div>
      </div>
      <!-- 输入框组件 -->
      <div class="user-limit" v-show="getOption.type == 'inputNumber'">
        {{ getOption.value }}
        <div class="user-limit-edit"></div>
      </div>
      <!-- 文本组件 -->
      <div
        class="text"
        v-show="getOption.type == 'text'"
        :class="getOption.groupType"
      >
        {{ getOption.text }}
      </div>
      <el-collapse
        v-show="getOption.type == 'range'"
        class="corp-list-card"
        accordion
      >
        <el-collapse-item>
          <template slot="title">
            <div class="right">
              {{ getOption.label }}
              <el-popover
                placement="bottom-start"
                width="354"
                trigger="click"
                v-model="showRange"
                popper-class="range-popper"
              >
                <el-checkbox-group
                  v-model="belongRange"
                  @change="changeRangeHandle"
                >
                  <el-checkbox
                    v-for="item in belongRangeList"
                    :disabled="getOption.corpId == item.corpId"
                    :key="item.corpId"
                    :label="item.corpId"
                    :value="item.corpId"
                    >{{ item.corpName }}</el-checkbox
                  >
                </el-checkbox-group>
                <el-button
                  slot="reference"
                  @click.stop.prevent="showRangeHandle"
                  v-show="getOption.canEdit"
                  >添加</el-button
                >
              </el-popover>
            </div>
            <div class="left">{{ getOption.value }}</div>
          </template>
          <div class="corp-list-content">
            <div
              class="corp-item"
              v-for="corp in getOption.list"
              :key="corp.id"
            >
              {{ corp.corpName }}
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    <el-dialog
      :title="dialogOption.title"
      :visible.sync="dialogOption.show"
      custom-class="input-dialog-simple"
      append-to-body
    >
      <div class="dialog-content">
        <el-input-number
          id="limitInput"
          :disabled="getOption.min >= 3000"
          v-if="dialogOption.type == 'inputNumber'"
          autofocus
          v-model="dialogOption.value"
          :class="dialogOption.error ? 'error-input' : ''"
          :controls="false"
          @input.native="changeOptionValue($event)"
        ></el-input-number>
        <span class="value-tip">{{ dialogOption.tip }}</span>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button
          :disabled="dialogOption.error || !dialogOption.value"
          type="primary"
          @click="confirmDialog"
          >确 定</el-button
        >
      </span>
    </el-dialog>
    <owner-drawer
      :drawerOption="drawerOption"
      @changeOwner="changeOwner"
      @closeDrawer="closeDrawer"
      @close="$emit('close')"
    ></owner-drawer>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel, IMSDKServer } from "../../../WebIM";
import globalConfig from "@/global.config";
import OwnerDrawer from "@/components/chitchat/form/owner-drawer";
const robot = globalConfig.robot;
export default {
  props: ["option", "groupMembers", "type"],
  components: { OwnerDrawer },
  data() {
    return {
      ConversationModel,
      IMConversationEnum: ConversationModel.IMConversationEnum,
      showAll: false, //收起展开
      moreClick: false, //定义变量以促进成员展示列表变化
      memberIdList: [], //用户id列表
      showMemberList: [], //展示成员列表
      showSearchMember: false, //是否展示搜索群成员
      searchVal: "", //搜索内容
      dialogOption: {
        type: "", //类型
        title: "", //标题
        show: false, // 是否展示弹窗
        value: "", //当前值
        error: false, //是否发生错误
        tip: "", // 提示文字
      }, //弹窗配置项
      drawerOption: {
        type: "list", //类型
        title: "", //标题
        show: false, // 是否展示弹窗
        value: "", //值
        list: [], //列表
      },
      belongRangeList: [], // 所属公司获取可选择范围
      belongRange: [], // 所属公司范围
      showRange: false, // 展示公司范围弹窗
    };
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      GetCompany: "GetCompany",
      AllUserMap: "GetAllUserMap",
      GetNotCorpUsers: "GetNotCorpUsers",
      networkState: "GetNetWorkState",
    }),
    getOption() {
      return { ...this.option };
    },
    memberAllList() {
      return [...(this.groupMembers || [])];
    },
  },
  watch: {
    option: {
      async handler(newVal, oldVal) {
        if (newVal.key === "corpList") {
          await this.getBelongRangeList(this.getOption.corpId);
        }
      },
      deep: true,
    },
    // 成员发生变化时重新计算展示成员
    memberAllList: {
      handler(newVal, oldVal) {
        if (newVal && newVal.length) {
          this.handleShowUser();
        }
      },
      deep: true,
    },
    searchVal(newVal, oldVal) {
      if (newVal) {
        this.showMemberList = this.memberAllList.filter((item) =>
          (item.name || item.nickName || "").includes(this.searchVal)
        );
      } else {
        this.showAll = false;
        this.showMemberList = [];
        this.getShowMember();
      }
    },
    moreClick(newVal, oldVal) {
      // 点击更多按钮
      if (this.showMemberList.length >= this.memberAllList.length) {
        // 如果当前展示列表+收起按钮大于所有成员则此时为收起事件清空展示列表重新计算
        this.showAll = false;
        this.showMemberList = [];
      }
      this.getShowMember();
    },
  },
  methods: {
    ...mapActions(["ClearDialogMessage", "ChangeNoMoreMsg", "DeleteDialog"]),
    handleShowUser() {
      if (this.showMemberList.length < 11) {
        // 如果当前展示的成员+展开按钮不超过11说明在第一页成员数据此时重新展示列表
        this.showMemberList = [];
        this.getShowMember();
      } else {
        // 如果是已经展开的则展示当前成员数量的成员
        let length = this.showMemberList.length;
        this.showMemberList = this.memberAllList.slice(0, length);
        if (this.memberAllList.length > 10) {
          // 全部成员>10才展示按钮
          if (this.showMemberList.length >= this.memberAllList.length) {
            // 如果展示成员+收起按钮大于所有成员则展示收起按钮
            this.showMemberList.push({
              id: "retract3001",
              type: "retract",
              name: "收起",
            });
          } else {
            // 否则展示展开按钮
            this.showMemberList.push({
              id: "30031more",
              type: "more",
              name: "展开",
            });
          }
        }
      }
    },

    /**
     * 获取展示成员
     */
    getShowMember() {
      if (this.memberAllList.length <= 10) {
        this.showMemberList = [...this.memberAllList];
      } else {
        let list = [];
        this.showMemberList.pop();
        if (this.showAll) {
          // 如果是展示全部展示所有成员+收起按钮
          list = this.memberAllList.slice(
            this.showMemberList.length,
            this.memberAllList.length
          );
          list.push({
            id: "retract3001",
            type: "retract",
            name: "收起",
          });
        } else {
          if (this.showMemberList.length <= 0) {
            // 如果当前无展示成员则只展示前九个+展开
            list = this.memberAllList.slice(0, 9);
          } else {
            // 否则依次加载五十个+展开按钮
            list = this.memberAllList.slice(
              this.showMemberList.length,
              this.showMemberList.length + 50
            );
          }
          list.push({
            id: "30031more",
            type: "more",
            name: "展开",
          });
        }
        this.showMemberList = this.showMemberList.concat(list);
      }
    },
    /**
     * 搜索群成员
     */
    searchMember() {
      this.showSearchMember = true;
      this.focusInput("searchInput");
    },
    /**
     * 改变公司范围
     */
    changeRangeHandle(corpList) {
      const corpListRange = this.belongRangeList.filter((item) =>
        this.belongRange.includes(item.corpId)
      );
      const option = { ...this.getOption, list: corpListRange };
      this.$emit("changeValue", option);
    },
    /**
     * 添加群成员
     */
    addMember() {
      if (this.networkState == "online") {
        if (this.getOption.add) {
          this.$emit("addMember");
        } else {
          this.$Message.warning("您没有权限添加群成员");
        }
      } else {
        this.$Message.warning("无法获取人员信息，信息获取失败");
      }
    },
    /**
     * 删除成员
     */
    deleteMember(member) {
      const h = this.$createElement;
      this.$msgbox({
        title: "提示",
        message: h("div", null, [
          h("p", null, `确定要将${member.name || member.nickName}移出群聊？`),
          h(
            "p",
            { style: { color: "#999999", fontSize: "12px" } },
            "该成员将不再收到此群聊消息"
          ),
        ]),
        type: "warning",
        customClass: "setting-confirm",
        showCancelButton: true,
        confirmButtonText: "确定",
        cancelButtonText: "取消",
      })
        .then(() => {
          let data = {
            groupId: this.OpenDialog.id,
            accountIds: [member.accountId],
            corpId: this.GetCompany.corpId,
            type: 2,
          };
          this.$service
            .quitGroup("quit", data)
            .then((res) => {
              this.$emit("changeValue", this.getOption);
            })
            .catch((error) => {
              this.$message.error(error.msg || `移除成员失败`);
            });
        })
        .catch((error) => {});
    },
    // 取消搜索
    cancelSearch() {
      this.searchVal = "";
      this.showSearchMember = false;
    },
    /**
     * 获取群成员详细信息
     */
    async getUsers(userIds) {
      // let userIds = this.option.list || [];
      this.memberAllList = [];
      // 展示成员或移交群主才获取用户信息
      if (["member", "owner"].includes(this.getOption.key)) {
        userIds.forEach(async (element) => {
          let user =
            this.AllUserMap[element] ||
            this.GetNotCorpUsers[element] ||
            robot[element];
          if (!user) {
            try {
              const res =
                await this.$service.getAccountInformationOrganization.call(
                  this,
                  { id: element }
                );
              if (res) {
                let userInfo = { ...res, accountId: res.id };
                !this.memberAllList.find(
                  (userItem) => userItem.accountId === res.id
                ) && this.memberAllList.push(userInfo);
              }
            } catch (error) {
              console.log(error, "获取用户信息失败");
            }
          } else {
            !this.memberAllList.find(
              (userItem) => userItem.accountId === user.accountId
            ) && this.memberAllList.push(user);
          }
        });
      }
    },
    showRangeHandle() {
      // this.showRange = !this.showRange;
    },
    /**
     * 获取公司范围
     */
    async getBelongRangeList(corpId) {
      if (this.getOption.key === "corpList") {
        try {
          const res = await this.$service.getGroupCompanyList({
            corpId,
          });
          this.belongRange.splice(0);
          this.belongRangeList.splice(0);
          const corpIds = (this.getOption.list || []).map(
            (item) => item.corpId
          );
          this.belongRange = [...corpIds];
          this.handleRangeData(res || []);
        } catch (error) {
          this.$message.error("获取群所属范围失败！");
        }
      }
    },
    handleRangeData(companyList) {
      for (let index = 0; index < companyList.length; index++) {
        const element = companyList[index];
        this.belongRangeList.push({
          ...element,
          id: element.id || element.corpId,
        });
        if (
          element.children &&
          Array.isArray(element.children) &&
          element.children.length
        ) {
          this.handleRangeData(element.children);
        }
      }
    },
    /**
     * 群成员展示更多
     */
    handleShowMore() {
      this.moreClick = !this.moreClick;
      if (this.memberAllList.length - this.showMemberList.length > 50) {
        //每次继续加载五十个直到全部加载完
        this.showAll = false;
      } else {
        //全部加载完则收起
        this.showAll = true;
      }
    },
    /**
     * 移交群主
     */
    changeOwner() {
      this.$emit("changeValue", this.getOption);
      this.closeDrawer();
    },
    /**
     * 关闭抽屉组件
     */
    closeDrawer() {
      this.$set(this.drawerOption, "show", false);
    },
    /**
     * 改变当前值
     */
    changeValue() {
      switch (this.getOption.key) {
        case "stick":
        case "isHint":
          // 置顶或消息免打扰时群添加属性
          this.setDialogAttr(
            this.getOption.key == "stick" ? 1 : 2,
            this.getOption.value ? 1 : 2
          );
          break;
        case "onlyOwnerManage":
        case "onlyOwnerAtAll":
        case "userLimit":
          this.$emit("changeValue", this.getOption);
          break;
      }
    },
    /**
     * 点击确定框
     */
    handleConfirm() {
      if (this.getOption.type == "confirm") {
        if (this.getOption.key == "owner") {
          // 群主移交
          this.drawerOption = {
            type: "list", //类型
            title: "移交群主", //标题
            show: true, // 是否展示弹窗
            value: "", //值
            list: this.memberAllList.filter(
              (item) => item.accountId !== this.getOption.value
            ), //列表
          };
        } else if (["clear", "dismiss", "quit"].includes(this.getOption.key)) {
          // 清空聊天记录、解散群、退出群
          let data = this.OpenDialog;
          const h = this.$createElement;
          let _this = this;
          this.$msgbox({
            title: "提示",
            message: h("div", null, [
              h("p", null, this.getOption.confirmLabel),
              h(
                "p",
                { style: { color: "#999999", fontSize: "12px" } },
                this.getOption.confirmContent || ""
              ),
            ]),
            type: "warning",
            customClass: "setting-confirm",
            showCancelButton: true,
            confirmButtonText: "确定",
            cancelButtonText: "取消",
          })
            .then(() => {
              let type = _this.getOption.key;
              switch (type) {
                case "clear":
                  // 清空聊天记录
                  _this.ClearDialogMessage({ ...data, clearLatest: true });
                  _this.ChangeNoMoreMsg({
                    data: data.id,
                    action: "del",
                    conversationType: data.conversationType,
                  });
                  break;
                case "dismiss":
                case "quit":
                  // 解散或退出群聊
                  let postData =
                    type == "dismiss"
                      ? {
                          groupId: data.id,
                          operationId: _this.GetCompany.accountId,
                          corpId: _this.GetCompany.corpId,
                        }
                      : {
                          groupId: data.id,
                          accountIds: [_this.GetCompany.accountId],
                          corpId: _this.GetCompany.corpId,
                          type: 1,
                        };
                  _this.$service
                    .quitGroup(type, postData)
                    .then((res) => {
                      _this.DeleteDialog({ data });
                      _this.ChangeNoMoreMsg({
                        data: data.id,
                        action: "del",
                        conversationType: data.conversationType,
                      });
                      try {
                        IMSDKServer.removeConversation(
                          data.conversationType,
                          data.id
                        );
                      } catch (error) {}
                    })
                    .catch((error) => {
                      _this.$message.error(
                        error.msg ||
                          `${type == "dismiss" ? "解散" : "退出"}群聊失败`
                      );
                    });
              }
            })
            .catch(() => {});
        } else if (this.getOption.key === "robot") {
          // 打开群助手管理
          this.$emit("show-robot");
        }
      } else if (this.getOption.type === "inputNumber") {
        this.showInputDialog();
      }
    },
    /**
     * operateType 1，置顶  2，免打扰
     */
    setDialogAttr(operateType, onOff) {
      const { id: beId, conversationType } = this.OpenDialog;
      const data = {
        beId,
        conversationType,
        operateType,
        onOff,
      };
      if (this.type == "single") {
        this.$service.setGroupAttribute.call(this, {
          ...data,
        });
      } else {
        this.$emit("changeGroupAttr", data);
      }
    },
    /**
     * 数字输入弹窗（群成员上限）
     */
    showInputDialog() {
      let isLimit = this.getOption.min >= 3000;
      this.dialogOption = {
        type: "inputNumber",
        title: "群人数上限",
        show: true,
        error: isLimit,
        value: this.getOption.value,
        tip: isLimit
          ? "当前人数已达上限"
          : `请在${this.getOption.min}-3000人范围内设置`,
      };
      this.focusInput("limitInput");
    },
    focusInput(id) {
      this.$nextTick(() => {
        let content = document.getElementById(id);
        let input =
          content && content.getElementsByClassName("el-input__inner")[0];
        input && input.focus();
      });
    },
    /**
     * 关闭弹窗
     */
    closeDialog() {
      this.dialogOption = {
        type: "",
        title: "",
        show: false,
        error: false,
        tip: "",
      };
    },
    /**
     * 确认弹窗
     */
    confirmDialog() {
      let value = this.dialogOption.value;
      if (
        value &&
        Number(value) >= this.getOption.min &&
        Number(value) <= 3000
      ) {
        this.getOption.value = value;
        this.changeValue();
        this.closeDialog();
      } else {
        this.$message.info("输入的值超出范围");
      }
    },
    /**
     * 判断输入群限制人数
     */
    changeOptionValue(event) {
      const value = event.target.value;
      if (value) {
        if (Number(value) < this.getOption.min || Number(value) > 3000) {
          // 如果小于当前群人数+1或大于3000则错误提示且不能点确定
          this.dialogOption.error = true;
        } else {
          this.dialogOption.error = false;
        }
      } else {
        this.dialogOption.error = true;
      }
    },
  },
};
</script>

<style lang="scss">
.form-item {
  min-height: 44px;
  display: flex;
  align-items: center;
  &.form-item-card {
    align-items: flex-start;
    line-height: 44px;
  }
  &.hasBottom {
    border-bottom: 1px solid #e7e7e7;
  }

  &.can-click {
    cursor: pointer;
  }
  .item-label {
    font-size: 14px;
    color: #000;
    font-family: MicrosoftYaHei;
    &.dismiss {
      color: #ea5858;
    }
    .child-label {
      color: #999999;
      font-size: 10px;
    }
    .operate-member {
      cursor: pointer;
      margin-left: auto;
      display: flex;
      > button {
        width: 14px;
        height: 14px;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        &:nth-child(1) {
          margin-right: 21px;
          background-image: url("~@/assets/image/chitchat/add.png");
          &:hover {
            background-image: url("~@/assets/image/chitchat/add_hover.png");
          }
        }
        &:nth-child(2) {
          background-image: url("~@/assets/image/chitchat/search.png");
          &:hover {
            background-image: url("~@/assets/image/chitchat/search_hover.png");
          }
        }
      }
    }
    .search-clear {
      flex-shrink: 0;
      cursor: pointer;
      font-size: 14px;
      color: #4498f0;
      margin-left: 10px;
    }
  }
  .item-content {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    &.confirm-item-content {
      cursor: pointer;
    }
    i {
      cursor: pointer;
      &.icon-jiantou-right {
        color: #999999;
        font-size: 10px;
      }
    }
    .el-switch {
      .el-switch__core {
        width: 30px !important;
        height: 16px;
        &::after {
          width: 12px;
          height: 12px;
        }
      }
      &.is-checked {
        .el-switch__core {
          &::after {
            left: 100%;
            margin-left: -13px;
          }
        }
      }
    }
    .user-limit {
      display: flex;
      align-items: center;
      .user-limit-edit {
        width: 16px;
        height: 16px;
        margin-left: 5px;
        cursor: pointer;
        background-size: 100%;
        background-repeat: no-repeat;
        background-position: center center;
        background-image: url("~@/assets/image/chitchat/edit.png");
        transform: all 0.1s linear;
        &:hover {
          background-image: url("~@/assets/image/chitchat/edit-active.png");
        }
      }
    }
    .corp-list-card {
      border: none;
      width: 100%;
      .el-collapse-item__header {
        height: 44px;
        line-height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        color: #1f2329;
        .right {
          display: flex;
          align-items: center;
          flex: 1;
          .el-button {
            padding: 0;
            width: 46px;
            height: 28px;
            background: #3e7eff;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            margin-left: 8px;
          }
        }
        .left {
          margin-left: auto;
          color: #3e7eff;
        }
      }
      .el-collapse-item__wrap {
        border: none;
        .el-collapse-item__content {
          padding: 0;
          .corp-list-content {
            background: #f5f6f8;
            color: #8f959e;
            > div {
              display: flex;
              justify-content: flex-end;
              padding: 8px;
            }
          }
        }
      }
    }
    .text {
      &.organization {
        color: #3e7eff;
      }
      &.outsource {
        color: #36d18e;
      }
    }
  }
  &.form-item-block {
    display: block;
    .item-label {
      display: flex;
      height: 46px;
      align-items: center;
      .el-input {
        width: 322px;
        .el-input__inner {
          height: 30px;
        }
        .el-input__icon {
          line-height: 30px;
        }
      }
    }
    .member-content {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      justify-content: flex-start;
      .no-member {
        flex: 1;
        text-align: center;
        color: #999999;
        font-size: 12px;
        margin-top: 12px;
        margin-bottom: 20px;
      }
      .member-list {
        width: 70px;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 15px;
        position: relative;
        .owner-logo {
          position: absolute;
          top: -5px;
          right: 7px;
          width: 26px;
          height: 15px;
          line-height: 1;
          img {
            width: 100%;
            height: 100%;
          }
        }
        .delete-button {
          @extend .owner-logo;
          width: 16px;
          height: 16px;
          display: none;
          opacity: 0;
          right: 11px;
          cursor: pointer;
        }
        .more-button {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #eeeeee;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          > img {
            width: 16px;
            height: 16px;
          }
          > i {
            font-size: 14px;
            transform: rotate(90deg);
            color: #999999;
          }
        }
        &:hover {
          .user-photo {
            transition: all 0.15s linear;
            box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.5);
          }
          .delete-button {
            transition: all 0.15s linear;
            display: block;
            opacity: 1;
          }
        }
        .user-name {
          max-width: 90%;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          margin-top: 5px;
          font-size: 12px;
          color: #999999;
        }
      }
    }
  }

  .right-arrows-box {
    display: flex;
    align-items: center;

    > .right-arrows-text {
      color: #999;
      font-size: 14px;
      margin-right: 6px;
    }
  }
}
.input-dialog-simple {
  width: 400px !important;
  min-height: 150px;
  .el-dialog__body {
    padding: 5px 20px;
    .dialog-content {
      display: flex;
      flex-direction: column;
      .el-input-number {
        width: 100%;
      }
      .el-input__inner {
        width: 100%;
        height: 30px;
        font-size: 14px;
        text-align: left;
        &:focus {
          border-color: #4498f0;
        }
      }
      .error-input {
        .el-input__inner:focus {
          border-color: #ea5858;
        }
      }
      .el-input__suffix {
        .el-input__icon {
          line-height: 20px;
        }
      }
      .value-tip {
        font-size: 12px;
        color: #999999;
        margin-top: 5px;
      }
    }
  }
  .el-dialog__footer {
    button {
      padding: 0;
      width: 54px;
      height: 34px;
    }
  }
}
.setting-confirm {
  .el-message-box__container {
    .el-message-box__status {
      top: 10px;
    }
  }
}
.range-popper {
  padding: 0;
  .el-checkbox-group {
    display: flex;
    flex-direction: column;
    .el-checkbox {
      margin: 10px 0;
      display: flex;
      align-items: center;
      .el-checkbox__inner {
        border-radius: 50%;
      }
      .is-checked {
        .el-checkbox__inner {
          border-radius: 50%;
          background-color: #3e7eff;
          border-color: #3e7eff;
        }
        .el-checkbox__label {
          color: #3e7eff;
        }
      }
    }
  }
}
</style>
