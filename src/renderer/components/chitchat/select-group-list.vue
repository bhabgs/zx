<template>
  <div class="group-list-wrapper">
    <organization-outsource
      :active="activeIndex"
      :btnList="btnList"
      @changeListType="goToPage"
    ></organization-outsource>
    <iscroll-view
      ref="scrollView"
      @loadNext="loadNextHandler"
      v-loading="isLoading"
      @scroll="scrollHandler"
    >
      <ul class="group-list-container">
        <li
          v-for="(group, index) of groupListByTime"
          :key="index"
          :title="group.name"
          @click="selectGroupHandler(group)"
        >
          <a-checkbox
            v-if="multipleSelect"
            class="mt-checkbox-circle"
            :checked="selected.includes(group.id)"
          ></a-checkbox>
          <img
            v-else
            class="w-20px h-20px flex-shrink-0 rounded-full"
            :src="require(`@/assets/image/chitchat/list-radio-${checkedObj.conversationType === group.conversationType && checkedObj.id === group.id ? 'checked' : 'uncheck'}.png`)"
          />
          <group-photo class="avatar-box" :group="group"></group-photo>
          <div class="group-info-container">
            <p>
              <span class="only-line" v-text="group.name"></span>
              <group-sign :type="group.type"></group-sign>
            </p>
            <p class="people-number">
              <span v-text="group.groupNumber"></span>人
            </p>
          </div>
        </li>
      </ul>
    </iscroll-view>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";

import OrganizationOutsource from "@/components/common/organization-outsource";
export default {
  name: "SelecGroupList",
  components: {
    OrganizationOutsource,
  },
  props: {
    // 已选列表
    selected: {
      type: Array,
      default: () => []
    },
    // 是否多选
    multipleSelect: {
      type: Boolean,
      default: true
    },
    // 选中的单项
    checkedObj: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      currentGroup: {},
      groupList: [],
      selectGroup: {},
      scrollTop: 0, // 滚动位置
      isLoading: false, // 是否正在加载数据
      activeIndex: 0,
      btnList: [
        { name: "组织群", icon: "organization", key: "organization" },
        { name: "外联群", icon: "outsource", key: "outsource" },
      ],
    };
  },
  created() {
    this.getGroupList();
  },
  mounted() {
    this.activeIndex = 0;
  },
  computed: {
    ...mapGetters(["GetGroups", "GetUser"]),
    groupListByTime() {
      let list = [...this.groupList];
      list.reverse((a, b) => {
        const at = new Date(a.createAt).getTime();
        const bt = new Date(b.createAt).getTime();
        return at > bt;
      });
      list = list.map(item => {
        return { ...item, conversationType: 3};
      });
      return list;
    },
    groupIds() {
      let ids = [];
      ids = this.groupList.map((group) => group.id);
      return ids;
    },
  },
  watch: {},
  methods: {
    ...mapActions(["PushGroup"]),
    goToPage(config) {
      const index = this.btnList.findIndex((item) => item.key === config.key);
      this.activeIndex = index;
      this.groupList.splice(0);
      this.getGroupList();
    },
    loadNextHandler() {
      const pageConfig = this.currentGroup.pageConfig;
      if (pageConfig && pageConfig.hasNextPage) {
        this.getGroupList({ pageNum: ++pageConfig.pageNum });
      }
    },
    getGroupList({ pageNum = 1 } = {}) {
      this.isLoading = true;
      return this.$service.groupListApi
        .call(this, {
          accountId: this.GetUser.id,
          type: this.activeIndex === 0 ? 0 : 10,
          pageNum,
          pageSize: 200,
        })
        .then((result) => {
          this.currentGroup = result;
          const list = result.resultList || [];
          if (pageNum == 1) {
            this.groupList.splice(0);
          }
          list.forEach((group) => {
            let index = this.groupIds.indexOf(group.id);
            if (index == -1) {
              this.groupList.push({ ...group });
            } else {
              this.$set(this.groupList, index, { ...group });
            }
          });
          if (list.length) {
            this.PushGroup([list]);
          }
          this.isLoading = false;
        })
        .catch((err) => {
          this.isLoading = false;
        });
    },
    selectGroupHandler(group) {
      const { selectGroup, selected } = this;
      let type = "";
      if (selectGroup[group.id] || selected.includes(group.id)) {
        this.$delete(selectGroup, group.id);
        type = "delete";
      } else {
        this.$set(selectGroup, group.id, group);
        type = "add";
      }

      this.$emit("changeSelect", {
        item: group,
        items: selectGroup,
        type,
      });
    },
    /**
     * 取消选择
     * @param {String} id 群组id
     */
    cancelSelect(id) {
      if (id && typeof id === "string") {
        this.$delete(this.selectGroup, id);
      }
    },
    scrollHandler(e) {
      this.scrollTop = e.target.scrollTop;
    },
  },
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/constant";
.group-list-wrapper {
  width: 100%;
  height: 100%;
  .iscroll-view {
    height: calc(100% - 40px);
  }
  .group-list-container {
    > li {
      padding: 0 20px;
      height: 60px;
      width: 100%;
      display: flex;
      align-items: center;
      cursor: pointer;

      &:hover {
        background-color: #e4e6ea;
      }

      .group-info-container {
        flex: 1;
        max-width: 180px;
        margin-left: 10px;
        > p {
          display: flex;
        }
        .people-number {
          color: #999;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
