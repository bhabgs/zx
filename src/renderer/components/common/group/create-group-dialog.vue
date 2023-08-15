<template>
  <el-dialog visible :show-close="false" custom-class="create-group-dialog">
    <div class="create-group-type-title" slot="title">
      <p>
        {{
          `${dialogOption.id ? "邀请成员" : "发起群聊"}-${
            dialogOption.groupType == "organization" ? "组织群" : "外联群"
          }`
        }}
      </p>
      <img
        src="@/assets/image/contacts/close_dialog.png"
        @click="closeHandle"
        alt
      />
    </div>
    <div
      class="content-left"
      @click.stop="clicOtherHandle"
      v-if="dialogOption.groupType === 'organization'"
      v-show="!showDeptAndUser"
    >
      <div class="content-left-block">
        <div class="content-left-block-label">
          群归属企业
          <div class="tips">(表明群的归属企业、团队，群组创建后不可变更)</div>
        </div>
        <el-select
          @change="belongtoChangeHandle"
          v-model="belongto"
          :disabled="!!dialogOption.id"
          placeholder="请选择群归属企业"
          popper-class="belong-popper"
        >
          <el-option
            v-for="item in myCompany"
            :key="item.corpId"
            :label="item.name || item.corpName"
            :value="item.corpId"
          ></el-option>
        </el-select>
      </div>
      <div class="content-left-block">
        <div class="content-left-block-label">
          群成员范围
          <div class="tips">(支持添加哪些公司的成员入群)</div>
        </div>
        <el-select
          class="show-select-company-list"
          v-model="belongRange"
          multiple
          :disabled="!!dialogOption.id"
          collapse-tags
          @remove-tag="removeBelongHandle"
          placeholder="请选择群成员范围"
        >
          <!-- <el-option
            v-for="item in belongRangeList"
            :disabled="item.corpId == belongto"
            :key="item.corpId"
            :label="item.corpName"
            :value="item.corpId"
          >
          </el-option>-->
          <el-option-group
            v-for="group in showCompanyList"
            :key="group.label"
            class="show-select-company-list-block"
            :label="group.label"
          >
            <el-option
              v-for="item in group.list"
              class="show-select-company-list-item"
              :disabled="item.corpId == belongto"
              :key="item.corpId"
              :label="item.corpName"
              :value="item.corpId"
            ></el-option>
          </el-option-group>
        </el-select>
      </div>
      <div class="content-left-company-list">
        <div class="content-left-company-list-label">选择群成员</div>
        <div class="search-content-wrapper">
          <div class="search-input-wrapper">
            <img src="@/assets/outsource/search.png" alt />
            <input
              class="search-input"
              placeholder="搜索您要添加的人员  "
              v-model="SearchText"
              maxlength="15"
            />
          </div>
          <!-- 搜索结果展示 start -->
          <div v-if="isSearch" class="search-result-wrapper small-size">
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
                  <p
                    class="name"
                    v-html="
                      row.name.replace(
                        SearchText,
                        `<font color='#3E7EFF'>${SearchText}</font>`
                      )
                    "
                  ></p>
                  <div
                    class="corp-list"
                    v-for="corp in row.corpList.slice(0, 3)"
                    :key="corp.id"
                  >
                    <p class="corp-name" :title="corp.name">{{ corp.name }}</p>
                    <div
                      class="corp-dept-list"
                      v-for="dept in corp.deptLabelNameList.slice(0, 3)"
                      v-show="row.isHide != '1'"
                      :title="dept"
                      :key="dept"
                    >
                      {{ dept }}
                    </div>
                    <div
                      class="corp-dept-list"
                      v-if="corp.deptLabelNameList.length > 3"
                    >
                      ......
                    </div>
                  </div>
                  <div class="corp-list" v-if="row.corpList.length > 3">
                    等{{ row.corpList.length }}家企业…
                  </div>
                </div>
              </li>
            </ul>
          </div>
          <!-- 搜索结果展示 end -->
        </div>
        <div class="content-left-company-list-value">
          <div
            class="content-left-company-list-block"
            v-for="block in showSelectCompanyList"
            :key="block.type"
            v-show="block.list.length"
          >
            <div class="content-left-company-list-block-label">
              {{ block.label }}
              <span>（{{ block.list.length }}家）</span>
            </div>
            <div
              class="company-item"
              v-for="item in block.list"
              @click="selectCompanyHandle(item)"
              :key="item.id"
            >
              <img src="@/assets/image/contacts/company_organization.png" alt />
              <div class="company-block-label-name">
                <div class="company-name" :title="item.corpName">
                  {{ item.label || item.name || item.corpName }}
                </div>
                <div class="company-pname">{{ item.pname }}</div>
              </div>
              <div class="company-memebr-num">{{ item.num }}人</div>
              <mask-icon name="arrow" size="12" color="#D6DCE6" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      class="company-select-wrapper"
      @click.stop="clicOtherHandle"
      v-show="dialogOption.groupType === 'outsource' || showDeptAndUser"
    >
      <div class="search-content-wrapper">
        <div class="search-input-wrapper">
          <img src="@/assets/outsource/search.png" alt />
          <input
            class="search-input"
            placeholder="搜索您要添加的人员  "
            v-model="SearchText"
            maxlength="15"
          />
        </div>
        <!-- 搜索结果展示 start -->
        <div v-if="isSearch" class="search-result-wrapper large-size">
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
                <p
                  class="name"
                  v-html="
                    row.name.replace(
                      SearchText,
                      `<font color='#3E7EFF'>${SearchText}</font>`
                    )
                  "
                ></p>
                <div
                  class="corp-list"
                  v-for="corp in row.corpList.slice(0, 3)"
                  :key="corp.id"
                >
                  <p class="corp-name" :title="corp.name">{{ corp.name }}</p>
                  <div
                    class="corp-dept-list"
                    v-for="dept in corp.deptLabelNameList.slice(0, 3)"
                    v-show="row.isHide != '1'"
                    :title="dept"
                    :key="dept"
                  >
                    {{ dept }}
                  </div>
                  <div
                    class="corp-dept-list"
                    v-if="corp.deptLabelNameList.length > 3"
                  >
                    ......
                  </div>
                </div>
                <div class="corp-list" v-if="row.corpList.length > 3">
                  等{{ row.corpList.length }}家企业…
                </div>
              </div>
            </li>
          </ul>
        </div>
        <!-- 搜索结果展示 end -->
      </div>
      <outsource-group-select
        v-if="dialogOption.groupType === 'outsource'"
        v-show="!showDeptAndUser"
        @showCompanyDept="selectCompanyHandle"
        @currentType="changeCurrentType"
        @selectCompany="selectCompany"
      ></outsource-group-select>
      <!-- <company-dept-user
        ref="companyDepet"
        :current="currentSelectCorp"
        :type="currentSelectCorp.companyType || 'organization'"
        :value="selectValue[currentSelectCorpType][currentSelectCorp.id]"
        :userRefSetObj="userRefSetObj"
        :option="{
          ...dialogOption,
          selectUserIds: selectUserIds,
          disableDelete: organizationOption.disableDelete
        }"
        :show="showDeptAndUser"
        @input="getCheckData"
        @backToCompany="backToCompany"
        v-show="showDeptAndUser"
      ></company-dept-user> -->

      <dept-user-selector
        v-if="showDeptAndUser"
        :checkedObj="checkedObj"
        :disabledObj="disabledObj"
        :current="currentSelectCorp"
        :type="currentSelectCorp.companyType || 'organization'"
        @backToCompany="backToCompany"
        @toggle-user="toggleChecked"
        @toggle-dept="toggleChecked"
        @update-user-map="updateUserMap"
      />
    </div>
    <div
      class="content-right"
      @click.stop="clicOtherHandle"
      :class="`content-right-${dialogOption.groupType}`"
    >
      <div class="content-right-block">
        <div class="content-right-block-title">发起人</div>
        <div class="content-right-block-content">
          <div class="user-block create-block">
            {{ sponsor.name || sponsor.nickName }}
          </div>
        </div>
      </div>
      <div class="content-right-block content-right-select">
        <div
          class="header-wrapper"
          v-if="
            dialogOption.groupType == 'organization' && orgSelectedItems.length
          "
        >
          <div class="content-right-block-title">已选择</div>
          <div class="clear-btn" @click="clearSelectItems('organization')">
            清空
          </div>
        </div>

        <div class="content-right-block-content">
          <div
            class="content-right-block-content-block content-right-block-content-org"
            v-show="true"
          >
            <div
              class="header-wrapper"
              v-if="
                dialogOption.groupType == 'outsource' && orgSelectedItems.length
              "
            >
              <div class="content-right-block-content-title">已选择-组织</div>
              <div class="clear-btn" @click="clearSelectItems('organization')">
                清空
              </div>
            </div>
            <div
              class="user-block select-user-block"
              v-for="item in orgSelectedItems"
              v-show="item.accountId != sponsor.accountId"
              :key="getSelectedItemKey(item)"
            >
              <span>{{ item.name || item.label || item.corpName }}</span>
              <img
                @click="removeTag(item)"
                src="@/assets/image/contacts/delete.png"
                alt
              />
            </div>
          </div>
          <div
            class="content-right-block-content-block content-right-block-content-out"
            v-show="true"
          >
            <div
              class="header-wrapper"
              v-if="
                dialogOption.groupType == 'outsource' && outSelectedItems.length
              "
            >
              <div class="content-right-block-content-title">已选择-外联</div>
              <div class="clear-btn" @click="clearSelectItems('outsource')">
                清空
              </div>
            </div>
            <div
              class="user-block select-user-block"
              v-for="item in outSelectedItems"
              v-show="item.accountId != sponsor.accountId"
              :key="getSelectedItemKey(item)"
            >
              <span>{{ item.name || item.label || item.corpName }}</span>
              <img
                @click="toggleChecked(item)"
                src="@/assets/image/contacts/delete.png"
                alt
              />
            </div>
          </div>
        </div>
      </div>
      <div class="content-right-group-info">
        <p class="group-info-title">
          <span>
            群名称<span v-show="!dialogOption.groupName" class="small"
              >(选填)</span
            >
          </span>
        </p>
        <el-input
          placeholder="请输入内容"
          size="small"
          v-model="groupName"
          :disabled="!!dialogOption.id"
          maxlength="12"
          clearable
        ></el-input>
      </div>
    </div>
    <div
      slot="footer"
      class="create-group-type-footer"
      :class="`create-group-type-footer-${dialogOption.groupType}`"
    >
      <div class="total-num-msg">
        <template v-if="msgTotalNum >= 50 || msgTotalNum >= groupLimit">
          <i class="el-icon-warning"></i
          ><span
            >当前群人数为{{ msgTotalNum }}人，最多可添加{{ groupLimit }}人</span
          >
        </template>
      </div>
      <el-button :disabled="isRequesting" class="close" @click="closeHandle">
        返回
      </el-button>
      <el-button
        :loading="isRequesting"
        type="primary"
        class="confirm"
        @click="confirmHandle"
      >
        确定
        <span v-if="confirmBtnNum > 0">({{ confirmBtnNum }})</span>
      </el-button>
    </div>
  </el-dialog>
</template>

<script>
import OrganizationOutsource from "@/components/common/organization-outsource";
import CompanyDeptUser from "./company-dept-user";
import OutsourceGroupSelect from "./outsource-group-select";
import { mapGetters, mapActions } from "vuex";

import GetGroupInfo from "@/mixin/getGroupInfo";
import { ConversationModel } from "@/WebIM";
import { MessageBox } from "element-ui";
export default {
  name: "CreateGroupDialog",
  mixins: [GetGroupInfo],
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    dialogOption: {
      type: Object,
      default: () => {
        return {
          groupType: "organization",
          type: 5,
          title: "发起群聊-组织群",
        };
      },
    },
  },
  components: {
    OutsourceGroupSelect,
    OrganizationOutsource,
    CompanyDeptUser,
  },
  data() {
    return {
      btnList: [
        { name: "组织", icon: "organization", key: "organization" },
        { name: "外联", icon: "outsource", key: "outsource" },
      ],
      activeIndex: 0,
      sponsor: {}, // 发起人

      selectedItems: [], // 已选择 组织 / 外联 的 部门 / 人员
      deptMap: {},
      checkedObj: {},
      disabledObj: {},
      organizationOption: {
        disableDelete: [],
        belongto: "",
      }, // 选择组织架构配置项

      groupName: "",
      belongto: "", //群归属组织
      myCompany: [], // 我的企业
      belongRange: [], // 群所属范围
      belongRangeList: [], // 群成员范围列表
      currentSelectCorp: {}, // 当前选中的公司
      showDeptAndUser: false, // 展示部门和成员

      isRequesting: false, // 正在请求
      SearchText: "", // 搜索内容
      searchData: [], // 搜索结果
      isSearch: false, // 是否在搜索
      searchTimeOut: null, // 搜索时方法执行延迟
      searchReasult: false,
      selectCompanyAll: [],
      currentSelectCorpType: "organization",
      userRefSetObj: {},
      selectedItems: [],
      totalNum: 0,
    };
  },
  watch: {
    visible() {
      if (this.visible) {
        this.selectCompanyAll.splice(0);
        this.init();
      }
    },
    selectedItems(items) {
      console.log({ items });
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
    belongRange: {
      handler(newVal, oldVal) {
        if (newVal.length < oldVal.length) {
          // 取消选中公司范围
          this.changeRangeHandle(newVal);
        }
      },
      deep: true,
    },
  },
  computed: {
    ...mapGetters([
      "GetDirectlyCompany",
      "GetCompany",
      "GetSelectCompanyList",
      "GetAllOrganizationUserIds",
    ]),
    groupLimit() {
      return this.dialogOption.limit || 3000;
    },
    orgSelectedItems() {
      return this.selectedItems.filter(({ type }) => type === "organization");
    },
    outSelectedItems() {
      return this.selectedItems.filter(({ type }) => type === "outsource");
    },
    confirmBtnNum() {
      if (!this.dialogOption.id) {
        // 新建群 选择人 + 创建人
        return this.totalNum + 1;
      } else {
        // 群加人
        return this.totalNum;
      }
    },

    msgTotalNum() {
      if (!this.dialogOption.id) {
        // 新建群
        return this.confirmBtnNum;
      } else {
        // 群加人 所选人数 + 群现有人数
        return this.confirmBtnNum + this.dialogOption.disDel.length;
      }
    },

    selectCompanyList() {
      return this.belongRangeList.filter((item) =>
        this.belongRange.includes(item.corpId)
      );
    },

    showSelectCompanyList() {
      const result = [
        { label: "入职企业", type: 0, list: [] },
        { label: "上级企业", type: 1, list: [] },
        { label: "下级企业", type: 2, list: [] },
      ];
      const belongRange = this.belongRangeList.filter((item) =>
        this.belongRange.includes(item.corpId)
      );
      for (const key in result) {
        const element = result[key];
        element.list = belongRange.filter(
          (item) => item.corpAndCorpRelType == element.type
        );
      }
      return result.filter((item) => !!item.list.length);
    },
    showCompanyList() {
      const result = [
        { label: "入职企业", type: 0, list: [] },
        { label: "上级企业", type: 1, list: [] },
        { label: "下级企业", type: 2, list: [] },
      ];
      for (const key in result) {
        const element = result[key];
        element.list = this.belongRangeList.filter(
          (item) => item.corpAndCorpRelType == element.type
        );
      }
      return result.filter((item) => !!item.list.length);
    },
  },
  created() {
    this.userMap = {
      [this.dialogOption.users[0].accountId]: this.dialogOption.users[0], // 创建者
    };
  },
  mounted() {
    this.init();
  },
  methods: {
    ...mapActions([
      "PushDialogue",
      "SetOpenDialog",
      "SetChitchatType",
      "SetSelectCompanyList",
    ]),
    clearSelectItems(type) {
      // 删除已选择 组织 / 外协 item（部门/人员）
      this.selectedItems
        .filter((item) => item.type === type)
        .forEach(this.toggleChecked);
    },
    getSelectedItemKey(item) {
      const { corpId, id, accountId, isDept, isUser } = item;
      if (isDept) {
        return `${corpId}-${id}`;
      }
      return accountId;
    },
    async getDeptUsersByDeptId(deptId) {
      return this.$service
        .getUserAllByDept({
          corpId: this.currentSelectCorp.id,
          deptId: deptId,
          pageNum: 1,
          pageSize: 10000,
          corpType: this.currentSelectCorp.type,
          corpAndCorpRelType: this.currentSelectCorp.corpAndCorpRelType,
        })
        .then(({ list: userList }) => userList);
    },
    initCheckedStatus() {
      const { users, disDel, dialogType, disableDelete, name, groupId } =
        this.dialogOption;
      this.checkedObj = disDel.reduce((o, user) => {
        o[user.accountId] = true;
        return o;
      }, {});
      this.disabledObj = disDel.reduce((o, user) => {
        o[user.accountId] = true;
        return o;
      }, {});
      this.selectedItems = [];
      this.totalNum = 0;
      this.userRefSetObj = {};
    },
    // 通过标签删除 组织/人
    removeTag(item) {
      if (item.isDept) {
        this.toggleChecked(item);
        return;
      }
      this.uncheckUser(item.accountId);
    },
    // 处理勾选、取消勾选、删除已选择人员和组织
    async toggleChecked(deptOrUser) {
      const { isDept, isUser, id, accountId, name, corpId } = deptOrUser;
      const type = this.currentSelectCorp.companyType || "organization";
      if (isDept) {
        const deptKey = `${corpId}-${id}`;
        const indexInSelected = this.selectedItems.findIndex(
          (item) => item.isDept && item.id === id
        );
        if (indexInSelected !== -1) {
          // 取消勾选组织，删除已选择组织
          this.checkedObj[deptKey] = false;
          this.selectedItems.splice(indexInSelected, 1);

          const accountIds = this.deptMap[deptKey];
          accountIds.forEach((accountId) => {
            if (this.disabledObj[accountId]) return;
            this.uncheckUserInDept(accountId, deptKey);
          });
        } else {
          // 勾选组织
          this.checkedObj[deptKey] = true;
          this.selectedItems.push({ ...deptOrUser, type });

          if (!this.deptMap[deptKey]) {
            const users = await this.getDeptUsersByDeptId(id);
            // 缓存 deptId -> 多 user accountId
            this.deptMap[deptKey] = users.map(({ accountId }) => accountId);
            // 缓存 user.accountId -> user (用于 1.获取单聊所需信息 2.缺省群名称拼接所选用户姓名)
            users.forEach((user) => {
              const { accountId } = user;
              if (!this.userMap[accountId]) {
                this.userMap[accountId] = user;
              }
            });
          }

          const accountIds = this.deptMap[deptKey];
          accountIds.forEach((accountId) => {
            if (this.disabledObj[accountId]) return;
            this.checkUserInDept(accountId, deptKey);
          });
        }
      }
      if (isUser) {
        if (this.disabledObj[accountId]) return;
        const indexInSelected = this.selectedItems.findIndex(
          (item) => item.isUser && item.accountId === accountId
        );
        if (this.checkedObj[accountId]) {
          // 取消勾选人员，删除已选择人员
          // this.selectedItems.splice(indexInSelected, 1)
          // this.uncheckUserInDept(accountId,accountId)
          // 取消勾选人员，删除已选择人员所有引用
          if (indexInSelected !== -1) {
            this.selectedItems.splice(indexInSelected, 1);
          }
          this.uncheckUser(accountId);
        } else {
          // 勾选人员
          // this.checkedObj[accountId]=true
          this.selectedItems.push({ ...deptOrUser, type });
          this.checkUserInDept(accountId, accountId);
        }
      }
    },

    updateUserMap(users) {
      // 缓存 user.accountId -> user (用于 1.获取单聊所需信息 2.缺省群名称拼接所选用户姓名)
      users.forEach((user) => {
        const { accountId } = user;
        if (!this.userMap[accountId]) {
          this.userMap[accountId] = user;
        }
      });
    },
    // 搜索选人 / 选中部门级联选人 / 勾选选人
    checkUserInDept(accountId, deptKey) {
      if (!this.userRefSetObj[accountId]) {
        this.userRefSetObj[accountId] = new Set();
      }
      const set = this.userRefSetObj[accountId];
      const beforeRefCount = set.size;

      set.add(deptKey);

      if (beforeRefCount === 0) {
        this.totalNum++;
        this.$set(this.checkedObj, accountId, true);
      }
    },
    // 取消勾选部门触发级联删人
    uncheckUserInDept(accountId, deptKey) {
      const set = this.userRefSetObj[accountId];
      const beforeRefCount = set.size;

      set.delete(deptKey);

      const afterRefCount = set.size;

      if (afterRefCount === 0 && beforeRefCount !== 0) {
        this.totalNum--;
        this.checkedObj[accountId] = false;
      }
    },
    // 便签删除人员 / 取消勾选删除人员
    uncheckUser(accountId) {
      const index = this.selectedItems.findIndex(
        (item) => item.accountId === accountId
      );
      if (index !== -1) {
        this.selectedItems.splice(index, 1);
      }
      this.userRefSetObj[accountId] = new Set();
      this.checkedObj[accountId] = false;
      this.totalNum--;
    },
    clicOtherHandle(e) {
      e.stopPropagation();
      this.isSearch = false;
    },

    selectAllCompany(item) {
      const company = { ...item };
      if (this.selectCompanyAll.includes(item.corpId)) {
        this.selectCompanyAll = this.selectCompanyAll.filter(
          (corp) => corp != item.corpId
        );
        company.isCancel = true;
      } else {
        this.selectCompanyAll.push(item.corpId);
        company.isCancel = false;
      }
      this.selectCompany(company, true);
    },
    removeBelongHandle(item) {
      if (this.belongto === item) {
        this.belongRange.push(item);
      } else {
        this.selectCompanyAll = this.selectCompanyAll.filter(
          (corp) => corp != item
        );
      }
    },
    changeRangeHandle(corpIds) {
      const existedCorpIdObj = corpIds.reduce((o, id) => {
        o[id] = true;
        return o;
      }, {});
      const willUnselectitems = this.selectedItems.filter(
        ({ corpId }) => !existedCorpIdObj[corpId]
      );
      willUnselectitems.forEach(this.toggleChecked);
    },
    init(isInit = true) {
      const { users, disDel, dialogType, disableDelete, name, groupId } =
        this.dialogOption;
      this.initCheckedStatus();
      let disableDeleteIds = [];
      if (disableDelete && disableDelete.length) {
        disableDeleteIds = disableDelete;
      } else {
        disableDeleteIds = [...(disDel || [])].map((item) => item.accountId);
      }
      this.sponsor = users[0];

      this.organizationOption.disableDelete = disableDeleteIds;
      this.organizationOption.type = dialogType || "create";
      this.groupName = name || "";
      this.groupId = groupId || "";

      if (isInit && this.dialogOption.groupType === "organization") {
        this.getCompanyList();
      }
    },
    selectSearchUser(user) {
      if (this.checkedObj[user.accountId] || this.disabledObj[user.accountId]) {
        this.$message.info("该成员已存在");
        return;
      }
      this.checkUserInDept(user.accountId, user.accountId);
      this.selectedItems.push({
        ...user,
        isUser: true,
        type: user.form === 0 ? "organization" : "outsource",
      });

      this.isSearch = false;
      this.SearchText = "";
    },
    async getSearchData(name) {
      this.$service.getAccountSearchByUserName
        .call(this, {
          search: name,
          corpType: this.dialogOption.groupType == "organization" ? 0 : 1,
          corpIds:
            this.dialogOption.groupType == "organization"
              ? this.selectCompanyList.map((corp) => corp.id || corp.corpId)
              : undefined,
        })
        .then((result) => {
          if (result) {
            if (result.length == 0) {
              this.searchReasult = true;
            } else {
              this.searchReasult = false;
              let searchData = result.map((user) => {
                if (!user.name && user.userName) {
                  user.name = user.userName;
                }
                user.id = user.userId;
                return user;
              });
              this.searchData = [...searchData];
              searchData.forEach((user) => {
                this.userMap[user.accountId] = user;
              });
            }
          }
        });
    },

    async getCompanyList() {
      try {
        if (this.dialogOption.id) {
          this.belongto = this.dialogOption.corpId;
          this.myCompany = this.dialogOption.corpIdList.filter(
            (item) => item.corpId == this.dialogOption.corpId
          );
          this.getBelongRangeList(this.belongto);
        } else {
          const company = this.GetDirectlyCompany || [];
          this.myCompany = (company || []).map((item) => {
            return {
              ...(item.corp || {}),
              corpId: item.corp.id,
            };
          });
          if (this.GetCompany.corp.canJoin == "1") {
            this.belongto = company[0].corpId;
          } else {
            this.belongto = this.GetCompany.corp.id;
          }
          this.getBelongRangeList(this.belongto);
        }
        this.organizationOption.belongto = this.belongto;
      } catch (error) {
        this.$message.error("获取群归属企业失败！");
      }
    },

    belongtoChangeHandle() {
      this.selectCompanyAll.splice(0);
      if (this.totalNum > 0) {
        // 除了发起人还选了其他
        MessageBox.confirm(
          "切换群所属企业会清除现在所选的人员，您确认要切换群所属企业吗？",
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            customClass: "warningDialog",
            type: "warning",
          }
        )
          .then(() => {
            this.init(false);
            this.organizationOption.belongto = this.belongto;
            this.getBelongRangeList(this.belongto);
          })
          .catch(() => {
            this.belongto = this.organizationOption.belongto;
          });
      } else {
        this.getBelongRangeList(this.belongto);
      }
    },
    async getBelongRangeList(corpId) {
      this.belongRange.splice(0);
      this.belongRangeList.splice(0);
      try {
        const res = await this.$service.getGroupCompanyList({
          corpId,
          groupId: this.dialogOption.id,
        });
        let range = [];
        if (this.dialogOption.id) {
          range = this.dialogOption.corpIdList.map((item) => item.corpId);
        } else {
          // this.belongRange.push(this.belongto);
          range = [this.belongto];
        }
        this.handleRangeData(res || [], range);
      } catch (error) {
        console.error(error);
        this.$message.error("获取群所属范围失败！");
      }
    },
    handleRangeData(companyList, range) {
      for (let index = 0; index < companyList.length; index++) {
        const element = companyList[index];
        const nodeCorpId = element.id || element.corpId;
        this.belongRangeList.push({
          ...element,
          id: nodeCorpId,
        });
        if (range.includes(nodeCorpId)) {
          this.belongRange.push(nodeCorpId);
        }
        if (
          element.children &&
          Array.isArray(element.children) &&
          element.children.length
        ) {
          this.handleRangeData(element.children, range);
        }
      }
    },
    closeHandle() {
      this.SetSelectCompanyList(null);
      this.$emit("closeHandle");
    },
    confirmHandle() {
      const type = this.dialogOption.id ? "add" : "create";
      let groupType = this.dialogOption.groupType === "organization" ? 0 : 10; // 0组织，10外联

      const selectedAccountIds = Object.entries(this.userRefSetObj)
        .filter(([_id, set]) => set.size)
        .map(([accountId]) => accountId);

      if (type == "create") {
        // 没选人，只有创建人自己
        if (this.confirmBtnNum === 1) {
          this.closeHandle();
          return;
        }
        // 选了一个人，打开私聊
        if (this.confirmBtnNum === 2) {
          const user = this.userMap[selectedAccountIds[0]];
          const UserType = this.GetAllOrganizationUserIds.includes(
            user.accountId
          )
            ? 0
            : 10;
          // 直选中一个人时，打开会话
          let dialogue = new ConversationModel.IMConversation(
            {
              id: user.accountId,
              avatar: user.avatar,
              name: user.name,
              groupType: UserType,
              corpId: user.corpId,
            },
            ConversationModel.IMConversationEnum.PRIVATE
          );
          this.PushDialogue(dialogue);
          this.SetOpenDialog(dialogue);
          this.$router.push({
            name: "chitchat",
            query: { type: UserType == 0 ? "organization" : "outsource" },
          });

          this.closeHandle();
          return;
        }
        // 创建群聊
        this.isRequesting = true;

        // 默认生成的群名称，用户没有输入群名称时使用
        const createName =
          this.groupName ||
          [
            this.dialogOption.users[0].accountId, // 创建人
            ...selectedAccountIds.slice(0, 2), // 选择的两个人
          ]
            .map((accountId) => this.userMap[accountId].name)
            .join("、");

        const corpIdList = this.selectCompanyList;
        this.$service
          .createGroup({
            corpId: this.belongto,
            name: createName,
            type: groupType,
            owner: this.GetCompany.accountId,
            creator: this.GetCompany.accountId,
            onlyOwnerManage: 0, //仅群主可管理：默认关。
            onlyOwnerAtAll: 0, //仅群主可@所有人：默认关。
            groupMembers: selectedAccountIds,
            corpIdList,
          })
          .then((result) => {
            const groupId = result.data.data;
            const dialogData = {
              id: groupId,
              name: createName,
              groupType: groupType,
              creator: this.GetCompany.accountId,
              createAt: Date.now(),
              count: selectedAccountIds.length + 1,
            };
            let dialogue = new ConversationModel.IMConversation(
              { ...dialogData },
              ConversationModel.IMConversationEnum.GROUP
            );
            this.PushDialogue(dialogue);
            this.SetOpenDialog(dialogue);
            this.closeHandle();
            this.$router.push({
              name: "chitchat",
              query: { type: this.dialogOption.groupType },
            });
            this.isRequesting = false;
          })
          .catch((error) => {
            this.isRequesting = false;
          });
      } else {
        this.addMember(this.dialogOption.typeDialog || groupType);
      }
    },
    // 群添加人员
    async addMember(groupType) {
      let groupInfo = {};
      try {
        //获取最新群信息
        const response = await this.getGroupInfoAsync(this.groupId);
        if (response.data && response.data.data) {
          groupInfo = response.data.data;
        } else {
          throw new Error();
        }
      } catch (error) {
        // 如果获取最新群信息失败则默认不能添加
        groupInfo = {};
      }
      if (
        (groupInfo && groupInfo.onlyOwnerManage == 0) ||
        this.GetCompany.accountId == groupInfo.owner
      ) {
        this.isRequesting = true;
        // 群成员
        const groupMembers = Object.entries(this.userRefSetObj)
          .filter(([_id, set]) => set.size)
          .map(([accountId]) => accountId);

        if (!groupMembers.length) {
          this.isRequesting = false;
          this.$Message.info("当前未选中人员 ");
          return;
        }
        let data = {
          groupId: this.dialogOption.id,
          name: groupInfo.name,
          type: groupType,
          corpId: this.GetCompany.corpId,
          accountIds: groupMembers,
          operationId: this.GetCompany.accountId,
        };
        this.$service
          .quitGroup("join", data)
          .then(() => {
            this.$Message.success("邀请成员成功");
            this.$root.$emit("close-create-dialog", "confirm");
            this.closeHandle();
          })
          .catch((error) => {
            if (error.data && error.data.code == "M_U_001") {
              this.$Message.warning(
                `添加成员失败，群上限${groupInfo.userLimit}人，现有${groupInfo.groupNumber}人`
              );
            } else {
              this.$Message.error("添加成员失败");
            }
          })
          .finally(() => {
            this.isRequesting = false;
          });
      } else {
        this.$Message.warning("您没有权限添加群成员");
      }
    },
    goToPage(config) {
      let result = 0;
      this.btnList.some((item, index) => {
        if (item.key === config.key) {
          result = index;
          return true;
        }
      });
      this.activeIndex = result;
    },
    selectCompanyHandle(item) {
      if (!this.selectCompanyAll.includes(item.corpId)) {
        this.currentSelectCorp = item;
        this.showDeptAndUser = true;
      }
    },
    async getAllUserByCorp(company) {
      try {
        const users = await this.$service.getCorpAllUser.call(this, {
          corpId: company.corpId,
          corpType: company.corpTypeEnums || company.corpType,
        });
        return users || [];
      } catch (error) {
        return [];
      }
    },
    changeCurrentType(type) {
      this.currentSelectCorpType = type;
    },
    // 区分组织和外联
    async selectCompany(company, noSetVuex) {
      const corpSelectType =
        company.corpSelectType || this.currentSelectCorpType;
      // this.$set(this.selectList[corpSelectType], company.id, []);
      // this.$set(this.selectValue[corpSelectType], company.id, {
      //   users: [],
      //   depts: []
      // });
      let companySelect = this.GetSelectCompanyList || {
        organization: [],
        outsource: [],
      };
      let companyList = companySelect[corpSelectType];
      const users = await this.getAllUserByCorp(company);
      if (company.isCancel) {
        // 取消选择公司
        companyList = companyList.filter((item) => item != company.id);
        // this.selectList[company.id] = [];
        this.selectList[corpSelectType][company.id].splice(0);
        this.selectValue[corpSelectType][company.id].users.splice(0);
      } else {
        companyList.push(company.id);
        // this.selectList[corpSelectType][company.id].push({
        //   corpId: company.id,
        //   selectType: "company",
        //   ...company
        // });
        const companyUsers = (users || []).map((item) => {
          return {
            ...item,
            isHide: true,
          };
        });
        // this.$set(this.selectValue[corpSelectType][company.id], "users", [
        //   ...companyUsers
        // ]);
      }
      if (!noSetVuex) {
        // this.$set(companySelect, corpSelectType, companyList);
        // this.SetSelectCompanyList(companySelect);
      }
    },
    backToCompany() {
      this.showDeptAndUser = false;
    },
  },
};
</script>

<style lang="scss">
@mixin flex($justify: flex-start, $align: center) {
  display: flex;
  justify-content: $justify;
  align-items: $align;
}
.create-group-dialog {
  width: 680px !important;
  height: 580px !important;
  margin: auto !important;
  border-radius: 8px !important;
  display: flex;
  flex-direction: column;
  .el-dialog__header {
    padding: 0;
    height: 48px;
    background: #f4f6f8;
    border-radius: 8px 8px 0px 0px;
    .create-group-type-title {
      display: flex;
      height: 100%;
      justify-content: space-between;
      align-items: center;
      padding: 0 16px;
      font-size: 16px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #5d616b;
      img {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
    }
  }
  .el-dialog__body {
    flex: 1;
    padding: 0;
    overflow: hidden;
    display: flex;
    > div {
      flex: 1;
      overflow: hidden;
      &.content-left {
        border-right: 1px solid #e7e7e7;
        display: flex;
        flex-direction: column;
        .content-left-block {
          display: flex;
          flex-direction: column;
          padding-left: 16px;
          flex-shrink: 0;
          .content-left-block-label {
            margin-top: 10px;
            margin-bottom: 8px;
            font-size: 12px;
            font-family: PingFangSC-Semibold, PingFang SC;
            font-weight: 600;
            color: #1f2329;
            display: flex;
            align-items: flex-end;
            .tips {
              margin-left: 2px;
              font-size: 10px;
              font-family: MicrosoftYaHeiUI;
              color: #8f959e;
              font-weight: 400;
            }
          }
          .el-select {
            width: 308px;
            .el-input__inner {
              border-color: #d6dce6;
              width: 308px;
              height: 34px;
            }
            .el-input__icon {
              line-height: 34px;
              color: #d6dce6;
            }
          }
        }
        .content-left-company-list {
          flex: 1;
          margin-top: 14px;
          overflow: hidden;
          border-top: 1px solid #e7e7e7;
          .content-left-company-list-label {
            margin-top: 10px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            padding-left: 14px;
            font-size: 12px;
            font-family: SourceHanSansCN-Regular, SourceHanSansCN;
            font-weight: 600;
            color: #1f2329;
          }
          .content-left-company-list-value {
            height: calc(100% - 28px);
            overflow-y: auto;
            .content-left-company-list-block {
              .content-left-company-list-block-label {
                display: flex;
                align-items: center;
                height: 18px;
                color: #8f959e;
                font-size: 10px;
                margin: 0 16px;
                border-radius: 2px;
                > span {
                  margin-left: 4px;
                }
              }
              .company-item {
                padding: 12px 16px;
                display: flex;
                align-items: center;
                cursor: pointer;
                border-bottom: 1px solid #f4f6f8;
                &:nth-last-child(1) {
                  border: none;
                }
                img {
                  width: 24px;
                  height: 24px;
                  margin-right: 8px;
                  &.check-company {
                    width: 16px;
                    height: 16px;
                    margin-right: 16px;
                  }
                }
                .company-block-label-name {
                  display: flex;
                  overflow: hidden;
                  .company-name {
                    flex: 1;
                    overflow: hidden;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                    font-size: 12px;
                    font-family: PingFangSC-Semibold, PingFang SC;
                    font-weight: 400;
                    color: #1f2329;
                  }
                  .company-pname {
                    font-size: 10px;
                    font-family: PingFangSC-Regular, PingFang SC;
                    font-weight: 400;
                    color: #8f959e;
                    margin-top: 4px;
                  }
                }
                .company-memebr-num {
                  margin-left: auto;
                  margin-right: 8px;
                  flex-shrink: 0;
                  font-size: 10px;
                  font-family: SourceHanSansCN-Regular, SourceHanSansCN;
                  font-weight: 400;
                  color: #8f959e;
                }
                > i {
                  color: #c9cfd8;
                  font-size: 12px;
                }
              }
            }
          }
        }
      }
      &.content-right {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        .content-right-block {
          padding-left: 15px;
          .content-right-block-title {
            height: 36px;
            display: flex;
            align-items: center;
            font-size: 12px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            color: #8f959e;
          }
          .header-wrapper {
            height: 24px;
            display: flex;
            align-content: space-between;
            align-items: center;
            font-size: 12px;
            font-family: PingFangSC-Regular, PingFang SC;
            width: 328px;
            .content-right-block-title {
              flex: 1;
              font-weight: 400;
              color: #8f959e;
              width: 100%;
            }
            .clear-btn {
              color: #3e7eff;
              width: 28px;
              margin-right: 16px;
              cursor: pointer;
            }
          }
          .content-right-block-content {
            overflow-y: auto;
            max-height: calc(100% - 36px);
            .content-right-block-content-block {
              display: flex;
              flex-wrap: wrap;
              margin-bottom: 8px;
              .header-wrapper {
                height: 24px;
                display: flex;
                align-content: space-between;
                align-items: center;
                font-size: 12px;
                font-family: PingFangSC-Regular, PingFang SC;
                width: 100%;
                .content-right-block-content-title {
                  font-weight: 400;
                  color: #c9cfd8;
                  width: 100%;
                }
                .clear-btn {
                  color: #3e7eff;
                  width: 28px;
                  margin-right: 16px;
                  cursor: pointer;
                }
              }
            }
            .user-block {
              padding: 0 16px;
              height: 30px;
              background: #3e7eff;
              border-radius: 15px;
              font-size: 14px;
              font-family: PingFangSC-Regular, PingFang SC;
              font-weight: 400;
              color: #ffffff;
              display: flex;
              align-items: center;
              margin: {
                bottom: 8px;
                right: 8px;
              }
              overflow: hidden;
              max-width: 100%;
              span {
                display: block;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
              img {
                width: 14px;
                height: 14px;
                margin-left: 8px;
                cursor: pointer;
              }
              &.select-user-block {
                background: #ebf2ff;
                color: #8f959e;
              }
              &.create-block {
                width: fit-content;
              }
            }
          }
        }
        .content-right-select {
          flex: 1;
          overflow: hidden;
          .content-right-block-content {
            overflow-y: auto;
            .search-input-wrapper {
              width: 74px;
              height: 32px;
              background: #f4f6f8;
              border-radius: 15px;
              border: 1px solid #3e7eff;
              display: flex;
              overflow: hidden;
              align-items: center;
              padding: 0 8px;
              img {
                width: 14px;
                height: 14px;
                margin-right: 4px;
              }
              input {
                font-family: PingFangSC-Regular, PingFang SC;
                font-weight: 400;
                flex: 1;
                background: #f4f6f8;
                font-size: 12px;
                color: #a4aab3;
                width: calc(100% - 30px);
                &::-webkit-input-placeholder {
                  color: #a4aab3;
                }
              }
            }
          }
        }
        .content-right-group-info {
          flex-shrink: 0;
          height: 90px;
          margin-top: auto;
          border-top: 1px solid #e7e7e7;
          padding: 0 16px;
          .group-info-title {
            height: 38px;
            display: flex;
            align-items: center;
            font-size: 12px;
            font-family: PingFangSC-Semibold, PingFang SC;
            font-weight: 600;
            color: #1f2329;
            > span {
              .small {
                font-size: 10px;
                color: #8f959e;
              }
            }
          }
          .el-input__inner {
            width: 308px;
            height: 32px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            background: #f4f6f8;
            font-size: 12px;
            color: #a4aab3;
            border-color: #f4f6f8;
            &::-webkit-input-placeholder {
              color: #a4aab3;
            }
            &:hover {
              border-color: #f4f6f8;
            }
            &:focus {
              border-color: #3e7eff;
              background: #f5f8ff;
            }
          }
        }

        &.content-right-outsource {
          .content-right-block-content {
            max-height: 100% !important;
            .user-block {
              background: #36d18e;
              &.select-user-block {
                background: rgba(54, 209, 142, 0.1);
                color: #8f959e;
              }
            }
          }
        }
      }
      &.company-select-wrapper {
        display: flex;
        flex-direction: column;
        padding-top: 16px;
        border-right: 1px solid #e7e7e7;
        .search-content-wrapper {
          margin: 0;
        }
      }
      .search-content-wrapper {
        height: 32px;
        margin-bottom: 8px;
        position: relative;
        padding: 0 16px;
        .search-input-wrapper {
          display: flex;
          align-items: center;
          width: 100%;
          height: 100%;
          border-radius: 4px;
          background: #f4f6f8;
          border: 1px solid #f4f6f8;
          &:focus-within {
            border-color: #3e7eff;
            background: #f5f8ff;
          }
          img {
            width: 14px;
            height: 14px;
            margin-left: 8px;
            margin-right: 4px;
          }
          input {
            flex: 1;
            font-size: 12px;
            background: #f4f6f8;
            color: #a4aab3;
            &::-webkit-input-placeholder {
              color: #a4aab3;
            }
          }
        }
        .search-result-wrapper {
          margin: 10px auto;
          width: 308px;
          flex: auto;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background-color: #fff;
          box-shadow: 0 0 12px 0 rgba(105, 107, 112, 0.3);
          border: 1px solid #e6ecf5;
          border-radius: 2px;
          position: absolute;
          height: 200px;
          overflow-y: auto;
          z-index: 9;
          &.small-size {
            height: 220px;
          }
          &.large-size {
            height: 410px;
          }
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
            padding: 8px 16px 0;
            @include flex();
            display: flex;
            align-items: flex-start;
            gap: 16px;
            .user-photo {
              margin: 0;
              width: 36px;
              height: 36px;
              flex: 0 0 36px;
              font-size: 10px;
            }
            .list-info {
              flex: 1;
              overflow: hidden;
              // margin-bottom: 4px;
              .name {
                font-size: 14px;
                line-height: 14px;
                color: #000;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
              }
              .corp-list {
                margin-bottom: 10px;
                .corp-name {
                  font-size: 12px;
                  font-family: PingFangSC-Regular, PingFang SC;
                  font-weight: 400;
                  color: #1f2329;
                  margin: 4px 0;
                  overflow: hidden;
                  width: 100%;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }
                .corp-dept-list {
                  font-size: 10px;
                  font-family: PingFangSC-Regular, PingFang SC;
                  font-weight: 400;
                  color: #8f959e;
                  overflow: hidden;
                  width: 100%;
                  white-space: nowrap;
                  text-overflow: ellipsis;
                }
              }
            }
          }
        }
      }
    }
  }
  .el-dialog__footer {
    padding: 0;
    width: 100%;
    height: 56px;
    border-top: 1px solid #e7e7e7;
    .create-group-type-footer {
      display: flex;
      // gap: 8px;
      // justify-content: flex-end;
      align-items: center;
      height: 100%;
      padding: 0 16px;
      .el-button {
        padding: 0 10px;
        min-width: 60px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        &.close {
          background: #ffffff;
          border-radius: 4px;
          color: #1f2329;
          border: 1px solid #c9cfd8;
          &:hover {
            color: #3e7eff;
            border-color: #3e7eff;
          }
        }
        &.confirm {
          background: #3e7eff;
          border-radius: 4px;
          border-color: #3e7eff;
          color: #fff;
          &:hover {
            background: #2e6be6;
          }
        }
      }
      &.create-group-type-footer-outsource {
        .el-button:hover {
          color: #36d18e;
          border-color: #36d18e;
        }
        .el-button.confirm {
          background: #36d18e;
          border-radius: 4px;
          border-color: #36d18e;
          color: #fff;
          &:hover {
            background: #2dc583;
            border-color: #2dc583;
          }
        }
      }
    }
  }
}
.ant-message {
  z-index: 99999;
}
</style>
<style lang="scss">
.belong-popper {
  .el-select-dropdown__item.selected {
    color: #3e7eff !important;
  }
}
.show-select-company-list-block {
  padding-bottom: 0 !important;
  .el-select-group__title {
    height: 28px;
    background: #f4f6f8;
    display: flex;
    align-items: center;
    font-size: 12px;
    padding-left: 14px;
    color: #8f959e;
    opacity: 0.5;
    line-height: 1;
  }
  .show-select-company-list-item {
    width: 308px;
    height: auto;
    line-height: 1.4;
    padding: 4px 12px;
    > span {
      display: block;
      width: 90%;
      white-space: pre-wrap;
    }
    &.selected {
      color: #3e7eff !important;
      &::after {
        top: calc(50% - 8px);
      }
    }
  }
  &::after {
    background: transparent !important;
  }
}
</style>
<style scoped lang="scss">
.el-dialog__wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}
.total-num-msg {
  flex: 1;
  color: #feac00;
  text-align: left;
  span {
    margin-left: 8px;
  }
}
</style>
