import { mapGetters, mapActions } from "vuex";
import { ConversationModel } from "../WebIM";
import { ipcRenderer } from "electron";
const SearchMixin = {
  props: {
    isRequesting: {
      type: Boolean,
      default: false
    },
    defaultCheckType: {
      type: String,
      default: "organization"
    }
  },
  data() {
    return {
      showHistory: true
    };
  },
  computed: {
    ...mapGetters({
      GroupInfoMap: "GetGroups",
      AllUserMap: "GetAllUserMap",
      AllOrganizationUserIds: "GetAllOrganizationUserIds",
      loginUser: "GetUser"
    }),
    showNoData() {
      if (this.search && !this.isRequesting) {
        if (this.searchResultList && !this.searchResultList.length) {
          return true;
        } else {
          return false;
        }
      } else {
        if (!this.showLocalHistory.length) {
          return true;
        } else {
          return false;
        }
      }
    }
  },
  methods: {
    ...mapActions(["SetContentTime", "SetIsGetHistoryStatus"]),
    setDefaultFilter() {
      if (this.defaultCheckType) {
        this.filterList[0].check = this.defaultCheckType === "organization";
        this.filterList[1].check = this.defaultCheckType === "outsource";
      }
    },
    resetFilter() {
      this.filterList = this.filterList.map(item => {
        return {
          ...item,
          check: false
        };
      });
    },
    hideHistory() {
      this.showHistory = false;
    },
    async selectHandle(item, IsGetHistoryStatus = false) {
      console.log("搜索结果", item);
      let tempResult = {};
      let itemInfo = {
        value: item.content,
        id: item.id
      };
      let typeKey = "";
      switch (item.type) {
        case "contact":
          let users =
            (await ipcRenderer.invoke("sqlite-query", {
              key: "queryContatByAccountId",
              input: { accountIds: [item.id] }
            })) || [];
          let user;
          if (users.length < 1) {
            user = await this.$service.getAccountInformationOrganization.call(
              this,
              { id: item.id }
            );
            users =
              (await ipcRenderer.invoke("sqlite-query", {
                key: "queryContatByAccountId",
                input: { accountIds: [item.id] }
              })) || [];
          }
          users = users.sort((a, b) => {
            let atype = a.type || a.form;
            let btype = b.type || b.form;
            return atype > btype ? 1 : -1;
          });
          user = users[0];
          itemInfo = {
            ...user,
            accountId: item.id,
            isUser: true
          };
          typeKey = `${ConversationModel.IMConversationEnum.PRIVATE}_${item.id}`;
          break;
        case "group":
          let group = this.GroupInfoMap[item.id] || {};
          if (!group || !Object.keys(group).length) {
            const result = await this.$service.groupInfoApi.call(this, {
              id: item.id
            });
            if (result && result.data && result.data.data) {
              group = result.data.data;
            }
          }
          typeKey = `${ConversationModel.IMConversationEnum.GROUP}_${group.id}`;
          itemInfo = {
            ...group,
            isgroup: true
          };
          break;
        case "record":
          this.$emit("changeSearch", item);
          break;
        case "robot":
          itemInfo = {
            ...item,
            isUser: true,
            avatar: item.iconUrl
          };
          break;
        default:
          //聊天记录
          break;
      }
      if (IsGetHistoryStatus) {
        this.SetIsGetHistoryStatus({ key: typeKey, status: true });
      } else {
        this.SetContentTime("");
      }

      if (itemInfo && item.type !== "record") {
        if (itemInfo.accountId && itemInfo.accountId.includes("robot_")) {
          await this.setLocalstorage({
            id: itemInfo.accountId,
            value: JSON.stringify({ ...itemInfo, type: "robot" }),
            type: "robot"
          });
        } else {
          if (!IsGetHistoryStatus) {
            tempResult.type = item.type;
            tempResult.id = item.id;
            tempResult.value = itemInfo.name || itemInfo.nickName;
            await this.setLocalstorage(tempResult);
          }
        }
        this.$emit("selectHandle", itemInfo);
      }
    },
    async showMessageHandle(record) {
      if (record.dialogueId) {
        const data = {
          type: record.dialogueType === "PRIVATE" ? "contact" : "group",
          id: record.dialogueId
        };
        await this.setLocalstorage({
          type: "record",
          value: record.search,
          id: record.dialogueId
        });
        this.SetContentTime(`${record.dialogueId}_${record.contentTime}`);
        this.selectHandle(data, true);
      }
    },
    async setLocalstorage(local) {
      // const localStorageName = `${this.loginUser.id}_localSearchHistory`;
      // let temp = localStorage.getItem(localStorageName);
      // let localHistory = [];
      // if (temp) {
      //   localHistory = JSON.parse(temp);
      // }
      // const index = localHistory.findIndex(
      //   item =>
      //     (item.id == local.id && item.type == local.type) ||
      //     (item.type === "record" &&
      //       item.value == local.value &&
      //       item.type == local.type)
      // ); // 当联系人、群组ID一致时替换或者聊天记录搜索内容一致时替换
      // if (index > -1) {
      //   localHistory.splice(index, 1);
      // }
      // localHistory.unshift(local);
      // if (localHistory.length > 12) {
      //   localHistory.pop();
      // }
      // localStorage.setItem(localStorageName, JSON.stringify(localHistory));
      await ipcRenderer.invoke("sqlite-url", {
        key: "setLocalSearchHistory",
        data: [local]
      });
      this.$emit("changeLocal");
    },
    async clearLocal() {
      // const localStorageName = `${this.loginUser.id}_localSearchHistory`;
      // localStorage.removeItem(localStorageName);
      (await ipcRenderer.invoke("sqlite-url", {
        key: "clearLocalSearchHistory"
      })) || [];
      this.$emit("changeLocal");
    }
  }
};

export default SearchMixin;
