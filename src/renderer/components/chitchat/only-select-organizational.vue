<!--
 * @Author: lixiaowei
 * @Date: 2021-04-23 10:20:08
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-27 15:28:50
 * @Description: 组织架构选人
 * @FilePath: /zx-client-pc/src/renderer/components/chitchat/only-select-organizational.vue
-->
<template>
  <div class="select-right only-select-contact-wrapper">
    <div class="selected-crumbs-box" v-horwheel>
      <span @click="gobackCorpList">通讯录</span>
      <span
        v-for="(row, key) in titleArray"
        :key="key"
        @click="goBack({ dept: row, index: key })"
        >{{ row ? row.name : "" }}</span
      >
    </div>

    <ul
      class="select-content flex-auto corp-list-container"
      v-show="isShowCorp"
    >
      <li
        id="select-item-hover"
        class="select-item select-item-name"
        v-for="corp of corpList"
        :key="`corp-${corp.id}`"
        :title="corp.name"
        @click="selectCorpHandler(corp)"
      >
        <span class="select-item-name only-line">
          {{ corp.name }}
          <span class="user-count"> （{{ corp.userCnt }}） </span>
        </span>
        <span class="iconfont icon-jiantou-right"></span>
      </li>
    </ul>
    <ul class="select-content flex-auto" v-show="!isShowCorp">
      <!-- 组织结构 start -->
      <!-- 部门列表 -->
      <li
        id="select-item-hover"
        class="select-item"
        v-for="row in showData.depts"
        :key="`dp-${row.id}`"
      >
        <a-checkbox
          v-if="isShowCheckDept"
          class="mt-checkbox-circle"
          :disabled="mergedOpt.disableDept.includes(row.id)"
          :checked="checkDept.includes(row.id)"
          @click="clickItemHandle(row, 'dept')"
        ></a-checkbox>
        <p class="select-item-name group-title" @click="nextDept(row)">
          <span>
            {{ row.name }}
            <span
              class="user-count"
              :class="{ 'disabale-select': checkDept.includes(row.id) }"
            >
              （{{ row.userCnt }}）
            </span>
          </span>
          <span
            :class="{ 'disabale-select': checkDept.includes(row.id) }"
            class="iconfont icon-jiantou-right"
          ></span>
        </p>
      </li>

      <!-- 人员列表 -->
      <template v-if="mergedOpt.type !== 2">
        <li
          id="select-item-hover"
          class="select-item"
          v-for="row in showData.users"
          :key="`us-${row.id}`"
          @click="clickItemHandle(row, 'user')"
        >
          <a-checkbox
            class="mt-checkbox-circle"
            :checked="
              checkUser.includes(row.accountId) ||
                selected.includes(row.accountId)
            "
            :disabled="
              mergedOpt.disableSelect.includes(row.accountId) ||
                mergedOpt.disableDelete.includes(row.accountId)
            "
          >
          </a-checkbox>
          <user-photo :user="row" :key="row.id"></user-photo>
          <span class="select-item-name">{{ row.name }}</span>
        </li>
      </template>
      <!-- 组织结构 end -->
    </ul>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "OnlySelectOrganizational",
  props: {
    value: Object, // v-model绑定值，{users: [], depts: []}
    option: {
      type: Object,
      default: () => ({})
    },
    selected: { type: Array, default: () => [] }
  },
  data() {
    return {
      showData: {
        // 选择组织结构列表展示数据
        depts: [],
        users: []
      },
      deptMap: {}, // 部门对应关系
      titleArray: [], // 组织架构面包屑数据
      checkDept: [], // 组织架构选中的部门id
      checkUser: [], // 组织架构选中的人id
      checkData: [], // 组织架构选中的数据
      currentCheckUser: [], // 当前选中人员的id
      currentPid: "", // 当前列表的父id
      loading: false,
      disableSelected: {
        names: [],
        ids: []
      }, // 选中部门时，部门下所有被禁选人员姓名
      deepDeptFlag: {
        total: 0,
        current: 0
      }, // 递归部分时统计判断递归什么时候完成
      isShowCorp: true, // 是否显示公司列表
      selectCorp: {} // 选择的公司
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    ...mapGetters({
      CompanyInfo: "GetCompany",
      UserInfo: "GetUser"
    }),
    /**
     * 登陆用户公司列表
     */
    corpList() {
      let corpUsers = this.UserInfo.corpUsers || [];
      return corpUsers.map(corpUser => corpUser.corp || {});
    },
    /**
     * 当前切换的公司Id
     */
    companyId() {
      return String(this.CompanyInfo.corpId);
    },
    /**
     * 登录用户Id
     */
    loginUserId() {
      return this.CompanyInfo.id;
    },
    /**
     * 已选展示数据数组转对象
     */
    showDataByObj() {
      const result = {
        depts: {},
        users: {}
      };

      this.showData.depts.forEach(dept => {
        result.depts[dept.id] = dept;
      });
      this.showData.users.forEach(user => {
        result.users[user.accountId] = user;
      });
      return result;
    },
    mergedOpt() {
      // 当用户传入的option中不存在相关值时，设置默认值
      let option = {
        type: 5, // 1：选择人，2：选择部门，3：选择部门+人，4：只能选人, 5: 选择人+部门，展示人+部门，返回值为人
        radio: false, // true：单选，false：多选
        disableSelect: [], // 禁止选择人选id
        disableDept: [], // 禁止选择部门id
        disableDelete: [], // 禁止删除人员（id）
        disableWarning: "禁止被选择", // 用户选择被禁选人员时的提示语
        checkedNext: false, // 部门选中之后是否很能点击进入，true：可以，false：禁止
        isSelectCorp: true, // 是否能选公司
        ...this.option
      };
      return option;
    },
    /**
     * 是否显示选部门按钮
     */
    isShowCheckDept() {
      let flag = true;

      flag =
        !this.mergedOpt.radio ||
        this.mergedOpt.type === 3 ||
        this.mergedOpt.type === 5 ||
        (this.mergedOpt.radio && this.mergedOpt.type === 2);
      flag =
        this.mergedOpt.type !== 4 &&
        !(this.mergedOpt.radio && this.mergedOpt.type === 1);
      return flag;
    },
    selectedItemIds() {
      // 所有已选项id集合
      const itemIds = {
        dept: [],
        user: []
      };
      this.checkData.forEach(item => {
        let id = "";
        if (item.isDept) {
          itemIds.dept.push(item.id);
        } else {
          itemIds.user.push(item.accountId);
        }
      });
      return itemIds;
    }
  },
  watch: {
    input: {
      deep: true,
      handler(val, oldVal) {}
    },
    checkData: {
      deep: true,
      handler(val) {
        let data = { depts: [], users: [] };
        val.forEach(item => {
          if (item.isDept) {
            data.depts.push(item);
          } else {
            data.users.push(item);
          }
        });
        this.$emit("input", data);
      }
    }
  },
  methods: {
    init() {
      let userIds = [],
        deptIds = [];
      this.showData.depts = [];
      this.showData.users = [];
      this.checkUser.splice(0);
      this.checkDept.splice(0);
      const users = this.value.users || [];
      const depts = this.value.depts || [];
      users.forEach(user => {
        userIds.push(user.accountId);
        this.checkUser.push(user.accountId);
      });
      if (this.mergedOpt.dialogType === "add") {
        this.checkUser = this.checkUser.concat(this.mergedOpt.disableSelect);
      }
      depts.forEach(dept => {
        dept.isDept = true;
        deptIds.push(dept.id);
        this.checkDept.push(dept.id);
      });
      this.currentCheckUser = [...userIds];
      this.checkData = [...users, ...depts];
      this.selectCorp = {};
      this.isShowCorp = true;
    },
    CheckChangeDept(val) {
      // 选择部门的checkGroup选择回调
      this.testIsChecked();
    },
    CheckChangeUser(val) {
      // 组织架构users的checkGroup选择回调
      this.testIsChecked();
      const differUser = val.filter(
        accountId => this.currentCheckUser.indexOf(accountId) === -1
      ); // 差分出当前被选择人员
      this.currentCheckUser = [...val];
      for (let i = 0; i < differUser.length; i++) {
        const differAccountId = differUser[i];
        for (let j = 0; j < this.showData.users.length; j++) {
          const user = this.showData.users[j];
          if (
            user.accountId === differAccountId &&
            !this.selectedItemIds.user.includes(user.accountId)
          ) {
            this.pushUser(user);
          }
        }
      }
    },
    gobackCorpList() {
      this.isShowCorp = true;
      this.showData.depts.splice(0);
      this.showData.users.splice(0);
      this.titleArray.splice(0);
    },
    goBack({ dept, index }) {
      // 返回
      this.titleArray.splice(index + 1);
      if (index) {
        this.nextDept(dept);
      } else {
        this.nextDept(dept, dept.rootDeptId);
      }
    },
    nextDept(dept, dpId = "") {
      let deptId = 0;
      deptId = dpId || dept.id;
      this.currentPid = deptId;
      if (!this.mergedOpt.checkedNext && this.checkDept.includes(deptId)) {
        return;
      }
      this.getUsers(deptId).then(res => {
        this.showData = {
          depts: res.deptList,
          users: res.userList
        };
        this.currentPid = deptId;
        this.testIsChecked({
          depts: res.deptList,
          users: res.userList
        });

        if (dept) {
          if (!Number(dept.pid)) {
            this.titleArray.splice(0);
            this.titleArray.push(dept);
          } else {
            if (this.titleArray.length) {
              let flag = 1;
              for (let i = 0; i < this.titleArray.length; i++) {
                const element = this.titleArray[i];
                if (element == dept) {
                  flag = 0;
                }
              }
              if (flag) {
                this.titleArray.push(dept);
              }
            } else {
              this.titleArray.push(dept);
            }
          }
        }
      });
    },
    getUsers(deptId = 0) {
      return this.$service.getSubDeptUserPagelist
        .call(this, {
          corpId: this.selectCorp.id,
          pid: String(deptId),
          corpType: this.selectCorp.corpTypeEnums,
          pageNum: 1
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
    },
    checkDeptHandle(deptIds) {
      if ([1, 5].includes(this.mergedOpt.type)) {
        // 选择部门时获取所有人员
        this.deepDeptFlag.total += deptIds.length;
        deptIds.forEach(deptId => {
          this.getUsers(deptId).then(result => {
            ++this.deepDeptFlag.current;
            const userIdList = new Set();
            result.userList.forEach(user => {
              userIdList.add(user.accountId);
              if (this.mergedOpt.disableSelect.includes(user.accountId)) {
                if (!this.disableSelected.ids.includes(user.accountId)) {
                  this.disableSelected.names.push(user.name);
                  this.disableSelected.ids.push(user.accountId);
                }
              } else {
                if (this.checkUser.indexOf(user.accountId) === -1) {
                  // 第5种情况，从部门选中人员不需要展示给用户
                  user.isHide = [5].includes(this.mergedOpt.type);
                  this.pushUser(user);
                }
              }
            });
            const deptIdList = [];
            result.deptList.forEach(dept => {
              deptIdList.push(dept.id);
              if (this.checkDept.indexOf(dept.id) === -1) {
                this.checkDept.push(dept.id);
              }
            });
            this.$set(this.deptMap, deptId, { userIdList, deptIdList });
            if (deptIdList.length) {
              this.checkDeptHandle(deptIdList);
            } else if (this.deepDeptFlag.current === this.deepDeptFlag.total) {
              this.deepDeptFlag.total = 0;
              this.deepDeptFlag.current = 0;
              this.loading = false;
              if (this.disableSelected.names.length) {
                this.$message({
                  type: "warning",
                  showClose: true,
                  duration: 3000,
                  message: `${this.disableSelected.names.join(",")} ${
                    this.mergedOpt.disableWarning
                  }`,
                  onClose: () => {}
                });
                this.disableSelected.names.splice(0);
                this.disableSelected.ids.splice(0);
              }
            }
          });
        });
      }
    },
    cancelCheckDept(deptIds) {
      if (![2, 3].includes(this.mergedOpt.type)) {
        deptIds.forEach(deptId => {
          const index = this.checkDept.indexOf(deptId);
          if (index > -1) {
            this.checkDept.splice(index, 1);
          }
          const childDepts = this.deptMap[deptId].deptIdList;
          const childUsers = this.deptMap[deptId].userIdList;
          childUsers.forEach(deptId => {
            this.deleteUser(deptId);
          });
          this.cancelCheckDept(childDepts);
        });
      }
    },
    cancelCheckUser(userIds) {
      // 取消选择人员
      userIds.forEach(userId => {
        this.deleteUser(userId);
      });
    },
    pushDept(dept) {
      // 添加部门
      if (this.mergedOpt.radio) {
        this.checkDept.splice(0);
        this.checkUser.splice(0);
        this.checkData.splice(0);
        this.currentCheckUser.splice(0);
      }
      dept.isDept = true;
      !this.checkDept.includes(dept.id) && this.checkDept.push(dept.id);
      if (!this.selectedItemIds.dept.includes(dept.id)) {
        this.checkData.push(dept);
      }
    },
    pushUser(user) {
      // 添加选中人
      if (this.mergedOpt.radio) {
        this.checkDept.splice(0);
        this.checkUser.splice(0);
        this.checkData.splice(0);
        this.currentCheckUser.splice(0);
      }
      !this.checkUser.includes(user.accountId) &&
        this.checkUser.push(user.accountId);
      !this.currentCheckUser.includes(user.accountId) &&
        this.currentCheckUser.push(user.accountId);
      if (!this.selectedItemIds.user.includes(user.accountId)) {
        this.checkData.push(user);
      }
    },
    deleteDept(id) {
      const index = this.checkDept.indexOf(id);
      if (index > -1) {
        this.checkDept.splice(index, 1);
      }

      const selectIndex = this.checkData.findIndex(
        item => item.isDept && item.id === id
      );
      if (selectIndex > -1) {
        this.checkData.splice(selectIndex, 1);
      }
    },
    deleteUser(accountId) {
      // 删除选中人
      if (!this.mergedOpt.disableDelete.includes(accountId)) {
        const index = this.checkUser.indexOf(accountId);
        const currentUserIndex = this.currentCheckUser.indexOf(accountId);
        if (index > -1) {
          this.checkUser.splice(index, 1);
        }
        if (currentUserIndex) {
          this.currentCheckUser.splice(currentUserIndex, 1);
        }
        const selectIndex = this.checkData.findIndex(
          item => !item.isDept && item.accountId === accountId
        );
        if (selectIndex > -1) {
          this.checkData.splice(selectIndex, 1);
        }
      }
    },
    closeTag(item) {
      // 关闭标签, 删除人员;
      if (item.isDept) {
        this.deleteDept(item.id);
        this.cancelCheckDept([item.id]);
      } else {
        this.deleteUser(item.accountId);
      }
    },
    testIsChecked({ depts, users } = this.showData) {
      // 检测是否选中
      let deptCheckCount = 0,
        userCheckCount = 0;
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        if (this.checkUser.indexOf(user.accountId) !== -1) {
          ++userCheckCount;
        }
      }
      for (let i = 0; i < depts.length; i++) {
        const dept = depts[i];
        if (this.checkDept.indexOf(dept.id) !== -1) {
          ++deptCheckCount;
        }
      }
      let result = { depts, users, isCheckAll: false };
      if (
        userCheckCount !== 0 &&
        deptCheckCount === depts.length &&
        userCheckCount === users.length
      ) {
        result.isCheckAll = true;
        if (
          this.mergedOpt.type === 1 &&
          this.currentPid !== 0 &&
          this.checkDept.indexOf(this.currentPid) === -1
        ) {
          this.checkDept.push(this.currentPid);
        }
      } else {
        const index = this.checkDept.indexOf(this.currentPid);
        if (this.mergedOpt.type === 1 && userCheckCount !== 0 && index !== -1) {
          this.checkDept.splice(index, 1);
        }
      }
      return result;
    },
    /**
     * 公司选择处理
     */
    selectCorpHandler(corp) {
      this.selectCorp = corp;
      this.nextDept(corp, corp.rootDeptId);
      this.isShowCorp = false;
    },
    /**
     * 部门/人 点击事件
     */
    clickItemHandle(data, type, onlyCancel = false) {
      let operate = "add"; // 操作类型，添加/删除
      if (type === "dept") {
        // 处理部门
        const { checkDept, mergedOpt } = this;
        const { id: deptId } = data;
        if (checkDept.includes(deptId)) {
          // 取消选中
          if ([2, 3, 5].includes(mergedOpt.type)) {
            // 可选择部门情景下删除选择的部门
            this.deleteDept(deptId);
          }
          // 删除子部门及部门下人员
          this.cancelCheckDept([deptId]);
          operate = "delete";
        } else if (!onlyCancel) {
          // 选中
          ![2, 3].includes(mergedOpt.type) && (this.loading = true); // 展示查询子部门及部门下人员loading
          if ([2, 3, 5].includes(mergedOpt.type)) {
            this.pushDept(this.showDataByObj.depts[deptId]);
          }
          this.checkDeptHandle([deptId]);
        }
      } else if (type === "user") {
        // 处理人
        const { checkUser } = this;
        const { accountId } = data;
        if (
          checkUser.includes(accountId) ||
          this.selected.includes(accountId)
        ) {
          // 取消选中
          this.cancelCheckUser([accountId]);
          // 如果选中人员id集合为空，则清空对应的人员、部门选中集合
          if (!checkUser.length && this.mergedOpt.type === 1) {
            this.checkData.splice(0);
            this.checkDept.splice(0);
          }
          operate = "delete";
        } else if (!onlyCancel) {
          this.pushUser(data);
        }
      }

      this.$emit("checked", { item: data, type, operate });
    },
    /**
     * 取消选择
     * @param {String} id 取消选中项的id
     * @param {'dept'|'user'} type 取消选中项的类型 dept | user
     */
    cacelSelect(id, type) {
      const temp_data = {};
      if (type === "user") {
        temp_data.accountId = id;
      } else {
        temp_data.id = id;
      }
      this.clickItemHandle(temp_data, type, true);
    }
  },
  directives: {
    randomcolor: {
      bind(el) {
        const index = Math.ceil(Math.random() * 6);
        const color = [
          "#4598f0",
          "#85c4ff",
          "#dddc6e",
          "#f0b5fa",
          "#f8aeb2",
          "#99b9f7",
          "#8eda90"
        ][index];
        if (el.tagName !== "IMG") {
          el.style.backgroundColor = color;
          el.style.color = "#fff";
        }
      }
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

@mixin lineheight($height) {
  height: $height;
  line-height: $height;
}

@mixin floor-layers() {
  @include flex(space-between);
  flex-direction: column;
}
.flex-none {
  flex: none;
}
.flex-auto {
  flex: 1;
}
$--padding-right-or-left: 14px;

.only-select-contact-wrapper {
  width: 100%;
  height: 100%;
  background-color: #fff;
  flex-shrink: 0;
  @include floor-layers();
  overflow: hidden;

  .select-content {
    flex: 1;
    position: relative;
    width: 100%;
    overflow: hidden auto;
  }

  .select-item {
    width: 100%;
    @include flex();
    padding: 10px 20px;
    box-sizing: border-box;
  }
  #select-item-hover:hover {
    background-color: #e4e6ea;
  }
  .select-item-name {
    flex: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: #333;
    cursor: pointer;
    span {
      color: #1f2329;

      &.user-count {
        color: #8f959e;
      }
      &.disabale-select {
        color: #dde0e3;
      }
    }
    .iconfont {
      font-size: 12px;
      color: #c9cfd8;
    }

    &.group-title {
      margin: {
        left: 10px;
      }
    }
  }
  .selected-crumbs-box {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    height: 30px;
    overflow: auto hidden;
    padding: 0 20px;
    > span {
      flex: none;
      font-size: 12px;
      text-decoration: none;
      color: #269ae8;
      font-weight: bold;
      cursor: pointer;
      user-select: none;
      &:not(:first-of-type) {
        &::before {
          display: inline-block;
          content: "/";
          padding: 0 2px;
          color: #8f959e;
        }
      }
      &:last-of-type {
        color: #8f959e;
        cursor: default;
      }
    }
  }
}
</style>
