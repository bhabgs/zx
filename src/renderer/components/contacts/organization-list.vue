<template>
  <div class="organization-list" v-loading="isRequesting">
    <div
      class="empty-company-label"
      @click="showEmptyCompany"
      v-if="contactType == 'organization' && organizationList.length < 1 && showType == 'contact'"
    >入职企业</div>
    <div
      v-for="group in organizationList"
      :key="group.id"
      class="organization-list-group"
    >
      <group-block
        :isShowGroup="showGroup"
        :groupInfo="group"
        :showType="showType"
        :contactType="contactType"
        :showArrow="showArrow"
      ></group-block>
    </div>
    <div
      class="empty-organization"
      v-if="showType == 'group' && !isRequesting && organizationList.length < 1"
    >
      <img src="@/assets/image/chitchat/no_data.png" alt />
      <p>暂无可选人员</p>
    </div>
  </div>
</template>

<script>
import GroupBlock from "./organization/group.vue";
import { mapActions } from "vuex";
export default {
  name: "OrganizationList",
  components: {
    GroupBlock
  },
  props: {
    contactType: {
      type: String,
      default: "organization"
    },
    showType: {
      type: String,
      default: "contact"
    },
    showGroup: {
      type: Boolean,
      default: false
    },
    showArrow: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      organizationList: [],
      isRequesting: true,
      source: null,
      selectCompany: null
    };
  },
  beforeDestroy() {
    this.$root.$off("selectActive", this.selectHandle);
  },
  watch: {
    contactType() {
      this.SetSelectDept({});
      this.init();
    },
    $route(to, from) {
      if (to.name === "Contacts") {
        this.init();
      }
    },
  },
  mounted() {
    this.$root.$on("selectActive", this.selectHandle);
    this.init();
  },
  methods: {
    ...mapActions(["SetSelectDept"]),
    showEmptyCompany() {
      this.$emit("showEmptyCompany")
    },
    handleData(list) {
      for (let index = 0; index < list.length; index++) {
        const element = list[index];
        element.key = `${element.pid}#${element.id}`;
        this.$set(element, "isExpand", element.type < 3 ? true : false);
        if (element.type == 3 && !this.selectCompany) {
          this.selectCompany = { ...element }
          this.$set(element, "isExpand", true);
        }
        this.$set(element, "isActive", false);
        if (element.children && element.children.length) {
          element.children = this.handleData(element.children);
        }
      }
      return list;
    },
    async init() {
      this.organizationList.splice(0);
      this.selectCompany = null;
      try {
        this.source && this.source.cancel({ code: "cancel" });
        this.source = this.$CancelToken.source();
        this.isRequesting = true;
        const type = this.contactType === "organization" ? 0 : 1;
        const res = await this.$service.getContactTree.call(
          this,
          {
            type,
            isGroup: this.showType == "group" ? 1 : undefined
          },
          {
            cancelToken: this.source.token
          }
        );
        const dataList = this.handleData(res || []);
        console.log("dataList", dataList);
        this.organizationList = [...dataList];
      } catch (error) {
        this.organizationList = [];
      } finally {
        this.isRequesting = false;
        if (this.contactType == 'organization' && this.organizationList.length < 1) {
          this.showEmptyCompany();
        }
      }
    },
    async selectHandle(item) {
      this.$set(item, "isExpand", !item.isExpand);
      if (item.type >= 3) {
        if (item.type == 4) {
          // 部门
          const result = await this.getSubDept(item);
          const { depts, users, corpAndCorpRelType, corpType } = result || {
            depts: { list: [] },
            users: { list: [] }
          };
          let deptList = (depts && depts.list) || [];
          let userList = (depts && users.list) || [];
          deptList = deptList.map(item => {
            return {
              ...item,
              corpAndCorpRelType,
              corpType,
              type: 4, //部门
              isExpand: false,
              isActive: false
            };
          });
          userList = userList.map(item => {
            return {
              ...item,
              type: 5 // 成员
            };
          });
          this.$set(item, "children", [...deptList, ...userList]);
        }
        this.SetSelectDept({ ...item });
        this.setActive(this.organizationList, item);
      }
    },
    async getSubDept(item) {
      try {
        const { corpId, id, corpAndCorpRelType, corpType } = item;
        const postData = {
          corpId,
          pid: id,
          corpAndCorpRelType,
          corpType,
          pageNum: 1,
          pageSize: 1000,
          labelType: item.labelType
        };
        const res = await this.$service.getDeptUserPagelist.call(this, {
          ...postData
        });
        return { corpAndCorpRelType, corpType, ...res };
      } catch (error) {
        return {
          depts: { list: [] },
          users: { list: [] }
        };
      }
    },
    setActive(list, activeItem) {
      for (let i = 0; i < list.length; i++) {
        if (
          list[i].id === activeItem.id &&
          activeItem.type > 0 &&
          list[i].key === activeItem.key
        ) {
          // 除了标签
          this.$set(list, i, { ...activeItem });
          this.$set(list[i], "isActive", true);
        } else {
          this.$set(list[i], "isActive", false);
        }
        if (list[i].children && list[i].children.length) {
          this.setActive(list[i].children, activeItem);
        }
      }
    }
  }
};
</script>

<style lang="scss">
.organization-list {
  height: calc(100% - 56px);
  overflow-y: auto;
  .empty-company-label {
    height: 28px;
    background: #e0e4e8;
    opacity: 0.5;
    padding-left: 16px;
    font-size: 12px;
    font-family: SourceHanSansCN-Regular, SourceHanSansCN;
    font-weight: 400;
    color: #5c5d5f;
    display: flex;
    align-items: center;
    cursor: pointer;
    opacity: 0.5;
  }
  .empty-organization {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    img {
      width: 120px;
      height: 78px;
    }
    p {
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #8f959e;
      margin-top: 16px;
    }
  }
}
</style>
