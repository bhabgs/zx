<template>
  <div class="group-list-wrapper">
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
          :class="{ 'select-group': selectGroupId === group.id }"
          @click="selectGroupHandler(group)"
          :title="group.name"
        >
          <group-photo class="avatar-box" :group="group"></group-photo>
          <div class="group-info-container">
            <p>
              <span class="only-line" v-text="group.name"></span>
              <group-sign :type="group.type"></group-sign>
            </p>
            <!-- <p class="people-number">
              <span v-text="group.groupNumber"></span>人
            </p> -->
          </div>
        </li>
      </ul>
    </iscroll-view>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {
      currentGroup: {},
      groupList: [],
      selectGroup: {},
      scrollTop: 0, // 滚动位置
      isLoading: false // 是否正在加载数据
    };
  },
  props: {
    listType: {
      type: String,
      default: "organization"
    }
  },
  created() {
    this.getGroupList();
  },
  mounted() {},
  computed: {
    ...mapGetters(["GetGroups", "GetUser"]),
    groupListByTime() {
      let list = [...this.groupList];

      /* for (const key in this.GetGroups) {
        list.push(this.GetGroups[key]);
      } */
      list.reverse((a, b) => {
        const at = new Date(a.createAt).getTime();
        const bt = new Date(b.createAt).getTime();

        return at > bt;
      });
      return list;
    },
    selectGroupId() {
      return this.selectGroup.id;
    },
    groupIds() {
      let ids = [];
      ids = this.groupList.map(group => group.id);
      return ids;
    }
  },
  watch: {
    listType(val, oldVal) {
      this.getGroupList().then(res => {
        this.gotoDetail();
      });
    }
  },
  methods: {
    ...mapActions(["PushGroup"]),
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
          pageNum,
          pageSize: 200,
          type: this.listType === "organization" ? 0 : 10
        })
        .then(result => {
          this.currentGroup = result;
          const list = result.resultList || [];
          if (pageNum == 1) {
            this.groupList.splice(0);
          }
          list.forEach(group => {
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
        .catch(err => {
          this.isLoading = false;
        });
    },
    selectGroupHandler(group) {
      this.selectGroup = group;
      this.gotoDetail();
    },
    gotoDetail() {
      let groupId = {};
      if (this.selectGroup.id) {
        groupId = this.selectGroup.id;
      } else {
        const firstGroup = this.groupListByTime[0];
        groupId = firstGroup.id;
      }
      this.$emit("selectGroup", groupId);
      this.$nextTick(() => {
        try {
          let selectItem = document.getElementsByClassName("select-group")[0];
          let scrollView = this.$refs.scrollView;
          selectItem && scrollView && scrollView.scrollInto(this.scrollTop);
        } catch (error) {}
      });
    },
    scrollHandler(e) {
      this.scrollTop = e.target.scrollTop;
    }
  }
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.group-list-wrapper {
  width: 100%;
  height: 100%;
  background-color: #f7f7f7;

  .group-list-container {
    background-color: #fff;
    > li {
      padding: 0 20px;
      height: 60px;
      width: 100%;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #e7e7e7;
      cursor: pointer;
      overflow: hidden;
      .avatar-box {
        margin: 0;
      }
      .group-info-container {
        flex: 1;
        max-width: 180px;
        margin-left: 10px;
        overflow: hidden;
        > p {
          display: flex;
        }
        .people-number {
          color: #999;
          font-size: 14px;
        }
      }
      &.select-group {
        // 选中状态
        background-color: #86c4ff;
        color: #fff;
        .people-number {
          color: #fff;
        }
      }
    }
  }
}
</style>
