<template>
  <transition name="modal">
    <section class="create-group-wrapper" v-if="visible">
      <div class="create-group-bg" @click="closeHandler()"></div>
      <div class="create-group-container">
        <div class="create-group-header">
          {{type=="create"?"发起群聊":"邀请成员"}}
          <button
            class="close-btn iconfont icon-close"
            @click="closeHandler()"
          ></button>
        </div>
        <select-organizational
          class="select-user"
          v-model="select"
          :visible="visible"
          :option="selectOpt"
          @cancel="closeHandler()"
          @confirm="confirmHandler"
        ></select-organizational>
      </div>
    </section>
  </transition>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { ConversationModel } from "@/WebIM";
import getGroupInfo from "../../../mixin/getGroupInfo"
export default {
  name: "CreateGroup",
  components: {},
  mixins: [getGroupInfo],
  props: {
    option: Object,
    visible: Boolean
  },
  data() {
    return {
      select: {
        depts: [],
        users: []
      }, // 选中值
      selectOpt: {
        type: 5,
        radio: false,
        disableDelete: [],
        disableSelect: [],
        groupName: ""
      },
      isCreating: false, // 是否正在创建
      type: "create", //类型add邀请成员 create创建群聊
      groupId: "", //邀请成员的群id
    };
  },
  created() {},
  mounted() {},
  computed: {
    ...mapGetters(["GetCompany"])
  },
  watch: {
    visible(state) {
      if (state) {
        const users = this.option.users || [];
        const disDel = this.option.disDel || [];
        users.forEach(user => {
          this.select.users.push(user);
        });
        disDel.forEach(user => {
          this.selectOpt.disableDelete.push(user.accountId);
          this.selectOpt.disableSelect.push(user.accountId);
        });
        this.type = this.option.dialogType || "create";
        this.selectOpt.groupName = this.option.name;
        this.selectOpt.type = this.option.type || 5;
        this.selectOpt.dialogType = this.type;
        this.groupId = this.option.groupId;
      } else {
        this.select.depts.splice(0);
        this.select.users.splice(0);
        this.selectOpt.disableDelete.splice(0);
        this.selectOpt.disableSelect.splice(0);
      }
    }
  },
  methods: {
    ...mapActions(["PushDialogue", "SetOpenDialog"]),
    closeHandler(type = "cancel") {
      this.$emit("update:visible", false);
      this.$root.$emit("close-create-dialog", type);
    },
    confirmHandler({ name }) {
      // 确定创建群
      if (this.isCreating) {
        return;
      }
      this.isCreating = true;
      //创建群聊
      if(this.type == "create") {
        if (this.select.users.length < 3) {
          let list = this.select.users.filter(
            user => user.accountId !== this.GetCompany.accountId
          );
          const user = list[0];
          if (user) {
            // 直选中一个人时，打开会话
            let dialogue = new ConversationModel.IMConversation(
              {
                id: user.accountId,
                avatar: user.avatar,
                name: user.name,
                corpId: user.corpId
              },
              ConversationModel.IMConversationEnum.PRIVATE
            );
            this.PushDialogue(dialogue);
            this.SetOpenDialog(dialogue);
            this.$router.push({ name: "chitchat" });
          }
          this.isCreating = false;
          this.closeHandler();
          return;
        }
        let type = 3; // 群类型，默认内部群
        // let tempCorpId = ""; // 临时公司id，用于比较是否存在不同公司人员
        let groupMembers = []; // 群成员
        let createName = ""; // 默认生成的群名称，用户没有输入群名称时使用

        this.select.users.forEach((user, index) => {
          if (index < 3) {
            !!createName
              ? (createName += `、${user.name}`)
              : (createName = user.name);
          }
          /**
           * 暂时无外部群，此外部群逻辑定义错误
           */
          /* !tempCorpId && (tempCorpId = user.corpId);
          if (user.corpId != tempCorpId) {
            type = 4; // 存在不同公司人员，群类型为外部群
          } */
          if (user.accountId !== this.GetCompany.accountId) {
            groupMembers.push(user.accountId);
          }
        }); // 群名称

        createName = name || createName;

        this.$service
          .createGroup({
            corpId: this.GetCompany.corpId,
            name: createName,
            type,
            owner: this.GetCompany.accountId,
            creator: this.GetCompany.accountId,
            onlyOwnerManage: 0, //仅群主可管理：默认关。
            onlyOwnerAtAll: 0, //仅群主可@所有人：默认关。
            groupMembers
          })
          .then(result => {
            const groupId = result.data.data;
            this.closeHandler("confirm");
            let dialogue = new ConversationModel.IMConversation(
              {
                id: groupId,
                name: createName,
                creator: this.GetCompany.accountId,
                createAt: Date.now(),
                count: groupMembers.length + 1
              },
              ConversationModel.IMConversationEnum.GROUP
            );
            this.PushDialogue(dialogue);
            this.SetOpenDialog(dialogue);
            this.$router.push({ name: "chitchat" });
            this.isCreating = false;
          })
          .catch(error => {
            this.isCreating = false;
          });
      } else {
        //邀请群成员
        this.addMember();
      }
    },
    /**
     * 添加群成员
     */
    async addMember() {
      let groupInfo = {};
      try {
        //获取最新群信息
        const response = await this.getGroupInfoAsync(this.groupId);
        if(response.data && response.data.data ) {
          groupInfo = response.data.data
        } else {
          throw(new Error());
        }
      } catch (error) {
        // 如果获取最新群信息失败则默认不能添加
        groupInfo = {};
      }
      if((groupInfo && groupInfo.onlyOwnerManage == 0) || this.GetCompany.accountId == groupInfo.owner) {
        let groupMembers = []; // 群成员
        this.select.users.forEach((user, index) => {
          if (user.accountId !== this.GetCompany.accountId && !this.selectOpt.disableDelete.includes(user.accountId)) {
            groupMembers.push(user.accountId);
          }
        });
        let data = {
          groupId: this.groupId,
          name: this.selectOpt.groupName,
          corpId: this.GetCompany.corpId,
          accountIds: groupMembers,
          operationId: this.GetCompany.accountId
        }
        this.$service.quitGroup("join", data)
          .then(() => {
            this.$Message.success("邀请成员成功");
            this.closeHandler("confirm");
          })
          .catch((error) =>{
            if(error.data && error.data.code == "M_U_001") {
              this.$Message.warning(`添加成员失败，群上限${this.option.limit}人，现有${this.option.groupNumber}人`);
            } else {
              this.$Message.error("添加成员失败");
            }
          })
          .finally(() => {
            this.isCreating = false;
          })
      } else {
        this.$Message.warning("您没有权限添加群成员");
      }
    }
  }
};
</script>
<style lang="scss" scoped>
$--container-height: 540px;
$--header-height: 48px;
$-select-height: $--container-height - $--header-height;
.create-group-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  .create-group-bg {
    width: 100%;
    height: 100%;
    background-color: rgba($color: #000000, $alpha: 0.3);
  }

  .create-group-container {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 686px;
    height: $--container-height;
    background: rgba(255, 255, 255, 1);
    box-shadow: 0px 0px 12px 0px rgba(105, 107, 112, 0.3);
    border-radius: 6px;
    overflow: hidden;
  }
  .create-group-header {
    position: relative;
    width: 100%;
    height: $--header-height;
    line-height: $--header-height;
    text-align: center;
    font-size: 16px;
    background-color: #eff3f6;
    .close-btn {
      position: absolute;
      right: 9px;
      top: 13px;
      padding: 5px;
      font-size: 12px;
      line-height: 1;
      color: #999;
    }
  }
  .select-user {
    height: $-select-height;
  }
}
</style>
