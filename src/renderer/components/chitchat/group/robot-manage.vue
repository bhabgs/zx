<template>
  <operate-dialog
    :openDialog="true"
    class="open-drawer"
    @close="
      () => {
        back();
      }
    "
  >
    <div class="drawer-title" slot="title" @click.stop="back">
      <img src="~@/assets/image/chitchat/back.png" alt="" />
      <span>智能群助手</span>
    </div>
    <div class="drawer-content">
      <!-- <el-input
        prefix-icon="el-icon-search"
        v-model="searchVal"
        placeholder="搜索群助手"
        clearable
      ></el-input> -->
      <div class="robot-list-container">
        <!-- 添加群助手 -->
        <div
          class="robot-list-item add-robot-box"
          @click="editRobotHandle('create')"
        >
          <span class="robot-list-item-icon add-robot-icon">&#43;</span>
          <div class="robot-list-item-des add-robot-des">
            <p>添加自定义助手</p>
            <p>可自定义合适自己的机器人</p>
          </div>
          <span class="robot-list-item-arrows"></span>
        </div>

        <!-- 已添加机器人列表 -->
        <div
          class="robot-list-item robot-instance-box"
          v-for="robot of groupRobots"
          :key="robot.chatAccountId"
          @click="editRobotHandle('edit', robot)"
        >
          <img class="robot-list-item-icon" :src="robot.chatRobotImage" />
          <div class="robot-list-item-des">
            <p v-text="robot.chatRobotName"></p>
            <p></p>
          </div>
          <span class="robot-list-item-arrows"></span>
        </div>
      </div>
      <div class="no-seach-box" v-if="searchVal && !groupRobots.length">
        <img src="~@/assets/image/robot_logo.png" alt="" />
        <p>搜索无结果</p>
        <el-button type="text" @click="editRobotHandle('create')"
          >立即添加</el-button
        >
      </div>
    </div>

    <edit-robot
      v-if="editRobotVisible"
      :visible.sync="editRobotVisible"
      :group="group"
      :editType="editType"
      :robot="selectRobot"
      @remove-robot="removeRobotHandle"
      @update-group="$emit('update-group', { type: 'remote' })"
    ></edit-robot>
  </operate-dialog>
</template>

<script>
import OperateDialog from "@/components/chitchat/dialog/operate-dialog";
import EditRobot from "./edit-robot";

import { mapGetters, mapActions } from "vuex";
export default {
  name: "RobotManage",
  props: ["option", "group"],
  components: { OperateDialog, EditRobot },
  data() {
    return {
      searchVal: "", //搜索值
      selectVal: "", //选中值
      editRobotVisible: false,
      editType: 1, // 编辑机器人类型
      selectRobot: {}
    };
  },
  created() {},
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      GetCompany: "GetCompany",
      GetSendUser: "GetSendUser"
    }),
    groupRobots() {
      let list = (this.group || {}).groupRobots || [];
      return list;
    }
  },
  methods: {
    /**
     * 关闭抽屉
     */
    back() {
      this.selectVal = "";
      this.$emit("close");
    },
    /**
     * 新建或编辑群助手
     * @param {string} type edit/create
     */
    editRobotHandle(type, robot) {
      switch (type) {
        case "create":
          // 新建
          this.editType = 1;
          break;

        case "edit":
          // 编辑
          this.selectRobot = robot;
          this.editType = 2;
          break;

        default:
          break;
      }
      if (
        this.editType === 1 ||
        (this.editType === 2 &&
          [this.group.owner, robot.chatRobotCreator].includes(
            this.GetSendUser.id
          ))
      ) {
        this.editRobotVisible = true;
      } else if (this.editType === 2) {
        this.$emit("robot-info", robot);
      }
    },
    removeRobotHandle() {
      this.selectRobot = {};
      this.$emit("update-group", { type: "remote" });
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
    user-select: none;
    flex-shrink: 0;
    img {
      width: 14px;
      height: 14px;
      margin-right: 2px;
      vertical-align: middle;
    }
  }
  .drawer-content {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #f6f6f6;
    .el-input {
      margin-top: 10px;
      width: 100%;
      flex-shrink: 0;
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
    }

    > input,
    > div,
    > section {
      padding: 0 20px;
    }
  }

  .robot-list-container {
    flex: 1;
    overflow: hidden auto;
    margin-top: 10px;
    .robot-list-item {
      display: flex;
      align-items: center;
      padding: 10px;
      margin: {
        bottom: 10px;
      }
      overflow: hidden;
      background-color: #fff;
      border-radius: 4px;
      cursor: pointer;

      .robot-list-item-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      .robot-list-item-des {
        flex: 1;
        margin: 0 10px;
        overflow: hidden;

        > p {
          &:nth-of-type(1) {
            margin-bottom: 4px;
            line-height: 19px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #333;
            font-size: 14px;
          }
          &:nth-of-type(2) {
            font-size: 12px;
            color: #999999;
            line-height: 16px;
          }
        }
      }

      .robot-list-item-arrows {
        flex-shrink: 0;
        width: 6px;
        height: 10px;
        background: url(~@/assets/image/arrowtoRight.png) no-repeat center
          center/100% 100%;
      }
    }

    .add-robot-box {
      user-select: none;
      > span {
        flex-shrink: 0;
      }

      .add-robot-icon {
        line-height: 35px;
        text-align: center;
        color: #4498f0;
        font-size: 30px;
        border: 1px dashed #4498f0;
        background-color: rgba(68, 152, 240, 0.1);
      }

      .add-robot-des {
        > p {
          &:nth-of-type(1) {
            color: #4498f0;
          }
        }
      }
    }
  }
  .no-seach-box {
    margin-top: 95px;
    text-align: center;

    > img {
      width: 40px;
      height: 40px;
    }

    > p {
      margin: {
        top: 10px;
        bottom: 5px;
      }
      font-size: 12px;
      color: #999999;
      line-height: 16px;
    }

    > button {
      padding: 0;
      font-size: 12px;
      color: #4498f0;
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
