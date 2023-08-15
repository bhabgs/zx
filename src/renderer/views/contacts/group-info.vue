<template>
  <div class="group" :class="`group-${contactType}`">
    <div class="group-left">
      <div class="group-left-header">
        <div class="group-left-header-title">
          我的{{ listType === "organization" ? "组织" : "外联" }}群组
        </div>
        <!-- <el-dropdown trigger="click" @command="sortHandle">
          <span class="el-dropdown-link">
            <img src="@/assets/image/contacts/sort.png" alt="" />
          </span>
          <el-dropdown-menu slot="dropdown">
            <el-dropdown-item command="1">按对话列表排序</el-dropdown-item>
            <el-dropdown-item command="2">按创建时间倒序</el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown> -->
      </div>
      <group-list
        @selectGroup="selectGroupHandle"
        :listType="listType"
      ></group-list>
    </div>
    <div class="group-right">
      <overview
        v-if="selectGroup"
        :groupDetail="groupDetail"
        :groupMembersLimit="groupMembersLimit"
        :groupMembers="groupMembers"
        @on-send="createSend"
      ></overview>
      <not-select-chat v-else :showTitle="false"></not-select-chat>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { ConversationModel } from "@/WebIM";
import Overview from "@/components/contacts/groupInfo/overview";
import GroupList from "@/components/contacts/group-list";

export default {
  name: "GroupInfo",
  components: {
    Overview,
    GroupList
  },
  props: {
    listType: {
      type: String,
      default: "organization"
    }
  },
  data() {
    return {
      isShowAll: false,
      groupDetail: {},
      cancelToken: null,
      selectGroup: ""
    };
  },
  created() {
    let watchCompany = this.$watch("LoginCompany", () => {});
  },
  mounted() {
    if (this.LoginCompany.corpId) {
      this.init();
    } else {
      let watchCompany = this.$watch("LoginCompany", () => {
        this.init();
      });
    }
  },
  computed: {
    ...mapGetters({ AllUserMap: "GetAllUserMap", LoginCompany: "GetCompany" }),
    groupMembers() {
      let list = [];
      if (this.groupDetail.owner && this.groupDetail.groupMembers) {
        list = [this.groupDetail.owner, ...this.groupDetail.groupMembers];
      }
      return list;
    },
    groupMembersLimit() {
      let members = [...this.groupMembers];
      return members.splice(0, 6);
    },
    contactType() {
      return this.listType;
    }
  },
  watch: {
    selectGroup() {
      if (this.selectGroup) {
        this.init();
      }
    }
  },
  methods: {
    ...mapActions(["PushDialogue", "SetOpenDialog", "SetContentTime"]),
    selectGroupHandle(groupId) {
      this.selectGroup = groupId;
    },
    sortHandle(type) {
      // 排序
    },
    init() {
      if (this.selectGroup) {
        this.cancelToken && this.cancelToken.cancel("cancel");
        this.cancelToken = this.$CancelToken.source();
        this.$service.groupInfoApi
          .call(
            this,
            { id: this.selectGroup },
            {
              cancelToken: this.cancelToken.token
            }
          )
          .then(response => response.data)
          .then(result => {
            this.groupDetail = { ...result.data };
          })
          .catch(error => {
            if (error && error.message == "cancel") {
              return;
            }
            let msg = "获取群详情失败";
            if (error && error.data && error.data.msg) {
              msg = error.data.msg;
            }
            this.$message.error(msg);
          });
      }
    },
    createSend() {
      this.SetContentTime("");
      let dialogue = new ConversationModel.IMConversation(
        {
          id: this.groupDetail.id,
          name: this.groupDetail.name,
          corpId: this.groupDetail.corpId,
          creator: this.groupDetail.creator,
          createAt: this.groupDetail.createAt,
          count: this.groupDetail.groupNumber,
          groupType: this.groupDetail.type
        },
        ConversationModel.IMConversationEnum.GROUP
      );
      this.PushDialogue(dialogue);
      this.SetOpenDialog({ ...dialogue, groupType: dialogue.groupType });
      this.$router.push({ name: "chitchat", query: { type: this.listType } });
    }
  }
};
</script>
<style lang="scss" scoped>
.group {
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  .group-left {
    width: 207px;
    height: 100%;
    border-right: 1px solid #e7e7e7;
    .group-left-header {
      height: 40px;
      border-bottom: 1px solid #e7e7e7;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0px 16px 0 10px;
      font-size: 12px;
      font-family: SourceHanSansCN-Regular, SourceHanSansCN;
      font-weight: 400;
      color: #1f2329;
      background: #fff;
      img {
        width: 14px;
        height: 14px;
      }
    }
    .group-list-wrapper {
      height: calc(100% - 41px);
    }
  }
  .group-right {
    flex: 1;
  }
  &.group-organization {
    ::v-deep .selected,
    ::v-deep .select-group,
    ::v-deep .send-btn-wrapper > button {
      background: linear-gradient(
        90deg,
        rgba(62, 126, 255, 0.8) 0%,
        #3e7eff 100%
      ) !important;
    }
  }
  &.group-outsource {
    ::v-deep .selected,
    ::v-deep .select-group,
    ::v-deep .send-btn-wrapper > button {
      background: #36d18e !important;
    }
  }
}
</style>
