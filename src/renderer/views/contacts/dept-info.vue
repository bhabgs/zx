<template>
  <div
    class="dept-info-container"
    :class="`dept-info-container-${contactType}`"
  >
    <div class="dept-info-left" v-if="GetSelectDept && GetSelectDept.id">
      <div class="dept-list-header" :title="GetSelectDept.name">
        <span
          v-text="GetSelectDept.name || GetSelectDept.label"
          class="only-line"
        ></span
        ><span>（{{ GetSelectDept.userCnt || GetSelectDept.num }}）</span>
      </div>
      <h6 class="dept-list-title">成员</h6>
      <ul class="dept-list-user-wrapper">
        <li
          v-for="(user, index) of userList"
          :key="index"
          :class="{ selected: user.id === selecteId }"
          @click="selectHandle(user)"
          :title="user.name"
        >
          <user-photo :user="user"></user-photo>
          <span class="only-line user-name" v-text="user.name"></span>
        </li>
      </ul>
    </div>

    <div class="dept-info-right" v-if="GetSelectDept && GetSelectDept.id">
      <user-detail
        v-if="selecteId"
        :type="GetSelectDept.line"
        :options="{ ...userDetailOptions, deptId: GetSelectDept.id }"
      ></user-detail>
      <not-select-chat v-else :showTitle="false"></not-select-chat>
    </div>
  </div>
</template>
<script>
import userDetail from "@/components/contacts/user-detail";
import { mapGetters } from "vuex";

export default {
  name: "DeptDetail",
  components: {
    userDetail
  },
  props: {
    listType: {
      type: String,
      default: "organization"
    }
  },
  data() {
    return {
      source: null,
      userList: [],
      selecteId: "",
      selectAccount: "",
      count: 0 // ABA workaround
    };
  },
  created() {},
  mounted() {
    this.$nextTick(() => {
      if (this.deptId) {
        this.getDeptUsers();
      }
    });
  },
  computed: {
    ...mapGetters(["GetSelectDept"]),
    corpId() {
      return this.GetSelectDept.corpId;
    },
    deptId() {
      return this.GetSelectDept.id;
    },
    corpAndCorpRelType() {
      let corpAndCorpRelType = 0;
      switch (this.GetSelectDept.corpAndCorpRelTypeEnums) {
        case "UP_CORP":
          corpAndCorpRelType = 1;
          break;
        case "DWON_CORP":
          corpAndCorpRelType = 2;
          break;
        case "OTHER":
          corpAndCorpRelType = 3;
          break;
      }
      return corpAndCorpRelType;
    },
    userDetailOptions() {
      let options = {
        id: this.selecteId,
        userId: this.selecteId,
        corpId: this.corpId,
        deptId: this.deptId,
        accountId: this.selectAccount,
        labelType: this.GetSelectDept.labelType
      };
      return options;
    },
    contactType() {
      return this.listType;
    }
  },
  watch: {
    GetSelectDept: {
      deep: true,
      handler(newVal) {
        if (this.deptId || newVal.children) {
          this.selecteId = "";
          this.userList.splice(0);
          this.getDeptUsers();
        }
      }
    }
  },
  methods: {
    getDeptUsers() {
      const children = this.GetSelectDept.children || [];
      const userList = children.filter(item => item.type == 5);
      const c = ++ this.count;
      if (userList && userList.length) {
        this.userList = [...userList].map(item => {
          return {
            ...item,
            avatar: item.logo || item.avatar,
            name: item.label || item.name
          };
        });
      } else {
        this.source && this.source.cancel({ code: "cancel" });
        this.source = this.$CancelToken.source();
        this.$service.getUserListByDept
          .call(this, {
            corpId: this.corpId,
            deptIds: [this.deptId],
            corpAndCorpRelType: this.corpAndCorpRelType,
            corpType: this.GetSelectDept.corpType,
            config: {
              cancelToken: this.source.token
            }
          })
          .then(result => {
            if(c < this.count) return;
            this.userList = result || [];
          })
          .catch(e => {
            console.error(e);
          });
      }
    },
    selectHandle(user) {
      this.selecteId = user.id;
      this.selectAccount = user.accountId;
    }
  }
};
</script>
<style lang="scss" scoped>
$--dept-list-header-height: 40px;
$--dept-list-title-height: 26px;
$--dept-list-user-wrapper-height: calc(100% - 60px);

.dept-info-container {
  display: flex;
  width: 100%;
  height: 100%;
  // 布局
  .dept-info-left {
    width: 200px;
    flex: 0 200px;
    height: 100%;
    background-color: #fff;
    border-right: 1px solid #e7e7e7;
    overflow: hidden;
  }
  .dept-info-right {
    flex: 1;
  }

  // 左半部分内容
  .dept-list-header {
    padding: 0 8px;
    display: flex;
    width: 100%;
    height: $--dept-list-header-height;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid #e7e7e7;
    > span {
      &:first-of-type {
        font-size: 12px;
        font-family: SourceHanSansCN-Regular, SourceHanSansCN;
        font-weight: 400;
        color: #1f2329;
      }
      &:last-of-type {
        color: #999;
      }
    }
  }
  .dept-list-title {
    padding: 0 8px;
    height: $--dept-list-title-height;
    line-height: $--dept-list-title-height;
    color: #8f959e;
    font-size: 12px;
    background-color: #e0e4e8;
    opacity: 0.5;
  }
  .dept-list-user-wrapper {
    height: $--dept-list-user-wrapper-height;
    overflow-y: auto;
    > li {
      display: flex;
      align-items: center;
      height: 48px;
      border-bottom: 1px solid#F4F6F8;
      cursor: pointer;
      transition: all 0.15s ease-in-out;
      font-size: 14px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #5d616b;
      .user-photo {
        width: 32px;
        height: 32px;
        margin-left: 16px;
        margin-right: 8px;
        flex: 0 0 32px;
      }
      &.selected {
        background: linear-gradient(
          90deg,
          rgba(62, 126, 255, 0.8) 0%,
          #3e7eff 100%
        );
        color: #fff;
      }
    }
  }
  &.dept-info-container-organization {
    .selected,
    .select-group,
    .send-btn-wrapper > button {
      background: linear-gradient(
        90deg,
        rgba(62, 126, 255, 0.8) 0%,
        #3e7eff 100%
      ) !important;
    }
  }
  &.dept-info-container-outsource {
    .selected,
    .select-group,
    .send-btn-wrapper > button {
      background: #36d18e !important;
    }
  }
}
</style>
