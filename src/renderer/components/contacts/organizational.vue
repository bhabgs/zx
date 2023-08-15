<template>
  <div class="organizational-wrapper">
    <!-- <div :class="['org-statistics', showOrgStatistics?'activate':'']" @click="openStatistics">
      <div>
        <img src="~@/assets/image/statistics/icon-statistics.png" alt="">
        <span>组织统计</span>
      </div>
      <div class="right-arrow">
        <img src="~@/assets/image/statistics/icon-arrow.png" alt="">
      </div>
    </div> -->
    <template v-for="(row, index) of treeList">
      <h6
        class="relate-corp-wrapper"
        :key="row.title + index"
        v-if="row.title && companyList[row.key] && companyList[row.key].length"
        v-text="row.title"
      ></h6>
      <el-tree
        v-show="companyList[row.key] && companyList[row.key].length"
        v-for="corp in companyList[row.key]"
        :key="`${row.key}_${corp.id}`"
        :ref="`${row.key}_${corp.id}`"
        :props="treeProps"
        :load="(node, resolve) => treeLoadHandle(node, resolve, row.key, corp.id)"
        lazy
        :highlight-current="true"
        node-key="rootDeptId"
        @node-click="
          (data, node, store) => nodeClickHandle(data, node, store, row.key, corp.id)
        "
        :current-node-key="routeDeptId"
      >
        <div
          slot-scope="{ node, data }"
          class="custom-tree-node"
          :title="node.label"
        >
          <span class="tree-node-label only-line">{{ node.label }}</span>
          <span class="tree-node-usercount">（{{ data.userCnt }}）</span>
        </div>
      </el-tree>
    </template>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
export default {
  name: "Organizational",
  data() {
    return {
      treeProps: {
        label: "name",
        children: "children",
        isLeaf: "isLeaf"
      },
      defaultExpandedKeys: [], // 默认展开部门的id
      expandedKeys: [], // 存储需要展开部门的id
      treeList: [
        { key: "direct", title: "" },
        { key: "sup", title: "我的上级企业" },
        { key: "sub", title: "我的下级企业" },
        { key: "other", title: "其他企业" }
      ],
      showOrgStatistics: false,
    };
  },
  created() {},
  mounted() {},
  computed: {
    ...mapGetters([
      "GetCompany",
      "GetUser",
      "GetCompanyByRelate",
      "GetSelectDept"
    ]),
    companyList() {
      const list = { direct: [], sup: [], sub: [], other: [] };
      if (this.GetCompanyByRelate) {
        for (const key in list) {
          this.disposeCompanyList(list[key], key);
          for(let i = 0; i < list[key].length; i++) {
            const trees = this.$refs[`${key}_${list[key][i].id}`];
            if (trees && trees.length) {
              const tree = trees[0];
              if (tree && tree.$children.length) {
                let showList = [];
                // 处理公司数据更新
                tree.$children.forEach((item, index) => {
                  let corp = list[key].find(
                    a =>
                      a.id === item.node.data.id &&
                      a.corpTypeEnums === item.node.data.corpTypeEnums
                  );
                  if (corp) {
                    // 存在进行更新，并记录
                    showList.push(`${corp.id}#${corp.corpTypeEnums}`);
                    this.$set(item.node, "data", corp);
                    if (
                      this.GetSelectDept.id === corp.id &&
                      this.GetSelectDept.corpTypeEnums === corp.corpTypeEnums && this.GetSelectDept.corpAndCorpRelTypeEnums === corp.corpAndCorpRelTypeEnums
                    ) {
                      corp.corpType = corp.corpTypeEnums;
                      this.SetSelectDept(corp);
                    }
                  } else {
                    // 公司不存在进行删除
                    if (
                      (this.GetSelectDept.corpId || this.GetSelectDept.id) ===
                        item.node.data.id &&
                      (this.GetSelectDept.corpTypeEnums ||
                        this.GetSelectDept.corpType) ===
                        item.node.data.corpTypeEnums
                    ) {
                      this.SetSelectDept({});
                      this.$router.push({ name: "NotSelectChat" });
                    }
                    tree.remove(item.node);
                  }
                });
              }
            }
          }
        }
      }
      return list;
    },
    routeDeptId() {
      return this.GetSelectDept.rootDeptId;
    }
  },
  watch: {
    $route: {
      deep: true,
      handler(value, oldVal) {
        if (
          value.params.id === "dept" &&
          !value.params.deptId &&
          !oldVal.params.deptId
        ) {
          // 展开之前选中时，展示选中部门的人员
          if(this.showOrgStatistics) {
            this.$router.push({ name: "OrgStatisticsDetail" });
          } else {
            this.routeDeptId && this.$router.push({ name: "DeptDetail" });
          }
        }
      }
    },
  },
  methods: {
    ...mapActions(["SetSelectDept"]),
    treeLoadHandle(node, resolve, type = "direct", corpId) {
      // 树结构数据加载
      if (node.level !== 0) {
        // 不是根节点，掉用接口获取数据
        let corpId = node.data.corpId || node.data.id; // 根据选择获取对应corpId
        let corpAndCorpRelTypeEnums = node.data.corpAndCorpRelTypeEnums;
        let corpType = this.getCorpType(node);
        this.getData(corpId, node.data.rootDeptId, undefined, corpType, corpAndCorpRelTypeEnums)
          .then(result => {
            result.map(
              value => (
                (value.rootDeptId = value.id),
                (value.isLeaf = value.flag === "false" ? true : false),
                (value.corpAndCorpRelTypeEnums = corpAndCorpRelTypeEnums)
              )
            );
            resolve(result);
            node.loaded = false;
          })
          .catch(e => {
            console.error(e);
            // 接口请求失败恢复状态
            node.loaded = false; // 重置为未加载
            node.isLeaf = false; // 重置为存在子节点
            node.expanded = false; // 重置为未展开
            node.loading = false; // 取消loading动画
          });
      } else {
        // 根节点，直接用登录用户的公司列表数据去展示
        this.$nextTick(() => {
          if (this.companyList.direct.length) {
            // 公司列表不为空
            this.checkExpanded();
            const corp = this.companyList[type].filter(item => item.id === corpId);
            resolve(corp);
            node.loaded = false;
          } else {
            // 公司列表为空，如在当前页刷新页面
            // watch登录人信息的变化，当有登录人信息时，获取公司列表
            // 完成之后关闭watch
            let unwatch = this.$watch(
              "GetUser",
              (newVal, oldVal) => {
                this.checkExpanded();
                resolve(this.companyList[type]);
                node.loaded = false;
                unwatch();
              },
              { deep: true }
            );
          }
        });
      }
    },
    async getData(corpId, pid = 0, pageNum = 1, corpType, corpAndCorpRelTypeEnums = null) {
      let corpAndCorpRelType = 0;
      switch(corpAndCorpRelTypeEnums) {
        case "UP_CORP": corpAndCorpRelType = 1; break;
        case "DWON_CORP": corpAndCorpRelType = 2; break;
        case "OTHER": corpAndCorpRelType = 3; break;
      }
      // 获取部门信息
      let result = await this.$service.getDeptList.call(this, {
        corpId,
        pid,
        pageNum,
        corpType,
        corpAndCorpRelType
      });
      let listData = result.list;
      if (
        result.pageSize &&
        result.pageNum &&
        result.pageNum * result.pageSize < result.total
      ) {
        // 当前部门下存在多页数据时，递归获取的所有数据
        let result_data = await this.getData(corpId, pid, ++result.pageNum, corpType, corpAndCorpRelTypeEnums);
        listData = listData.concat(result_data);
      }
      return listData;
    },
    checkExpanded() {
      if (this.routeDeptId) {
        let expanded =
          JSON.parse(
            sessionStorage.getItem(this.$SessionStorageName.contactExpanded)
          ) || [];
        this.defaultExpandedKeys = expanded;
        this.expandedKeys = expanded;
      }
    },
    clearExpanded() {
      this.defaultExpandedKeys.splice(0);
      this.expandedKeys.splice(0);
      sessionStorage.setItem(
        this.$SessionStorageName.contactExpanded,
        JSON.stringify(this.expandedKeys)
      );
    },
    nodeClickHandle(data, node, store, type, corpId) {
      this.showOrgStatistics = false;
      this.resetTreeSelect(`${type}_${corpId}`);
      this.expandedKeys.splice(node.level);
      this.$set(this.expandedKeys, node.level - 1, data.rootDeptId);
      let corpType = this.getCorpType(node);
      data.corpType = corpType;
      sessionStorage.setItem(
        this.$SessionStorageName.contactExpanded,
        JSON.stringify(this.expandedKeys)
      );
      this.SetSelectDept(data);
      const id = this.$myUtils.getRandomId("", 2);
      this.$router.push({ name: "DeptDetail" });
    },
    /**
     * 统一处理企业列表
     */
    disposeCompanyList(list, type) {
      const companyList = this.GetCompanyByRelate[type];
      for (let i = 0; i < companyList.length; i++) {
        const corpUser = companyList[i];
        corpUser.isLeaf = false;
        list.push(corpUser.corp);
      }
    },
    /**
     * 重置树选中
     */
    resetTreeSelect(key) {
      const keys = ["direct", "sup", "sub", "other"];
      let keysList = [];
      keys.forEach(item => {
        let corps = this.companyList[item].map(corp => `${item}_${corp.id}`);
        keysList = keysList.concat(corps)
      })
      keysList.forEach(item => {
        if (item !== key) {
          this.$refs[item] &&
            this.$refs[item][0] &&
            this.$refs[item][0].setCurrentKey(null);
        }
      });
    },
    getCorpType(node) {
      if (node.parent && node.parent.data) {
        return this.getCorpType(node.parent);
      } else if (node.data.corpTypeEnums !== undefined) {
        return node.data.corpTypeEnums;
      }
    },
    //打开组织统计
    openStatistics() {
      this.SetSelectDept({});
      this.resetTreeSelect();
      this.showOrgStatistics = true;
      this.$router.push({ name: "OrgStatisticsDetail" });
    }
  }
};
</script>
<style lang="scss" scoped>
.organizational-wrapper {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  .org-statistics {
    height: 45px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    padding-left: 10px;
    padding-right: 15px;
    border-bottom: 5px solid #F6F6F6;
    cursor: pointer;
    &.activate {
      background: #86C4FF;
      color: #fff;
    }
    img {
      width: 30px;
      height: 30px;
      margin-right: 5px;
    }
    .right-arrow {
      img {
        width: 6px;
        height: 10px;
      }
    }
  }
  ::v-deep .el-tree-node__content {
    height: 40px;
  }
  ::v-deep .el-tree-node__expand-icon {
    color: #999;
    font-size: 18px;
  }
  ::v-deep .el-tree--highlight-current {
    .el-tree-node.is-current {
      > .el-tree-node__content {
        background-color: #86c4ff;
        .el-tree-node__expand-icon:not(.is-leaf),
        .tree-node-label,
        .tree-node-usercount {
          color: #fff;
        }
      }
    }
  }
  .custom-tree-node {
    flex: 1;
    width: calc(100% - 24px);
    display: flex;
    align-items: center;
    font-weight: 500;
    .tree-node-label {
      flex-shrink: 0;
      max-width: calc(100% - 55px);
      color: #22242d;
    }
    .tree-node-usercount {
      flex-shrink: 0;
      font-size: 14px;
      color: #999;
    }
  }
  .relate-corp-wrapper {
    padding: 0 10px;
    line-height: 20px;
    font-size: 12px;
    color: #999;
    background-color: #f7f7f7;
    border: 1px solid #e7e7e7 {
      left: 0;
      right: 0;
    }
  }
}
</style>
