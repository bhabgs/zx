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
    <div class="drawer-content robot-info-container">
      <ul>
        <li>
          <img :src="robot.chatRobotImage" alt="" />
          <div>
            <p>{{ robot.chatRobotName }}</p>
            <p v-show="createUser.name">由{{ createUser.name }}添加</p>
          </div>
        </li>
        <li>
          <span>机器人名称</span>
          <span>{{ robot.chatRobotName }}</span>
        </li>
        <li>
          <span>添加到群聊</span>
          <span>{{ group.name }}</span>
        </li>
      </ul>
    </div>
  </operate-dialog>
</template>

<script>
import OperateDialog from "@/components/chitchat/dialog/operate-dialog";

import { mapGetters, mapActions } from "vuex";
export default {
  name: "RobotInfo",
  props: ["robot", "group"],
  components: { OperateDialog },
  data() {
    return {
      createUser: {}
    };
  },
  mounted() {
    if (this.robot && this.robot.chatRobotCreator) {
      this.getCreateUser(this.robot.chatRobotCreator);
    }
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      GetCompany: "GetCompany",
      GetNotCorpUsers: "GetNotCorpUsers",
      AllUserMap: "GetAllUserMap"
    })
  },
  methods: {
    /**
     * 关闭抽屉
     */
    back() {
      this.$emit("close");
    },
    getCreateUser(id) {
      let user = this.AllUserMap[id] || this.GetNotCorpUsers[id];
      if (!user) {
        this.$service.getAccountInformationOrganization
          .call(this, { id })
          .then(res => {
            if (res) {
              this.createUser = { ...res, accountId: id };
            }
          })
          .catch(error => {});
      } else {
        this.createUser = user;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
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
    img {
      width: 14px;
      height: 14px;
      margin-right: 2px;
      vertical-align: middle;
    }
  }
  .drawer-content {
    flex: 1;
    padding: 0 20px;
  }

  .robot-info-container {
    background-color: #fff;
    height: calc(100% - 50px);
    overflow: hidden auto;

    > ul {
      > li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 0;
        color: #333333;
        border-bottom: 1px solid #e7e7e7;
        &:not(:first-of-type) {
          padding: 15px 0;

          > span {
            font-size: 14px;
            line-height: 20px;

            &:last-of-type {
              color: #999;
            }
          }
        }

        &:first-of-type {
          > img {
            margin: {
              right: 10px;
            }
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
          }

          > div {
            flex: 1;

            > p {
              padding: 0;
              margin: 0;

              &:first-of-type {
                line-height: 19px;
              }

              &:nth-of-type(2) {
                font-size: 12px;
                color: #999999;
                line-height: 16px;
              }
            }
          }
        }
      }
    }
  }
}
</style>
