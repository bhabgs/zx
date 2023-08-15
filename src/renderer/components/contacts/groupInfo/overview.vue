<template>
  <div class="group-info">
    <div class="group-info-header">
      <span>群信息</span>
    </div>
    <div class="group-info-content" v-show="groupDetail.name">
      <div class="group-info-content-top">
        <group-photo class="group-icon" :group="groupDetail"></group-photo>
        <p class="group-info-name">
          <span v-text="groupDetail.name"></span>
          <group-sign :type="groupDetail.type"></group-sign>
        </p>
      </div>
      <!-- <p class="group-info-company">{{ groupDetail.corpName }}</p> -->
      <div class="group-basic-info">
        <div v-for="item in showList" :key="item.type">
          <div class="label">{{ item.label }}</div>
          <div class="value">
            <span v-if="!Array.isArray(item.value)">{{ item.value }}</span>
            <span v-else v-for="corp in item.value" :key="corp.id">
              {{
                corp.corpName
              }}
            </span>
          </div>
        </div>
      </div>
      <div class="send-btn-wrapper" v-show="groupDetail.name">
        <button @click="handleSend">进入群聊</button>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import globalConfig from "@/global.config";
const robot = globalConfig.robot;
import moment from "moment";
export default {
  name: "overview",
  props: ["groupDetail", "groupMembersLimit", "groupMembers"],
  components: {},
  data() {
    return {
      selected: "",
      showList: [
        { label: "群主：", type: "owner", value: "" },
        { label: "人数：", type: "groupNumber", value: "" },
        { label: "属性：", type: "attribute", value: "" },
        { label: "创建时间：", type: "createTime", value: "" }
      ]
    };
  },
  computed: {
    ...mapGetters({
      AllUserMap: "GetAllUserMap",
      GetNotCorpUsers: "GetNotCorpUsers"
    })
  },
  watch: {
    groupDetail: {
      deep: true,
      handler() {
        this.getShowList();
      }
    }
  },
  methods: {
    async getShowList() {
      for (let index = 0; index < this.showList.length; index++) {
        const element = this.showList[index];
        if (element.type === "owner") {
          const user = await this.getUserInfo(this.groupDetail.owner);
          element.value = user.name || user.nickName;
        } else if (element.type === "attribute") {
          element.value = this.groupDetail.type != 10 ? "组织群" : "外联群";
        } else if (element.type === "createTime") {
          element.value = moment(this.groupDetail.createAt).format(
            "YYYY年MM月DD日"
          );
        } else {
          element.value = this.groupDetail[element.type];
        }
      }
      if (this.groupDetail.type < 10) {
        this.showList = this.showList.filter(
          item => !["corpName", "corpIdList"].includes(item.type)
        );
        const corpIdList = this.groupDetail.corpIdList || [];
        this.showList.push(
          {
            label: "群归属企业：",
            type: "corpName",
            value: this.groupDetail.corpName
          },
          {
            label: "群成员范围：",
            type: "corpIdList",
            value: corpIdList.length ? corpIdList : "暂无"
          }
        );
      }
    },
    async getUserInfo(useId) {
      let user =
        this.AllUserMap[useId] || this.GetNotCorpUsers[useId] || robot[useId];
      if (!user) {
        try {
          const res = await this.$service.getAccountInformationOrganization.call(
            this,
            { id: useId }
          );
          if (res) {
            user = { ...res, accountId: res.id };
          }
        } catch (error) {
          console.log(error, "获取用户信息失败");
        }
      }
      return user;
    },
    handleMore() {
      this.$emit("on-more");
    },
    handleSend() {
      this.$emit("on-send");
    },
    handleClickPhoto(row) {
      this.selected = row;
    },
    handleHide() {
      this.selected = "";
    }
  }
};
</script>
<style lang="scss" scoped>
.group-info {
  width: 100%;
  height: 100%;
  .group-info-header {
    width: 100%;
    height: 40px;
    line-height: 40px;
    padding-left: 20px;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(231, 231, 231, 1);
    background: white;
    font-weight: bold;
  }
  .group-info-name {
    font-weight: 400;
    color: #1f2329;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .group-info-company {
    text-align: center;
    margin-top: 5px;
    font-size: 10px;
    color: #999999;
  }
  .group-info-content {
    margin-top: 15%;
    display: flex;
    align-items: center;
    flex-direction: column;
    .group-info-content-top {
      width: 260px;
      display: flex;
      align-items: center;
    }
    .group-icon {
      margin-right: 10px;
      width: 34px;
      height: 34px;
      flex: 0 0 34px;
      margin-left: 0;
    }

    .group-members-wrapper {
      .group-members-title {
        font-weight: bold;
        color: rgba(33, 33, 33, 1);
        margin: {
          top: 50px;
          bottom: 20px;
        }
        text-align: center;
      }

      .group-members-list-wrapper {
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .group-members-item {
        width: 46px;
        height: 46px;
        &:not(:last-of-type) {
          margin-right: 10px;
        }
        .user-icon {
          margin: 0;
          cursor: pointer;
          height: 46px;
          width: 46px;
        }
      }
      .show-more {
        border: 1px solid #ccc;
        border-radius: 50%;
      }
      .group-members-show-more {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-top: 2px;
        width: 100%;
        height: 100%;
        font-weight: 600;
        font-size: 20px;
        color: #ccc;
        background-color: inherit;
      }
    }
  }
  .group-basic-info {
    margin-top: 8px;
    display: flex;
    align-items: center;
    flex-direction: column;
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    > div {
      display: flex;
      width: 260px;
      margin-top: 16px;
      .label {
        color: #8f959e;
        white-space: nowrap;
      }
      .value {
        color: #1f2329;
        display: flex;
        flex-direction: column;
      }
    }
  }
  .send-btn-wrapper {
    text-align: center;
    > button {
      margin-top: 24px;
      width: 260px;
      height: 34px;
      line-height: 34px;
      background: #3e7eff;
      border-radius: 2px;
      color: #fff;
      border-radius: 4px;
    }
  }
}
</style>
