<template>
  <div class="company-dept-user" :style="{ '--type-color': typeColor }">
    <div
      class="company-dept-user-breadcrumb"
      :class="`company-dept-user-breadcrumb-${type}`"
    >
      <mask-icon
        name="arrow"
        class="back-icon"
        :rotate="180"
        :size="12"
        @click.native="backToCompany"
      />
      <div class="items-wrapper">
        <span
          class="company-dept-user-breadcrumb-item"
          v-for="(item, index) in breadcrumb"
          :key="index"
          :title="item.name || item.corpName || item.label"
          @click="goBack({ dept: item, index })"
        >
          <!-- <span v-if="index > 0"> > </span> -->
          {{ item.name || item.corpName || item.label }}
          <mask-icon
            v-if="index !== breadcrumb.length - 1"
            name="arrow"
            :size="10"
          />
        </span>
      </div>
    </div>
    <dept-user-check-list
      :isLoading="isRequesting"
      :showData="showData"
      :type="type"
      :multipleSelect="multipleSelect"
      :checkedObj="checkedObj"
      :disabledObj="disabledObj"
      @changeDept="nextDept"
      @toggle-dept="
        dept => {
          $emit('toggle-dept', dept);
          refreshCheckAllStatus();
        }
      "
      @toggle-user="
        user => {
          $emit('toggle-user', user);
          refreshCheckAllStatus();
        }
      "
    />
  </div>
</template>

<script>
const typeColorMap = {
  organization: "#3e7eff",
  outsource: "#36d18e"
};
import { ConversationModel } from "../../../WebIM";
export default {
  name: "CompanyDeptUser",
  props: {
    userRefSetObj: Object,
    current: {
      type: Object,
      default: () => {
        return {};
      }
    },
    type: {
      type: String,
      default: "organization"
    },
    show: {
      type: Boolean,
      default: false
    },
    option: {
      type: Object,
      default: () => {
        return {};
      }
    },
    checkedObj: Object,
    disabledObj: Object,
    // 是否多选
    multipleSelect: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      showData: {
        // 选择组织结构列表展示数据
        depts: [],
        users: []
      },
      breadcrumb: [], // 面包屑
      currentPid: "", // 当前列表的父id
      loading: false,
      isRequesting: false,
      showNumCuttent: 0, // 当前部门人数
      checkAll: false,
      isCheckAll: false
    };
  },
  computed: {
    currentCompany() {
      return this.current || { label: "" };
    },
    typeColor() {
      return typeColorMap[this.type];
    },
    mergedOpt() {
      return {
        disableSelect: [],
        disableDept: [],
        disableDelete: this.option.disableDelete || [],
        type: 5,
        ...this.option
      };
    },
    selectedItemIds() {
      // 所有已选项id集合
      const itemIds = {
        dept: [],
        user: []
      };
      this.checkData.forEach(item => {
        if (item.isDept) {
          itemIds.dept.push(item.id);
        } else {
          itemIds.user.push(item.accountId);
        }
      });
      return itemIds;
    },
    selectLength() {
      // 已选人数
      let num = 0;
      const users = this.value.users || [];
      num += users.length;
      return num;
    },
    rootDeptId() {
      let result = "";
      if (this.currentCompany.rootDeptId) {
        result = this.currentCompany.rootDeptId || "";
      } else {
        if (this.currentCompany.corp) {
          result = this.currentCompany.corp.rootDeptId || "";
        }
      }
      return result;
    }
  },
  watch: {
    checkedObj: {
      deep: true,
      handler() {
        this.refreshCheckAllStatus();
      }
    },
    show(val, oldVal) {
      if (val) {
        this.init();
        this.breadcrumb.splice(0);
        if (this.currentCompany.id) {
          this.nextDept(this.currentCompany, this.rootDeptId);
        }
      }
    }
  },

  mounted() {
    this.init();
    if (this.currentCompany.id) {
      this.nextDept(this.currentCompany, this.rootDeptId);
    }
  },
  methods: {
    refreshCheckAllStatus() {
      const { depts, users } = this.showData;
      const hasUncheckedDept = depts.some(
        dept => !this.checkedObj[`${dept.corpId}-${dept.id}`]
      );
      const hasUncheckedUser = users.some(
        user => !this.checkedObj[user.accountId]
      );
      if (hasUncheckedDept || hasUncheckedUser) {
        this.isCheckAll = false;
      } else {
        this.isCheckAll = true;
      }
    },
    toggleCheckAll() {
      const { depts, users } = this.showData;
      if (this.isCheckAll) {
        this.isCheckAll = false;
        depts.forEach(dept => {
          const deptKey = `${dept.corpId}-${dept.id}`;
          if (this.checkedObj[deptKey]) {
            this.$emit("toggle-dept", { ...dept, isDept: true });
          }
        });
        users.forEach(user => {
          if (
            this.checkedObj[user.accountId] &&
            !this.disabledObj[user.accountId]
          ) {
            this.$emit("toggle-user", { ...user, isUser: true });
          }
        });
      } else {
        this.isCheckAll = true;
        depts.forEach(dept => {
          const deptKey = `${dept.corpId}-${dept.id}`;
          if (!this.checkedObj[deptKey]) {
            this.$emit("toggle-dept", { ...dept, isDept: true });
          }
        });
        users.forEach(user => {
          if (!this.checkedObj[user.accountId]) {
            this.$emit("toggle-user", { ...user, isUser: true });
          }
        });
      }
    },
    backToCompany() {
      this.$emit("backToCompany");
    },
    init() {
      this.showData.depts = [];
      this.showData.users = [];

      this.selectCorp = {};
      this.isShowCorp = true;
      this.groupName = this.option.groupName || "";
    },

    goBack({ dept, index }) {
      if (index === this.breadcrumb.length - 1) return;
      // 返回
      if (index) {
        this.nextDept(dept);
      } else {
        this.nextDept(this.currentCompany, this.rootDeptId);
      }
      this.breadcrumb.splice(index + 1);
    },
    nextDept(dept, dpId = "") {
      let deptId = 0;
      deptId = dpId || dept.id;
      this.currentPid = deptId;

      this.showNumCuttent = dept.userCnt || dept.num;
      this.isRequesting = true;
      this.showData = {
        depts: [],
        users: []
      };
      this.isCheckAll = false;
      this.getUsers(deptId)
        .then(res => {
          res.deptList.forEach(dept => {
            const deptKey = `${this.currentCompany.id}-${dept.id}`;
            if (typeof this.checkedObj[deptKey] !== "boolean") {
              this.$set(this.checkedObj, deptKey, false);
            }
          });
          let list = res.userList.map(item => {
            const user = { 
              ...item,
              conversationType: ConversationModel.IMConversationEnum.PRIVATE
            };
            return user;
          });
          this.showData = {
            depts: res.deptList,
            users: list
          };
          this.$emit("update-user-map", res.userList);
          this.refreshCheckAllStatus();
          this.currentPid = deptId;

          if (dept) {
            if (!Number(dept.pid)) {
              this.breadcrumb.splice(0);
              this.breadcrumb.push(dept);
            } else {
              if (this.breadcrumb.length) {
                let flag = 1;
                for (let i = 0; i < this.breadcrumb.length; i++) {
                  const element = this.breadcrumb[i];
                  if (element == dept) {
                    flag = 0;
                  }
                }
                if (flag) {
                  this.breadcrumb.push(dept);
                }
              } else {
                this.breadcrumb.push(dept);
              }
            }
          }
        })
        .catch(e => {
          console.log(e);
        })
        .finally(() => {
          this.isRequesting = false;
        });
    },
    getUsers(deptId = 0) {
      let corpAndCorpRelType = this.currentCompany.corpAndCorpRelType;
      return this.$service.getDeptUserPagelist
        .call(this, {
          corpId: this.currentCompany.id,
          pid: String(deptId),
          corpType: this.currentCompany.corpType,
          pageNum: 1,
          pageSize: 1000,
          corpAndCorpRelType,
          labelType: this.currentCompany.labelType
        })
        .then(result => {
          if (result) {
            const deptList = result.depts.list;
            const userList = result.users.list;
            return { deptList, userList };
          } else {
            return Promise.reject("data is null");
          }
        })
        .catch(error => {
          this.loading = false;
          return error;
        });
    }
  }
};
</script>
<style lang="scss" scoped>
@mixin flex($justify: flex-start, $align: center) {
  display: flex;
  justify-content: $justify;
  align-items: $align;
}
$--padding-right-or-left: 14px;

::v-deep .allCheck {
  width: 100%;
  height: 32px;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
  line-height: 32px;
  padding-left: 15px;
  .contNum {
    flex: 1;
    font-size: 12px;
    color: #8f959e;
    // margin-left: 200px;
    text-align: right;
    margin-right: 42px;
  }
  .all {
    display: flex;
    width: 284px;
    font-size: 12px;
    color: #5d616b;
    margin-left: 14px;
  }
}

</style>

<style lang="scss">
@mixin flex($justify: flex-start, $align: center) {
  display: flex;
  justify-content: $justify;
  align-items: $align;
}
$--padding-right-or-left: 14px;
.company-dept-user {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .company-dept-user-breadcrumb {
    margin-top: 16px;
    padding: 8px 16px;
    display: flex;
    align-items: baseline;
    // border: 1px solid #e7e7e7;
    background: #f4f6f8;
    flex-wrap: wrap;
    flex-shrink: 0;
    gap: 4px;
    --color: #8f959e;
    border: {
      left: 0;
      right: 0;
    }
    .back-icon {
      position: relative;
      top: 1px;
      cursor: pointer;
    }
    .items-wrapper {
      flex: 1;
      user-select: none;
    }
    .company-dept-user-breadcrumb-item {
      color: #3e7eff;
      --color: #3e7eff;
      cursor: pointer;
      max-width: 100%;
      overflow: hidden;
      // margin-bottom: 7px;
      font-size: 12px;
      line-height: 20px;
      // white-space: nowrap;
      text-overflow: ellipsis;
      &:last-child {
        color: #8f959e;
        cursor: default;
      }
    }
    &.company-dept-user-breadcrumb-outsource {
      .company-dept-user-breadcrumb-item {
        color: #36d18e;
        &:nth-last-child(1) {
          color: #8f959e;
        }
      }
    }
  }
  .dept-item {
    .check-icon {
      display: none;
    }
  }
}
</style>
