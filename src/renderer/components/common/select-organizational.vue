<template>
  <section id="selection-organizational-wrapper">
    <div class="select" v-loading="loading">
      <div class="select-left">
        <div class="item-info">
          <div class="item-info-list chengyuan-list">
            <div
              class="tag-item"
              v-for="row in checkData"
              :key="`tag-${row.id}`"
              v-show="!row.isHide"
              :class="{
                'disable-del': mergedOpt.disableDelete.includes(row.accountId)
              }"
            >
              <span class="only-line" v-text="row.name"></span>
              <button
                @click="closeTag(row)"
                class="iconfont icon-_huabanfuben2"
              ></button>
            </div>
            <div class="search-wrapper" v-if="mergedOpt.type !== 2">
              <input
                class="search-input"
                placeholder="搜索"
                v-model="SearchText"
                maxlength="15"
              />
            </div>
          </div>
          <!-- 搜索结果展示 start -->
          <div v-if="isSearch" class="search-result-wrapper">
            <p
              class="search-noresult-content"
              v-if="searchReasult && searchData.length == 0"
            >
              没有匹配到任何结果
            </p>
            <ul class="search-result-content" v-else>
              <li
                class="candidate-list"
                v-for="(row, k) in searchData"
                :key="k + 'search'"
                @click.stop="selectSearchUser(row)"
              >
                <user-photo :user="row" :key="`s-${row.id}`"></user-photo>
                <div class="list-info">
                  <p>{{ row.name }}</p>
                  <p>{{ row.corpName }}</p>
                </div>
              </li>
            </ul>
          </div>
          <!-- 搜索结果展示 end -->
        </div>
        <div class="group-info">
          <p class="group-info-title">
            <span
              >群名称<span v-show="!mergedOpt.groupName"
                >&nbsp;-&nbsp;</span
              ></span
            ><span v-show="!mergedOpt.groupName">选填</span>
          </p>
          <el-input
            placeholder="取个群名称方便后续搜索"
            size="small"
            v-model="groupName"
            :disabled="!!mergedOpt.groupName"
            maxLength="12"
            clearable
          ></el-input>
          <div class="group-button">
            <el-button
              size="small"
              type="primary"
              :disabled="!isDisableCreate"
              @click="confirmHandler()"
              >确定({{ selectLength }})</el-button
            >
            <el-button size="small" @click="cancelHandler()">取消</el-button>
          </div>
        </div>
      </div>
      <div class="select-right">
        <ul class="corp-list-container" v-show="isShowCorp">
          <li
            class="corp-item"
            v-for="corp of corpList"
            :key="`corp-${corp.id}`"
            :title="corp.name"
          >
            <img :src="corp.logo" alt="" />
            <button
              class="only-line"
              v-text="corp.name"
              @click="selectCorpHandler(corp)"
            ></button>
          </li>
        </ul>
        <div class="select-content flex-auto" v-show="!isShowCorp">
          <p class="select-active-corp">
            <button @click="gobackCorpList()">
              <span class="iconfont icon-jiantou-right"></span
              ><span class="only-line">{{ selectCorp.name }}</span>
            </button>
          </p>
          <p class="select-right-title flex-none">
            <a href="javascript:;">联系人</a>
            <a
              href="javascript:;"
              v-for="(row, key) in titleArray"
              :key="key"
              @click="goBack({ dept: row, index: key })"
              >{{ row ? row.name : "" }}</a
            >
          </p>
          <ul class="select-right-list flex-auto">
            <!-- 组织结构 start -->
            <!-- 部门列表 -->
            <el-checkbox-group v-model="checkDept" @change="CheckChangeDept">
              <li
                class="select-right-item"
                v-for="row in showData.depts"
                :key="`dp-${row.id}`"
              >
                <el-checkbox
                  v-if="isShowCheckDept"
                  :label="row.id"
                  :disabled="mergedOpt.disableDept.includes(row.id)"
                  >{{ "" }}</el-checkbox
                >
                <p class="select-item-name group-title" @click="nextDept(row)">
                  <span v-text="row.name"></span>
                  <button
                    :class="{ 'disabale-select': checkDept.includes(row.id) }"
                  >
                    {{ row.userCnt }}&nbsp;&nbsp;<i
                      class="iconfont icon-jiantou-right"
                    ></i>
                  </button>
                </p>
              </li>
            </el-checkbox-group>

            <!-- 人员列表 -->
            <el-checkbox-group
              v-if="mergedOpt.type !== 2"
              v-model="checkUser"
              @change="CheckChangeUser"
            >
              <li
                class="select-right-item"
                v-for="row in showData.users"
                :key="`us-${row.id}`"
              >
                <el-checkbox
                  :label="row.accountId"
                  :disabled="
                    mergedOpt.disableSelect.includes(row.accountId) ||
                      mergedOpt.disableDelete.includes(row.accountId)
                  "
                >
                  <user-photo :user="row" :key="row.id"></user-photo>
                  <span class="select-item-name">{{ row.name }}</span>
                </el-checkbox>
              </li>
            </el-checkbox-group>
            <!-- 组织结构 end -->
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
<script>
import { mapGetters } from "vuex";

export default {
  name: "SelectOrganizational",
  props: {
    value: Object, // v-model绑定值，{users: [], depts: []}
    visible: {
      type: Boolean,
      required: true
    },
    option: {
      type: Object,
      default: () => ({})
    }
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
      SearchText: "", // 搜索内容
      searchData: [], // 搜索结果
      isSearch: false, // 是否在搜索
      searchTimeOut: null, // 搜索时方法执行延迟
      searchReasult: false,
      isShowCorp: true, // 是否显示公司列表
      selectCorp: {}, // 选择的公司
      groupName: "" // 群组名称
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
        type: 1, // 1：选择人，2：选择部门，3：选择部门+人，4：只能选人, 5: 选择人+部门，展示人+部门，返回值为人
        radio: true, // true：单选，false：多选
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
    },
    selectLength() {
      // 已选人数
      let num = 0;
      const users = this.value.users || [];
      num += users.length;
      return num;
    },
    isDisableCreate() {
      let flag = true;
      if (!!this.mergedOpt.groupName) {
        flag = this.selectLength > 0;
      } else {
        flag = this.selectLength - this.mergedOpt.disableDelete.length;
      }
      return flag;
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
    },
    SearchText(val) {
      // 人员搜索
      this.searchData = [];
      clearTimeout(this.searchTimeOut);
      if (!!val) {
        this.isSearch = true;
        this.searchTimeOut = setTimeout(() => {
          this.getSearchData(val);
        }, 300);
      } else {
        this.isSearch = false;
      }
    },
    checkDept(val, oldVal) {
      if (val.length > oldVal.length) {
        // 选中
        const addArray = val.slice(oldVal.length); // 新增选中部门id数组
        ![2, 3].includes(this.mergedOpt.type) && (this.loading = true);
        if ([2, 3, 5].includes(this.mergedOpt.type)) {
          addArray.forEach(deptId => {
            this.pushDept(this.showDataByObj.depts[deptId]);
          });
        }
        this.checkDeptHandle(addArray);
      } else {
        // 取消选择
        let delArray = [];
        if (val.length) {
          delArray = oldVal.filter(id => val.indexOf(id) === -1); // 取消选中部门id数组
        } else {
          delArray = oldVal;
        }
        if ([2, 3, 5].includes(this.mergedOpt.type)) {
          delArray.forEach(deptId => {
            this.deleteDept(deptId);
          });
        }
        this.cancelCheckDept(delArray);
      }
    },
    checkUser(val, oldVal) {
      if (val.length > oldVal.length) {
        // 选中
      } else if (val.length !== oldVal.length) {
        // 取消选中
        if (!val.length) {
          // 如果选中人员id集合为空，则清空对应的人员、部门选中集合
          if (this.mergedOpt.type === 1) {
            this.checkData.splice(0);
            this.checkDept.splice(0);
          } else {
            this.cancelCheckUser(oldVal);
          }
        } else {
          const delArray = oldVal.filter(
            accountId => val.indexOf(accountId) === -1
          ); // 取消选中人员的iaccountId数组
          this.cancelCheckUser(delArray);
        }
      }
    },
    visible(val, oldVal) {
      // 当前组件的存在状态，当显示在页面时初始化数据
      if (val) {
        this.init();
        this.isSearch = false;
        this.SearchText = "";
      } else {
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
      this.groupName = this.option.groupName || "";
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
    selectSearchUser(user) {
      // 选择搜索结果中的人员
      if (this.mergedOpt.disableSelect.includes(user.accountId)) {
        this.$message({
          type: "warning",
          showClose: true,
          duration: 3000,
          message: `${user.name} ${this.mergedOpt.disableWarning}`,
          onClose: () => {}
        });
      } else if (this.selectedItemIds.user.includes(user.accountId)) {
        this.$message.error("不能重复选择");
      } else {
        this.pushUser(user);
        this.isSearch = false;
        this.SearchText = "";
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
      let corpAndCorpRelType = 0;
      switch (this.selectCorp.corpAndCorpRelTypeEnums) {
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
      return this.$service.getSubDeptUserPagelist
        .call(this, {
          corpId: this.selectCorp.id,
          pid: String(deptId),
          corpType: this.selectCorp.corpTypeEnums || company.corpType,
          pageNum: 1,
          corpAndCorpRelType
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
    getSearchData(name) {
      this.$service.getAccountSearchOrganization
        .call(this, {
          search: name,
          corpIds: this.corpList.map(corp => corp.id)
        })
        .then(result => {
          if (result) {
            if (result.length == 0) {
              this.searchReasult = true;
            } else {
              this.searchReasult = false;
              let searchData = result.map(user => {
                if (!user.name && user.userName) {
                  user.name = user.userName;
                }
                user.id = user.userId;
                return user;
              });
              if (this.mergedOpt.type == "create") {
                this.searchData = [...searchData];
              } else {
                let disabaleUser = this.dis;
                this.searchData = searchData.filter(
                  item => !this.mergedOpt.disableDelete.includes(item.accountId)
                );
              }
            }
          }
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
    disArray(key) {
      // 数组去重
      let isObj = false;
      if (this instanceof Array && this.length > 1) {
        if (typeof this[0] == "object") {
          isObj = true;
        }
        if (isObj && !key) {
          return;
        }
        for (let i = 0; i < this.length; i++) {
          const item = this[i];
          for (let j = this.length - 1; j > i; j--) {
            const row = this[j];
            if (isObj && item[key] == row[key]) {
              this.splice(j, 1);
              i--;
              break;
            } else if (!isObj && item == row) {
              this.splice(j, 1);
              i--;
              break;
            }
          }
        }
      }
      return this;
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
    selectCorpHandler(corp) {
      this.selectCorp = corp;
      this.nextDept(corp, corp.rootDeptId);
      this.isShowCorp = false;
    },
    cancelHandler() {
      // 取消
      this.$emit("cancel");
    },
    confirmHandler() {
      this.$emit("confirm", { name: this.groupName });
    }
  },
  directives: {
    randomcolor: {
      inserted(el) {
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

#selection-organizational-wrapper {
  width: 100%;
  background-color: #fff;

  > * {
    user-select: none;
  }
  .select {
    width: 100%;
    height: 100%;
    background-color: #fff;
    @include flex();
    align-items: flex-start;
    border: 1px solid #e0e0e0 {
      right: 0;
      left: 0;
    }
    .select-left {
      flex-shrink: 0;
      position: relative;
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid #e0e0e0;
      .item-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        width: 100%;
        overflow-y: auto;
        .item-info-list {
          padding: {
            left: $--padding-right-or-left;
            right: 18px;
          }
          font-size: 14px;
          color: #454545;
        }
        .chengyuan-list {
          display: flex;
          flex-wrap: wrap;
          padding: {
            bottom: 10px;
          }
          > div {
            margin: {
              right: 5px;
              top: 10px;
            }
          }
          .tag-item {
            padding: 0 {
              left: 16px;
              right: 8px;
            }
            max-width: 142px;
            height: 30px;
            display: flex;
            align-items: center;
            border: 1px solid rgba(231, 231, 231, 1);
            font-size: 14px;
            border-radius: 15px;
            background-color: #e7e7e7;
            color: #333;
            user-select: none;

            &.disable-del {
              padding-right: 16px;
              background-color: #fff;
              button {
                display: none;
              }
            }

            > span {
              flex: 1;
            }
            > button {
              margin-left: 8px;
              width: 12px;
              height: 12px;
              line-height: 12px;
              text-align: center;
              color: #fff;
              font-size: 6px;
              border-radius: 50%;
              background-color: #999;
              transition: all 0.15s linear;
              &:hover {
                background-color: #4498f0;
              }
            }
          }
        }
      }

      .group-info {
        height: 141px;
        flex-shrink: 0;
        padding: 14px 20px;
        border-top: 1px solid #e7e7e7;

        .group-info-title {
          line-height: 1;
          > span {
            font-size: 12px;
            &:last-of-type {
              color: #999;
            }
          }
        }

        .el-input {
          margin: 14px 0 20px 0;
        }

        ::v-deep input::placeholder {
          font-size: 12px;
          color: #ccc;
        }
      }
    }
    .select-right {
      flex-shrink: 0;
      @include floor-layers();
      width: 50%;
      height: 100%;

      /* 公司列表 Start */
      .corp-list-container {
        padding: 10px 20px;
        width: 100%;
        flex: 1;
        overflow-y: auto;
        img {
          margin-right: 10px;
          width: 40px;
          max-height: 40px;
          border-radius: 50%;
        }

        .corp-item {
          display: flex;
          height: 40px;
          align-items: center;
          button {
            font-size: 14px;
            font-weight: 600;
            color: #333;
          }
        }
      }
      /* 公司列表 END */
      .select-right-btns {
        width: 100%;
        .el-menu--horizontal .el-menu-item {
          width: 120px;
          @include lineheight(44px);
          text-align: center;
        }
      }
      .select-content {
        position: relative;
        width: 100%;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        .select-right-list {
          overflow-y: auto;
        }
      }

      .select-active-corp {
        height: 54px;
        line-height: 54px;
        padding: {
          left: 19px;
        }
        > button {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          color: #333;
          font-weight: bold;

          > span {
            text-align: left;
            &:first-of-type {
              color: #999;
              margin-right: 20px;
              font-size: 12px;
              transform: rotateZ(180deg);
            }
            &:last-of-type {
              flex: auto;
            }
          }
        }
      }

      .select-right-item {
        width: 100%;
        @include flex();
        height: 70px;
        border-bottom: 1px solid #f0f0f0;
        box-sizing: border-box;
        ::v-deep .el-checkbox__inner {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          &::after {
            width: 5px;
            height: 9px;
            left: 6px;
            top: 2px;
          }
        }

        .el-checkbox {
          display: flex;
          align-items: center;
          margin-right: 0;
          padding: {
            left: $--padding-right-or-left;
            right: 0;
          }
          ::v-deep .el-checkbox__label {
            @include flex();
          }
        }
        .select-item-name {
          flex: auto;
          margin-left: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          color: #333;
          cursor: pointer;
          > button {
            font-size: 12px;
            // color: #999;
            .iconfont {
              font-size: 12px;
            }

            &.disabale-select {
              color: #ccc;
            }
          }
        }
        .group-title {
          padding-left: $--padding-right-or-left;
          &.select-item-name {
            margin-left: 0;
          }
        }
      }
      .select-right-title {
        flex-wrap: wrap;
        padding: {
          top: 10px;
          bottom: 10px;
          left: $--padding-right-or-left;
        }
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        border-top: 1px solid #f0f0f0;
        border-bottom: 5px solid #eee;
        .defaultTitle {
          display: inline-block;
          width: 6px;
          height: 15px;
          background: #4498f0;
          margin: 0 8px;
        }
        a {
          flex: none;
          font-size: 14px;
          text-decoration: none;
          color: #269ae8;
          font-weight: bold;
          &:not(:first-of-type) {
            &::before {
              display: inline-block;
              content: "∧";
              padding: 0 2px;
              color: #666;
              font-size: 10px;
              transform: rotateZ(90deg);
            }
          }
          &:last-of-type {
            color: #999;
          }
        }
      }
    }

    .search-wrapper {
      display: flex;
      width: auto;
      .search-input {
        width: auto;
        color: #4498f0;
        &::placeholder {
          color: #4498f0;
        }
      }
    }
    .search-result-wrapper {
      margin: 10px auto;
      width: 319px;
      min-height: 300px;
      flex: auto;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background-color: #fff;
      box-shadow: 0 0 12px 0 rgba(105, 107, 112, 0.3);
      border-radius: 12px;
      li {
        cursor: pointer;
        &:hover {
          background-color: #eef1f6;
        }
        &:not(&:last-of-type) {
          border-bottom: 1px solid #e7e7e7;
        }
      }
      .search-result-content {
        flex: 1;
        overflow: auto;
      }
      .search-noresult-content {
        padding-top: 20px;
        color: #999;
        font-size: 18px;
        text-align: center;
      }
      .candidate-list {
        padding: 0 18px;
        @include flex();
        height: 64px;
        .list-info {
          margin: {
            left: 10px;
          }
          p {
            line-height: normal;
            &:first-of-type {
              color: #454545;
            }
            &:last-of-type {
              color: #999;
              font-size: 12px;
            }
          }
        }
      }
    }
  }
}
</style>
