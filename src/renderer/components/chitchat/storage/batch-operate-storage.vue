<template>
  <div id="batch-operate-storage-dialog">
    <el-dialog
      :close-on-click-modal="false"
      :visible="dialogVisible"
      custom-class="batch-operate-storage-dialog"
      :class="isOrganization ? 'organization' : 'outsource'"
      @close="closeHandle"
    >
      <template slot="title">
        <div class="storage__title">
          <div class="">批量移动-选择单聊/群组</div>
          <div class="">
            {{ form.name }}
          </div>
        </div>
      </template>
      <div class="storage__div--parent">
        <div class="storage__div--left">
          <div class="storage_div--search">
            <el-input
              v-model="searchText"
              placeholder="搜索姓名、群组名"
              size="small"
              clearable
            >
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>
          <el-tabs v-model="activeName">
            <el-tab-pane label="群组" name="chatGroup">
              <div class="storage__div--left-list">
                <el-checkbox-group v-model="chatGroupChecked">
                  <template v-for="item in chatGroup">
                    <el-checkbox
                      :label="item.uniqueId"
                      :key="item.uniqueId"
                      @change="checkboxChangeHandle($event, item)"
                    >
                      <div class="el-checkbox-box">
                        <group-photo
                          class="avatar-box"
                          :group="item"
                        ></group-photo>
                        <div>
                          <div class="name">
                            <div :title="item.name" class="tooltip">
                              {{ item.name }}
                            </div>
                          </div>
                          <div class="ren">
                            {{ getMemberSizeById(item.id) }}人
                          </div>
                        </div>
                      </div>
                    </el-checkbox>
                  </template>
                </el-checkbox-group>
              </div>
            </el-tab-pane>
            <el-tab-pane label="单聊" name="chatSingle">
              <div class="storage__div--left-list">
                <el-checkbox-group v-model="chatSingleChecked">
                  <template v-for="item in chatSingle">
                    <el-checkbox
                      :label="item.uniqueId"
                      :key="item.uniqueId"
                      @change="checkboxChangeHandle($event, item)"
                    >
                      <div class="el-checkbox-box">
                        <user-photo
                          class="avatar-box"
                          :user="item"
                        ></user-photo>

                        <div class="name">
                          {{ item.name }}
                        </div>
                      </div>
                    </el-checkbox>
                  </template>
                </el-checkbox-group>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <div class="storage__div--right">
          <div class="storage__div--right-top">
            <div class="storage__div--selected">已选择</div>
            <template v-for="item in form.sessionList">
              <div :key="item.id" class="storage-sessionlist__div--selected">
                <span class="storage-sessionlist__div--span">{{
                  item.name
                }}</span>
                <img
                  @click="deleteSession(item)"
                  class="el-icon-delete storage-sessionlist__i--delete"
                  src="@/assets/image/approval/close.png"
                  alt=""
                />
              </div>
            </template>
          </div>
          <div class="storage__div--right--bottom">
            <div class="storage__div--footer">
              <el-button class="close" @click="closeHandle">取消</el-button>

              <el-button
                type="primary"
                class="confirm"
                @click="summitMoveTo"
                :loading="loading"
              >
                移动至
              </el-button>
              <el-button
                type="primary"
                class="confirm"
                @click="summitMoveOut"
                :loading="loading"
              >
                移出
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
    <storage-list
      v-if="storageListVisible"
      :visible.sync="storageListVisible"
      :menuData="menuData"
      @closeHandle="closeBatchOperateStorageHandle"
      @summitHandle="summitMoveToHandle"
    ></storage-list>
  </div>
</template>

<script>
import { IMConversationEnum } from "@/WebIM/conversation/ConversationModel.js";
import { mapGetters } from "vuex";
import storageList from "./batch-operate/storage-list.vue";
import { sendStorageMessage } from "@/components/chitchat/utils";
const SPLIT_STR = "__";
export default {
  name: "batchOperateStorage",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    menuData: {
      type: Object,
      default: function() {
        return {};
      }
    }
  },
  components: { storageList },
  data() {
    return {
      form: {
        name: "",
        storageId: "",
        sessionList: []
      },
      searchText: "",
      activeName: "",
      chatSingleChecked: [],
      chatGroupChecked: [],
      storageListVisible: false,
      loading: false
    };
  },
  computed: {
    ...mapGetters({
      dialogType: "GetChitchatType",
      GetStorageListSort: "GetStorageListSort",
      GetGroups: "GetGroups"
    }),
    getMenuData() {
      return this.menuData;
    },
    getMemberSizeById() {
      return id => {
        const currentGroup = this.GetGroups[id] || {};
        return currentGroup.groupNumber || 0;
      };
    },
    dialogVisible() {
      return this.visible;
    },
    isOrganization() {
      return this.dialogType === "organization";
    },
    allList() {
      return this.menuData.children.map(item => {
        return {
          ...item,
          uniqueId: item.id + SPLIT_STR + item.conversationType
        };
      });
    },
    chatSingle() {
      const searchText = this.searchText;
      return this.allList.filter(item => {
        return (
          item.conversationType === IMConversationEnum.PRIVATE &&
          item.name.includes(searchText)
        );
      });
    },
    chatGroup() {
      const searchText = this.searchText;
      return this.allList.filter(item => {
        return (
          item.conversationType !== IMConversationEnum.PRIVATE &&
          item.name.includes(searchText)
        );
      });
    },
    gatherName() {
      return storageId => {
        const tlist = this.GetStorageListSort.storageList.filter(item => {
          return item.id === storageId;
        });
        return tlist.length > 0 ? tlist[0] : {};
      };
    }
  },
  mounted() {
    const currentIds = [];
    this.chatSingleChecked = [];
    this.chatGroupChecked = [];
    this.form.sessionList = this.getSessionListById(currentIds);
    const firstSession = this.menuData.children[0];
    this.activeName =
      firstSession.conversationType === IMConversationEnum.PRIVATE
        ? "chatSingle"
        : "chatGroup";
    this.form.storageId = this.menuData.id;
  },
  methods: {
    deleteSession(json) {
      const sessionId = json.uniqueId;
      this.form.sessionList = this.form.sessionList.filter(item => {
        return item.uniqueId !== sessionId;
      });
      this.chatSingleChecked = this.chatSingleChecked.filter(item => {
        return item !== sessionId;
      });
      this.chatGroupChecked = this.chatGroupChecked.filter(item => {
        return item !== sessionId;
      });
    },
    checkboxChangeHandle(value, json) {
      if (value) {
        this.form.sessionList = this.form.sessionList.concat(
          this.getSessionListById([json.uniqueId])
        );
      } else {
        this.form.sessionList = this.form.sessionList.filter(item => {
          return item.uniqueId !== json.uniqueId;
        });
      }
    },
    getSessionListById(ids) {
      return this.allList.filter(item => {
        return ids.includes(item.uniqueId);
      });
    },
    closeHandle() {
      this.$emit("closeHandle");
    },
    summitMoveOut() {
      if (this.form.sessionList.length < 1) {
        this.$message.warning("请至少选择一个群组或单聊");
      } else {
        this.quitStorage("");
      }
    },
    summitMoveTo() {
      if (this.form.sessionList.length < 1) {
        this.$message.warning("请至少选择一个群组或单聊");
      } else {
        this.storageListVisible = true;
      }
    },
    summitMoveToHandle(currentSession) {
      this.quitStorage(currentSession.id);
      this.$emit("handleClose", false);
    },
    quitStorage(toStorageId) {
      this.loading = true;

      const tJson = {
        fromStorageId: this.form.storageId,
        toStorageId,
        sessionList: this.form.sessionList.map(item => {
          return {
            beId: item.id,
            objectType:
              item.conversationType === IMConversationEnum.PRIVATE ? 2 : 1
          };
        })
      };
      // 会话列表中，conversationType == IMConversationEnum.PRIVATE == 1是个人，conversationType == IMConversationEnum.GROUP == 2是群
      // 后台收纳组批量移动时，objectType == 1是群，objectType == 2是个人
      this.$service
        .quitStorage(tJson)
        .then(({ ctime }) => {
          this.$Message.success(
            `${tJson.toStorageId ? "批量移动至成功" : "批量移动成功"}`
          );
          this.loading = false;
          // 给融云发送消息时，conversationType == "group"是群，conversationType == "private"是人
          let sendMessage = {
            operateType: tJson.toStorageId ? 5 : 4,
            gatherId: tJson.fromStorageId,
            gatherName: this.getMenuData.name,
            topStatus: this.getMenuData.isTop == 1 ? 1 : 2,
            belongSubgroup: this.getMenuData.belongSubgroup,
            moveToGatherId: tJson.toStorageId,
            childInfo: tJson.sessionList.map(item => {
              return {
                conversationId: item.beId,
                conversationType: item.objectType === 1 ? "group" : "private"
              };
            }),
            time: ctime,
            extra: "",
            doNotDisturb: this.getMenuData.isDisturb,
            finalRealChildList: this.getMenuData.children
              .filter(item => {
                return !this.form.sessionList
                  .map(sub => sub.id + sub.conversationType)
                  .includes(item.id + item.conversationType);
              })
              .map(item => {
                return {
                  conversationId: item.id,
                  conversationType:
                    item.conversationType === IMConversationEnum.PRIVATE
                      ? "private"
                      : "group"
                };
              })
          };
          if (tJson.toStorageId) {
            const moveToObj = this.gatherName(tJson.toStorageId);
            sendMessage = {
              ...sendMessage,
              moveToGatherName: moveToObj.name,

              moveToGatherTopStatus: moveToObj.isTop == 1 ? 1 : 2,
              moveToGatherBelongSubgroup: moveToObj.belongSubgroup,
              moveToGatherDoNotDisturb: moveToObj.isDisturb,
              moveToGatherFinalRealChildList: moveToObj.children
                .map(item => {
                  return {
                    conversationId: item.id,
                    conversationType:
                      item.conversationType === IMConversationEnum.PRIVATE
                        ? "private"
                        : "group"
                  };
                })
                .concat(
                  tJson.sessionList.map(item => {
                    return {
                      conversationId: item.beId,
                      conversationType:
                        item.objectType === 1 ? "group" : "private"
                    };
                  })
                )
            };
          }
          sendStorageMessage(sendMessage);
          this.closeHandle();
        })
        .catch(error => {
          console.log(error);
          this.$Message.error(
            `${tJson.toStorageId ? "批量移动至失败" : "批量移动失败"}`
          );
          this.loading = false;
        });
    },
    closeBatchOperateStorageHandle() {
      this.storageListVisible = false;
    }
  },
  watch: {}
};
</script>

<style lang="scss">
#batch-operate-storage-dialog {
  .batch-operate-storage-dialog {
    width: 688px;
    height: 540px;
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    margin: -260px 0 0 -344px !important;
    border-radius: 8px !important;

    .storage__title {
      text-align: left;
      border-radius: 4px 4px 0px 0px;
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #1f2329;
      font-weight: 500;
    }
    .storage__tittle--name {
      height: 28px;
      display: inline-flex;
    }
    .storage__name--editing {
      height: 30px;
      text-align: center;
      margin: 0px 10px 0px 50px;
      width: 200px;
      display: inline-flex;
    }
    .storage__name--edited {
      height: 30px;
      text-align: center;
      margin: 0px 10px 0px 80px;
      display: inline-flex;
      font-weight: 600;
      font-size: 105%;
    }
    .storage__icon {
      cursor: pointer;
      margin-top: 3px;
      margin-left: 5px;
    }
    .storage__div--selected {
      width: 100%;
      text-align: left;
      margin: 10px 10px 5px;
      color: #999999;
    }
    .storage__div--parent {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      display: flex;
      .storage__div--left {
        flex: 1;
        padding: 10px 0 0 20px;
        display: flex;
        flex-direction: column;
        height: 100%;
        .storage_div--search{
          padding-right:20px;
        }
        .storage__div--left-list {
          overflow: hidden;
          overflow-y: auto;
          height: 380px;
        }
        .el-tabs__nav-wrap::after {
          background-color: #fff !important;
        }
        .el-tabs__content {
          overflow: hidden;
          position: relative;
          overflow-y: auto;
        }
        .el-checkbox {
          display: flex;
          align-items: center;
        }
        .el-checkbox__inner {
          border-radius: 50%;
        }
        .el-checkbox__label {
          padding-left: 0px;
          display: flex;
        }
        .el-checkbox-box {
          display: flex;
          height: 60px;
          align-items: center;
          font-size: 14px;
          font-family: MicrosoftYaHei;
          color: #1f2329;
          overflow: hidden;

          width: 100%;
          .tooltip {
            width: 200px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          .ren {
            font-size: 12px;
            font-family: MicrosoftYaHei;
            color: #8f959e;
          }
        }
      }

      .storage__div--right {
        flex: 1;
        border-left: 1px solid #e7e7e7;
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 10px 20px 0 0;
        position: relative;
        .storage__div--right-top {
          padding: 0px;
          display: flex;
          flex-wrap: wrap;
          overflow: auto;
          width: 100%;
          .storage-sessionlist__div--selected {
            height: 30px;
            background: #f3f4f5;
            border-radius: 16px;
            display: flex;
            align-items: center;
            padding: 0px 16px;
            margin: 5px 4px;
            .storage-sessionlist__div--span {
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              display: block;
              max-width: 250px;
            }
            .storage-sessionlist__i--delete {
              margin-left: 5px;
              width: 10px;
              height: 10px;
            }
          }
          .storage-sessionlist__i--delete {
            cursor: pointer;
          }
        }
        .storage__div--right--bottom {
          border-top: 1px solid #e7e7e7;
          display: flex;
          flex-direction: column;
          width: 100%;
          position: absolute !important;
          bottom: -4px !important;
        }
        .el-checkbox__input {
          margin-top: -35px !important;
        }

        .storage__div--footer {
          display: flex;
          justify-content: flex-end;
          padding-right: 10px;
          height: 54px;
          align-items: center;
        }
        .storage__div--right-bottom {
          border-top: 1px solid #dde0e3;
          height: 54px;
        }
        .el-button {
          line-height: 0.5;
        }
      }
    }
    .el-dialog__header {
      height: 50px;
      background: #f3f4f5;
      border-radius: 4px 4px 0px 0px;
      padding: 15px 20px 10px;
      color: #1f2329;
      .el-dialog__title {
        font-size: 14px;
      }
      .el-dialog__headerbtn {
        top: 15px;
        right: 16px;
      }
    }
    .el-dialog__body {
      margin: 0;
      padding: 0;
      height: 90%;
    }
  }
}
</style>
