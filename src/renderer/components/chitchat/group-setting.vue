<template>
  <div class="group-setting">
    <div class="group-basic-info">
      <group-photo class="group-sign" :group="OpenDialog"></group-photo>
      <div class="group-basic-right">
        <div class="group-basic-right-name" v-if="!nameEditing">
          {{ getGroupName }}
          <group-sign :type="OpenDialog.groupType"></group-sign>
          <div class="group-basic-edit" @click="editName"></div>
        </div>
        <div class="group-basic-right-name" id="edit-group-name" v-else>
          <el-input
            placeholder="请输入内容"
            v-model="groupName"
            :autofocus="true"
            maxlength="12"
            :class="groupName.length == 0 ? 'error-input' : ''"
            @blur="saveName('blur')"
            @keyup.enter.native="saveName('enter')"
            clearable
          ></el-input>
        </div>
        <div class="group-basic-right-position">
          <span v-show="!nameEditing && groupInfo.type < 10">
            {{ groupInfo.corpName }}
          </span>
          <span v-show="nameEditing">
            {{ groupName.length == 0 ? "群名称不可为空" : "回车保存" }}
          </span>
          <span v-show="nameEditing">{{ groupName.length }}/12</span>
        </div>
      </div>
    </div>
    <div class="setting-content">
      <form-item
        v-for="item in getForm"
        :key="item.key"
        v-show="item.show"
        :groupMembers="memberAllList"
        :option="item"
        @addMember="addMember"
        @changeValue="changeValue"
        @changeGroupAttr="changeGroupAttr"
        @close="$emit('close')"
        @show-robot="showRobotPanelHandle"
      ></form-item>
    </div>
    <transition name="darwerRight">
      <robot-manage
        v-if="robotManageVisible"
        :group="groupInfo"
        @close="
          () => {
            robotManageVisible = false;
          }
        "
        @update-group="updateGroupHandle"
        @robot-info="showRobotInfoHandle"
      ></robot-manage>
    </transition>
    <transition name="darwerRight">
      <robot-info
        v-if="robotInfoVisible"
        :group="groupInfo"
        :robot="currentRobot"
        @close="closeRobotHandle"
      ></robot-info>
    </transition>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";
import { ConversationModel } from "../../WebIM";
import FormItem from "@/components/chitchat/form/form-item";
import RobotManage from "./group/robot-manage";
import RobotInfo from "./group/robot-info";
import moment from "moment";
import globalConfig from "@/global.config";
const robot = globalConfig.robot;
import GetGroupInfo from "../../mixin/getGroupInfo";
export default {
  components: { FormItem, RobotManage, RobotInfo },
  mixins: [GetGroupInfo],
  data() {
    return {
      form: [
        {
          type: "member",
          label: "群成员",
          hasBottom: true,
          list: [],
          key: "member",
          add: true,
          isOwner: false,
          search: true,
          show: true,
        },
        {
          type: "text",
          label: "群属性",
          hasBottom: false,
          text: "",
          key: "groupType",
          groupType: "",
          show: true,
        },
        {
          type: "text",
          label: "创建时间",
          hasBottom: false,
          text: "",
          key: "createAtTime",
          show: true,
        },
        {
          type: "text",
          label: "群归属企业",
          hasBottom: false,
          text: "",
          key: "corpName",
          show: true,
        },
        {
          type: "range",
          label: "群成员范围",
          hasBottom: false,
          list: [],
          value: "",
          corpId: "",
          key: "corpList",
          canEdit: false,
          show: true,
        },
        {
          type: "confirm",
          label: "智能群助手",
          hasBottom: true,
          value: false,
          text: "0个",
          key: "robot",
          show: true,
        },
        {
          type: "switch",
          label: "置顶聊天",
          hasBottom: false,
          value: false,
          key: "stick",
          show: true,
        },
        {
          type: "switch",
          label: "消息免打扰",
          hasBottom: true,
          value: false,
          key: "isHint",
          show: true,
        },
        {
          type: "switch",
          label: "仅群主可管理",
          hasBottom: false,
          childLabel: "启用后，仅群主可修改群名称、邀请群成员",
          value: false,
          key: "onlyOwnerManage",
          show: true,
        },
        {
          type: "switch",
          label: "仅群主可@所有人",
          hasBottom: false,
          value: false,
          key: "onlyOwnerAtAll",
          show: true,
        },
        {
          type: "inputNumber",
          label: "群人数上限",
          hasBottom: false,
          value: 0,
          min: "",
          key: "userLimit",
          show: true,
        },
        {
          type: "confirm",
          label: "群主移交",
          hasBottom: true,
          value: "",
          list: [],
          key: "owner",
          show: true,
        },
        {
          type: "confirm",
          confirmLabel: "确定要清空此会话的聊天记录？",
          label: "清空聊天记录",
          value: false,
          key: "clear",
          show: true,
          hasBottom: false,
        },
        {
          type: "confirm",
          label: "退出群聊",
          confirmLabel: "确定要退出此群聊？",
          confirmContent: "",
          key: "quit",
          show: true,
          hasBottom: false,
        },
      ], //群设置表单
      nameEditing: false, //是否正在编辑名称
      groupName: "", //群名称
      robotManageVisible: false,
      robotInfoVisible: false,
      currentRobot: {}, // 当前点击查看详情机器人
      memberAllList: [],
    };
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      corpUser: "GetCompany",
      GetDialog: "GetConversationSort",
      GetNotCorpUsers: "GetNotCorpUsers",
      AllUserMap: "GetAllUserMap",
    }),
    getForm() {
      let isTop = this.GetDialog.topList
        .map((item) => item.id)
        .includes(this.OpenDialog.id);
      let isOwner = this.groupInfo.owner === this.corpUser.accountId;
      let data = this.form.map((item) => {
        //表单初始化
        if (item.key == "member" && this.groupInfo.owner) {
          // 群成员
          item.label = `群成员(${this.groupInfo.groupNumber})`;
          let list = [...(this.groupInfo.groupMembers || [])];
          list.unshift(this.groupInfo.owner);
          item.list = [...list];
          item.add = this.groupInfo.onlyOwnerManage == 0 || isOwner;
          item.isOwner = isOwner;
        } else if (item.key == "stick") {
          // 是否置顶
          item.value = isTop;
        } else if (item.key == "isHint") {
          // 是否消息免打扰
          item.value = this.OpenDialog.isHint;
        } else if (["quit", "dismiss"].includes(item.key)) {
          // 解散、退出群聊
          item.label = isOwner ? "解散群聊" : "退出群聊";
          item.confirmLabel = `确定要${isOwner ? "解散" : "退出"}此群聊？`;
          item.confirmContent = isOwner
            ? "解散后全部聊天记录会被清空"
            : "退出后您将不再收到此群聊消息";
          item.key = isOwner ? "dismiss" : "quit";
        } else if (
          ["onlyOwnerManage", "onlyOwnerAtAll", "userLimit", "owner"].includes(
            item.key
          )
        ) {
          // 群主管理部分
          item.show = isOwner;
          if (item.key == "owner") {
            //移交群主
            item.value = this.groupInfo[item.key];
            item.list = this.groupInfo.groupMembers;
          } else if (item.key == "userLimit") {
            // 群成员限制
            item.value = this.groupInfo[item.key];
            item.min = this.groupInfo.groupNumber;
          } else {
            item.value = this.groupInfo[item.key] == 1 ? true : false;
          }
        } else if (item.key === "robot") {
          item.text = `${(this.groupInfo.groupRobots || []).length}个`;
        } else if (item.key === "groupType") {
          item.text = this.groupInfo.type < 10 ? "组织群" : "外联群";
          item.groupType =
            this.groupInfo.type < 10 ? "organization" : "outsource";
        } else if (item.key === "createAtTime") {
          item.text = moment(this.groupInfo.createAt).format("YYYY年MM月DD日");
        } else if (item.key === "corpName") {
          item.text = this.groupInfo.corpName;
          // 外联群不展示此字段
          item.show = this.groupInfo.type < 10;
        } else if (item.key === "corpList") {
          item.canEdit = isOwner;
          item.list = this.groupInfo.corpIdList || [];
          item.corpId = this.groupInfo.corpId; // 群所属公司
          item.value = `共${item.list.length}家`;
          // 外联群不展示此字段
          item.show = this.groupInfo.type < 10;
        }
        return item;
      });
      return data;
    },
    getGroupName() {
      return this.groupInfo.name;
    },
  },
  watch: {
    OpenDialog: {
      deep: true,
      handler(val, old) {
        if (val.id !== old.id) {
          this.getGroupInfo(this.OpenDialog.id, "cacheToRemote");
        }
      },
    },
    "groupInfo.groupMembers": {
      deep: true,
      async handler(val, old) {
        if (val != old && JSON.stringify(val) != JSON.stringify(old)) {
          await this.getUsers([this.groupInfo.owner, ...(val || [])]);
        }
      },
    },
  },
  beforeDestroy() {
    this.$root.$off("close-create-dialog", this.closeCreateDialogHandle);
  },
  mounted() {
    this.getGroupInfo(this.OpenDialog.id, "cacheToRemote");
    this.$root.$on("close-create-dialog", this.closeCreateDialogHandle);
  },
  methods: {
    ...mapActions(["RenameGroup", "PushGroup"]),
    /**
     * 获取群成员详细信息
     */
    async getUsers(userIds) {
      // let userIds = this.option.list || [];
      this.memberAllList = [];
      // 展示成员或移交群主才获取用户信息
      userIds.forEach(async (element) => {
        let user =
          this.AllUserMap[element] ||
          this.GetNotCorpUsers[element] ||
          this.GetNoRelateUser[element];
        robot[element];
        if (!user) {
          try {
            const res =
              await this.$service.getAccountInformationOrganization.call(this, {
                id: element,
              });
            if (res) {
              let userInfo = { ...res, accountId: res.id };
              !this.memberAllList.find(
                (userItem) => userItem.accountId === res.id
              ) &&
                this.memberAllList.push({
                  ...userInfo,
                  isOwner: this.groupInfo.owner === user.accountId,
                });
            }
          } catch (error) {
            console.log(error, "获取用户信息失败");
          }
        } else {
          !this.memberAllList.find(
            (userItem) => userItem.accountId === (user.accountId || user.id)
          ) &&
            this.memberAllList.push({
              ...user,
              isOwner: this.groupInfo.owner === (user.accountId || user.id),
            });
        }
      });
    },
    closeRobotHandle() {
      this.robotInfoVisible = false;
    },
    /**       *      据
     */
    changeValue(value) {
      let index = this.form.findIndex((item) => item.key == value.key);
      this.form.splice(index, 1, value);
      if (
        ["onlyOwnerManage", "onlyOwnerAtAll", "userLimit", "corpList"].includes(
          value.key
        )
      ) {
        this.updateGroupInfo(value);
      } else {
        this.getGroupInfo(this.OpenDialog.id);
      }
    },
    changeGroupAttr(data) {
      let isTop = this.GetDialog.topList
        .map((item) => item.id)
        .includes(this.OpenDialog.id);
      this.$service.setGroupAttribute.call(this, {
        ...data,
        topStatus: isTop ? 1 : 2,
        doNotDisturb: this.OpenDialog.isHint ? 1 : 2,
      });
    },
    focusInput(id) {
      this.$nextTick(() => {
        let content = document.getElementById(id);
        let input =
          content && content.getElementsByClassName("el-input__inner")[0];
        input && input.focus();
      });
    },
    async getUserByAccountId(accountId) {
      let user = this.AllUserMap[accountId] || this.GetNotCorpUsers[accountId];
      if (!user) {
        try {
          const res =
            await this.$service.getAccountInformationOrganization.call(this, {
              id: accountId,
            });
          if (res) {
            user = { ...res, accountId: res.id };
          }
        } catch (error) {
          console.log(error, "获取用户信息失败");
        }
      }
      return user;
    },
    /**       *
     */ async addMember() {
      let groupMembers = this.groupInfo.groupMembers || [];
      const owner = await this.getUserByAccountId(this.groupInfo.owner);
      this.openAddMemberDialog([...groupMembers, this.groupInfo.owner], {
        users: [owner],
        id: this.OpenDialog.id,
        name: this.groupInfo.name,
        limit: this.groupInfo.userLimit,
        groupNumber: this.groupInfo.groupNumber,
        groupType: this.groupInfo.type,
        corpIdList: this.groupInfo.corpIdList,
        corpId: this.groupInfo.corpId,
      });
    },
    /**       *      ，
     *      理(0-否, 1-是)
     *      所有人(0-否, 1-是)
     *      制数量
     */ updateGroupInfo(value) {
      let groupData = {
        corpId: this.groupInfo.id,
        groupId: this.OpenDialog.id,
        onlyOwnerManage: this.form.find((item) => item.key == "onlyOwnerManage")
          .value
          ? 1
          : 0,
        onlyOwnerAtAll: this.form.find((item) => item.key == "onlyOwnerAtAll")
          .value
          ? 1
          : 0,
        userLimit: Number(
          this.form.find((item) => item.key == "userLimit").value
        ),
        corpIdList: value.list || this.groupInfo.corpIdList,
      };
      this.$service
        .updateGroup(groupData)
        .then((res) => {
          this.getGroupInfo(this.OpenDialog.id);
          setTimeout(() => {
            this.$Message.success("修改群信息成功");
          }, 500);
        })
        .catch((error) => {
          this.$Message.error("修改群信息失败");
        });
    },
    /**       *
     */
    editName() {
      if (
        this.groupInfo.onlyOwnerManage == 0 ||
        this.groupInfo.owner === this.corpUser.accountId
      ) {
        this.groupName = this.groupInfo.name;
        this.nameEditing = true;
        this.focusInput("edit-group-name");
      } else {
        this.$Message.warning("您没有权限修改群名称");
      }
    },
    /**       *
     */ async saveName(type = "blur") {
      if (this.groupName.length == 0 && this.nameEditing) {
        if (type == "blur") {
          this.groupName = this.groupInfo.name;
          this.nameEditing = false;
        }
        return;
      } else {
        if (this.groupName == this.groupInfo.name) {
          this.nameEditing = false;
          return;
        }
        let groupInfo = {};
        try {
          //获取最新群信息
          const response = await this.getGroupInfoAsync(this.OpenDialog.id);
          if (response.data && response.data.data) {
            groupInfo = response.data.data;
          } else {
            throw new Error();
          }
        } catch (error) {
          // 如果获取最新群信息失败则使用当前群信息
          groupInfo = { ...this.groupInfo };
        }
        if (
          groupInfo.onlyOwnerManage == 0 ||
          groupInfo.owner === this.corpUser.accountId
        ) {
          let groupData = {
            ...this.OpenDialog,
            groupId: this.OpenDialog.id,
            name: this.groupName,
            corpIdList: groupInfo.corpIdList,
          };

          this.$service
            .updateGroup(groupData)
            .then((res) => {
              this.RenameGroup({
                id: this.OpenDialog.id,
                newName: this.groupName,
                conversationType: ConversationModel.IMConversationEnum.GROUP,
              });
              this.$Message.success("修改群名称成功");
              this.getGroupInfo(this.OpenDialog.id);
            })
            .catch((error) => {
              this.$Message.error("修改群名称失败");
            })
            .finally(() => {
              setTimeout(() => {
                this.nameEditing = false;
              }, 200);
            });
        } else {
          this.nameEditing = false;
          this.$Message.warning("您没有权限修改群名称");
        }
      }
    },
    closeCreateDialogHandle(type) {
      if (type == "confirm") {
        this.getGroupInfo(this.OpenDialog.id);
      }
    },
    showRobotPanelHandle() {
      this.robotManageVisible = true;
    },
    updateGroupHandle() {
      this.getGroupInfo(this.OpenDialog.id);
    },
    showRobotInfoHandle(robot) {
      this.currentRobot = robot;
      this.robotInfoVisible = true;
    },
  },
};
</script>

<style lang="scss">
.group-setting {
  flex: 1;
  overflow: hidden;
  padding: 0 20px;
  box-sizing: border-box;
  overflow-y: auto;
  .group-basic-info {
    display: flex;
    align-items: center;
    padding-bottom: 15px;
    box-sizing: border-box;
    border-bottom: 1px solid #e7e7e7;
    .group-photo {
      margin: 0;
    }
    .group-basic-right {
      line-height: 1;
      margin-left: 15px;
      flex: 1;
      .group-basic-right-name {
        display: flex;
        font-size: 14px;
        color: #000;
        margin-bottom: 4px;
        align-items: center;
        .group-sign {
          vertical-align: top;
          margin: 0 2px;
        }
        .group-basic-edit {
          width: 16px;
          height: 16px;
          cursor: pointer;
          background-size: 100%;
          background-repeat: no-repeat;
          background-position: center center;
          background-image: url("~@/assets/image/chitchat/edit.png");
          &:hover {
            background-image: url("~@/assets/image/chitchat/edit-active.png");
          }
        }
        .el-input__inner {
          height: 20px;
          font-size: 12px;
          padding: 0 5px;
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
      }
      .group-basic-right-position {
        font-size: 10px;
        color: #999999;
        display: flex;
        justify-content: space-between;
      }
    }
  }
}
</style>
