import { mapGetters, mapActions } from "vuex";
import globalConfig from "@/global.config";
const robot = globalConfig.robot;
const GetGroupInfo = {
  data() {
    return {
      groupInfo: {} // 群组信息
    };
  },
  computed: {
    ...mapGetters({
      corpUser: "GetCompany",
      AllUserMap: "GetAllUserMap",
      GetNotCorpUsers: "GetNotCorpUsers",
      OpenDialog: "GetOpenDialog",
      GetGroups: "GetGroups"
    })
  },
  methods: {
    ...mapActions(["PushGroup", "SetOpenDialog"]),
    /**
     * type， 类型： view查看从缓存中读取，没有时调接口获取， latest 直接或接口获取获取最新数据，cacheToRemote--先使用本地缓存同时进行远程数据更新
     * id： 群组id
     */
    async getGroupInfo(id, type = "latest") {
      if (type != "latest" && this.GetGroups[id]) {
        let groupInfo = this.GetGroups[id];
        this.groupInfo = { ...groupInfo };
        if (type === "cacheToRemote") {
          // 在使用缓存的基础上进行远程同步一下
          const data = {
            id: id
          };
          this.getGroupInfoRomote(data);
        }
      } else {
        const data = {
          id: id,
          corpId: this.corpUser.corp.id
        };
        await this.getGroupInfoRomote(data);
      }
    },
    getGroupInfoAsync(id, type = "latest") {
      if (type != "latest" && this.GetGroups[id]) {
        let groupInfo = this.GetGroups[id];
        if (groupInfo) {
          return Promise.resolve({ ...groupInfo });
        } else {
          this.getGroupInfo(id);
        }
      } else {
        const data = {
          id: id
        };
        return this.$service.groupInfoApi({ ...data });
      }
    },
    async getGroupInfoRomote(data) {
      try {
        const response = await this.$service.groupInfoApi({ ...data });
        if (response.data.code === "M0000" && response.data.data) {
          this.groupInfo = response.data.data;
          this.PushGroup(this.groupInfo);
          this.SetOpenDialog({
            ...this.OpenDialog,
            count: this.groupInfo.groupNumber,
            groupType: this.groupInfo.type
          });
        } else {
          throw response;
        }
      } catch (error) {
        this.$Message.error((error.data && error.data.msg) || "获取群属性失败");
      }
    },
    openAddMemberDialog(userIdList, groupInfo) {
      let userIds = userIdList || [];
      let memberAllList = [];
      memberAllList = userIds.map(item => {
        return {
          accountId: item
        };
      });
      this.$root.$emit("create-group", {
        disDel: memberAllList,
        disableDelete: [...userIdList],
        dialogType: "add",
        groupId: groupInfo.id,
        ...groupInfo
      });
    }
  }
};
export default GetGroupInfo;
