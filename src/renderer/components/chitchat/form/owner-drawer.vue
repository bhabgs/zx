<template>
  <operate-dialog
    :openDialog="drawerOption.show"
    class="open-drawer"
    @close="
      () => {
        $emit('close');
        back();
      }
    "
  >
    <div class="drawer-title" slot="title" @click.stop="back">
      <img src="~@/assets/image/chitchat/back.png" alt />
      <span>{{ drawerOption.title }}</span>
    </div>
    <div class="drawer-content">
      <el-input prefix-icon="el-icon-search" v-model="searchVal" clearable></el-input>
      <el-radio-group v-model="selectVal">
        <el-radio v-for="item in getList" :label="item.accountId" :key="item.accountId">
          <user-photo :user="item"></user-photo>
          <div class="user-name">{{ item.name }}</div>
        </el-radio>
      </el-radio-group>
    </div>
    <div class="drawer-footer">
      <el-button type="primary" :disabled="!selectVal" @click.stop="transferConfirm">确定</el-button>
    </div>
  </operate-dialog>
</template>

<script>
import OperateDialog from "@/components/chitchat/dialog/operate-dialog";
import { mapGetters, mapActions } from "vuex";
export default {
  props: ["drawerOption"],
  components: { OperateDialog },
  data() {
    return {
      searchVal: "", //搜索值
      selectVal: "" //选中值
    };
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      GetCompany: "GetCompany"
    }),
    getList() {
      let list = [];
      if (!!this.searchVal) {
        // 如果搜索框有输入值则按输入值匹配
        list = this.drawerOption.list.filter(item =>
          item.name.includes(this.searchVal)
        );
      } else {
        // 否则为全部成员
        list = [...this.drawerOption.list];
      }
      return list;
    }
  },
  methods: {
    /**
     * 关闭抽屉
     */
    back() {
      this.selectVal = "";
      this.$emit("closeDrawer");
    },
    /**
     * 弹出确认框
     */
    transferConfirm() {
      let selectMember = this.getList.find(
        item => item.accountId == this.selectVal
      );
      const h = this.$createElement;
      this.$msgbox({
        title: "提示",
        message: h("div", null, [
          h("p", null, `是否将群主权限移交给 ${selectMember.name}?`),
          h(
            "p",
            { style: { color: "#999999", fontSize: "12px" } },
            "移交后您将放弃群主身份"
          )
        ]),
        type: "warning",
        customClass: "setting-confirm",
        showCancelButton: true,
        confirmButtonText: "确定",
        cancelButtonText: "取消"
      })
        .then(() => {
          this.transferGroup();
        })
        .catch(error => {
          this.$message.info("已取消");
        });
    },
    /**
     * 移交群主
     */
    transferGroup() {
      let postData = {
        corpId: this.GetCompany.corpId,
        groupId: this.OpenDialog.id,
        newOwner: this.selectVal
      };
      this.$service
        .transferGroup(postData)
        .then(res => {
          this.selectVal = "";
          this.$emit("changeOwner");
        })
        .catch(error => {
          this.$message.error(error.msg || "移交群主失败！");
        });
    }
  }
};
</script>

<style lang="scss">
.open-drawer {
  height: 100%;
  .drawer-title {
    flex-shrink: 0;
    padding-left: 20px;
    margin: 10px 0;
    display: flex;
    align-items: center;
    cursor: pointer;
    img {
      width: 14px;
      height: 14px;
      margin-right: 2px;
      vertical-align: middle;
    }
  }
  .drawer-content {
    flex: 1;
    overflow: hidden;
    padding: 0 20px;
    .el-input {
      margin: 5px 0 10px 0;
      width: 100%;
      .el-input__inner {
        width: 100%;
        height: 30px;
        font-size: 14px;
        text-align: left;
        &:focus {
          border-color: #4498f0;
        }
      }
      .el-input__icon {
        line-height: 20px;
      }
      .el-input__prefix {
        left: 20px;
      }
      .el-input__suffix {
        right: 20px;
      }
    }
    .el-radio-group {
      width: 100%;
      height: calc(100% - 50px);
      overflow-y: auto;
      .el-radio {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        .el-radio__label {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #333;
          .user-photo {
            width: 30px;
            height: 30px;
            flex: 0 0 30px;
            margin-left: 0;
            .user-sign {
              width: 100% !important;
              height: 100% !important;
            }
          }
        }
      }
    }
  }
  .drawer-footer {
    height: 50px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    .el-button {
      width: 54px;
      height: 34px;
      margin-right: 20px;
      padding: 0;
    }
  }
}
.setting-confirm {
  .el-message-box__container {
    .el-message-box__status {
      top: 10px;
    }
  }
}
</style>
