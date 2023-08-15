<template>
  <div class="ReceiveSetOf">
    <el-dialog
      :title="type == 1 ? '选择加入哪个组' : '选择移入哪个组'"
      :visible="dialogVisible"
      :close-on-click-modal="false"
      :center="true"
      width="346px"
      :before-close="handleClose"
    >
      <el-main v-loading="loading">
        <div v-if="storageListBeforeFilter.length > 0" class="box">
          <div class="search">
            <el-input v-model="searchText" placeholder="搜索">
              <i slot="prefix" class="el-input__icon el-icon-search"></i>
            </el-input>
          </div>

          <div class="content">
            <!-- 加入收纳组 -->
            <div
              v-show="type == 1"
              @click="addjoinStorage(item)"
              :class="isOrganization ? 'content-list' : 'wxcontent-list'"
              v-for="item in storageList"
              :key="item.id"
            >
              <div class="content-img">
                <img :src="packGroupIcon" alt="" />
              </div>
              <div class="content-name">
                <!-- 【{{ storageNameFormat(item.name) }}】 -->
                【<span class="stroage-name" :title="item.name" v-html="getHTMLByText(storageNameFormat(item.name))"></span>】
              </div>
            </div>
            <!-- 移动收纳组 -->
            <div
              v-show="type == 2"
              @click="addjoinStorage(item)"
              :class="
                isOrganization ? 'move-content-list' : 'move-wxcontent-list'
              "
              v-for="item in storageList"
              :key="item.createAt"
            >
              <div class="content-img">
                <img :src="packGroupIcon" alt="" />
              </div>
              <div class="content-name">
                <!-- 【{{ storageNameFormat(item.name) }}】 -->
                【<span class="stroage-name" :title="item.name" v-html="getHTMLByText(storageNameFormat(item.name))"></span>】
              </div>
            </div>
          </div>
        </div>

        <div v-else class="box">
          <div class="box-null">
            <img :src="noData" alt="" />
          </div>
          <div class="fontSize">暂无其他收纳组</div>
          <div class="btn">
            <el-button
              @click="createStorage()"
              :class="isOrganization ? '' : 'wxoutsource'"
              type="primary"
              >创建收纳组</el-button
            >
          </div>
        </div>
      </el-main>
    </el-dialog>
    <create-storage
      v-if="createStorageVisible"
      :menuData="menuData"
      :visible="createStorageVisible"
      @afterCreateStorage="afterCreateStorageHandle"
      @closeHandle="createStorageVisible = false"
    ></create-storage>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import { IMConversationEnum } from "@/WebIM/conversation/ConversationModel.js";
import { sendStorageMessage } from "../utils/sendStorageMessage";
import createStorage from "@/components/chitchat/storage/create-storage.vue";
import { getHTMLByText } from  '@/components/chitchat/storage/storage-name/useStorageName';

export default {
  name: "ReceiveSetOf",
  components: { createStorage },
  props: ["dialogVisible", "contextMenuData", "type"],
  data() {
    return {
      searchText: "",
      loading: false,
      createStorageVisible: false
    };
  },
  mounted() {},
  computed: {
    ...mapGetters({
      GetStorageListSort: "GetStorageListSort",
      dialogType: "GetChitchatType"
    }),

    isJoinMobile() {
      return this.type;
    },
    isOrganization() {
      return this.dialogType === "organization";
    },
    storageId() {
      return this.contextMenuData.storageId;
    },
    storageListBeforeFilter() {
      if (this.isJoinMobile == 1) {
        return this.GetStorageListSort.storageList.filter(item => {
          return item.belongSubgroup == (this.isOrganization ? 0 : 1);
        });
      } else {
        return this.GetStorageListSort.storageList.filter(item => {
          return (
            item.belongSubgroup == (this.isOrganization ? 0 : 1) &&
            item.id !== this.storageId
          );
        });
      }
    },
    gatherName() {
      return storageId => {
        const tlist = this.GetStorageListSort.storageList.filter(item => {
          return item.id === storageId;
        });
        return tlist.length > 0 ? tlist[0] : {};
      };
    },
    menuData() {
      return this.gatherName(this.storageId);
    },
    storageList() {
      const searchText = this.searchText;
      return this.storageListBeforeFilter.filter(item => {
        return item.name.includes(searchText);
      });
    },
    packGroupIcon() {
      return require(this.isOrganization
        ? "@/assets/image/approval/pack-group-icon.png"
        : "@/assets/image/approval/wx-pack-group-icon.png");
    },
    noData() {
      return require(this.isOrganization
        ? "@/assets/image/approval/no-data.png"
        : "@/assets/image/approval/wx-no-data.png");
    }
  },
  methods: {
    getHTMLByText,
    addjoinStorage(item) {
      if (this.type == 1) {
        this.loading = true;
        let vm = this;

        let data = {
          storageId: item.id,
          sessionList: [
            {
              beId: vm.contextMenuData.id,
              objectType:
                vm.contextMenuData.conversationType ==
                IMConversationEnum.PRIVATE
                  ? 2
                  : 1
            }
          ]
        };
        this.$service
          .joinStorage(data)
          .then(response => {
            this.$emit("handleClose", false);
            this.$Message.success("加入成功");
            this.loading = false;
            let sendData = {
              operateType: 3,
              gatherId: item.id,
              gatherName: item.name,
              topStatus: item.isTop == 1 ? 1 : 2, //是否置顶
              belongSubgroup: item.belongSubgroup, //属于哪个组0组织会话1外联会话
              moveToGatherId: "", //移动到什么组
              childInfo: [
                {
                  conversationId: this.contextMenuData.id,
                  conversationType:
                    this.contextMenuData.conversationType ===
                    IMConversationEnum.PRIVATE
                      ? "private"
                      : "group"
                }
              ], //操作收纳组子项
              time: response.ctime,
              extra: "",
              doNotDisturd: item.isDisturb,
              finalRealChildList: item.children
                .map(item => {
                  return {
                    conversationId: item.id,
                    conversationType:
                      item.conversationType === IMConversationEnum.PRIVATE
                        ? "private"
                        : "group"
                  };
                })
                .concat([
                  {
                    conversationId: this.contextMenuData.id,
                    conversationType:
                      this.contextMenuData.conversationType ===
                      IMConversationEnum.PRIVATE
                        ? "private"
                        : "group"
                  }
                ])
            };
            sendStorageMessage(sendData);
          })
          .catch(error => {
            this.$Message.error("加入失败");
            this.loading = false;
          });
      } else {
        this.loading = true;
        let obj = this.gatherName(this.contextMenuData.storageId);
        let moveToObj = this.gatherName(item.id);
        let data = {
          fromStorageId: this.contextMenuData.storageId,
          toStorageId: item.id,
          sessionList: [
            {
              beId: this.contextMenuData.id,
              objectType:
                this.contextMenuData.conversationType ==
                IMConversationEnum.PRIVATE
                  ? 2
                  : 1
            }
          ]
        };
        this.$service
          .quitStorage(data)
          .then(response => {
            this.$emit("handleClose", false);
            this.loading = false;
            this.$Message.success("移动成功");
            let sendData = {
              operateType: 5,
              gatherId: obj.id,
              gatherName: obj.name,
              topStatus: obj.isTop == 1 ? 1 : 2, //是否置顶
              belongSubgroup: obj.belongSubgroup, //属于哪个组0组织会话1外联会话
              moveToGatherId: item.id, //移动到什么组
              childInfo: [
                {
                  conversationId: this.contextMenuData.id,
                  conversationType:
                    this.contextMenuData.conversationType === 1
                      ? "private"
                      : "group"
                }
              ], //操作收纳组子项
              time: response.ctime,
              extra: "",
              doNotDisturd: obj.isDisturb,
              finalRealChildList: obj.children
                .filter(item => {
                  return (
                    item.id !== this.contextMenuData.id ||
                    item.conversationType !==
                      this.contextMenuData.conversationType
                  );
                })
                .map(item => {
                  return {
                    conversationId: item.id,
                    conversationType:
                      item.conversationType === IMConversationEnum.PRIVATE
                        ? "private"
                        : "group"
                  };
                }),
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
                .concat([
                  {
                    conversationId: this.contextMenuData.id,
                    conversationType:
                      this.contextMenuData.conversationType ===
                      IMConversationEnum.PRIVATE
                        ? "private"
                        : "group"
                  }
                ])
            };
            sendStorageMessage(sendData);
          })
          .catch(() => {
            this.loading = false;
            this.$Message.error("移动失败");
          });
      }
    },
    handleClose(done) {
      this.$emit("handleClose", false);
    },
    createStorage() {
      this.createStorageVisible = true;
    },
    async afterCreateStorageHandle(obj) {
      this.addjoinStorage(this.gatherName(obj.id));
    },
    storageNameFormat(name) {
      const showStorageName = `${(name || "")
        .replace(/^【{1,}/g, "")
        .replace(/】{1,}$/g, "")}`;
      return name ? showStorageName : "";
    }
  }
};
</script>
<style lang="scss">
.ReceiveSetOf {
  height: 100%;
  .content-name {
    max-width: 88%;
  }
  .stroage-name {
    // display: inline-flex;
    // align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    img {
      width: 18px;
      vertical-align: sub;
    }
  }
  .el-dialog {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    margin: -250px 0 0 -173px !important;
    border-radius: 8px !important;
    height: 500px;
  }
  .el-dialog__body {
    padding: 25px 0px 30px !important;
  }
  .el-main {
    padding: 0;
  }
  .box {
    .search {
      padding: 0px 20px;
    }
    .box-null {
      text-align: center;
      img {
        width: 40%;
        height: 40%;
      }
    }
    .fontSize {
      text-align: center;
      margin-top: 10px;
      height: 14px;
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #999999;
      line-height: 14px;
    }
    .btn {
      text-align: center;
      margin-top: 40%;
      .wxoutsource {
        background-color: rgba(54, 209, 142, 1);
        border-color: rgba(54, 209, 142, 1);
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
  .content {
    margin-top: 10px;
    height: 370px;
    overflow: hidden;
    overflow-y: auto;
    .content-list {
      display: flex;
      align-items: center;
      height: 60px;
      background: #ffffff;
      cursor: pointer !important;
      padding-left: 30px;

      .content-img {
        > img {
          width: 30px;
          height: 30px;
        }
      }

      &:hover {
        background: rgba(62, 126, 255, 0.07);
        color: #1f2329;
      }
      .content-pitch {
        img {
          width: 12px;
          height: 12px;
        }
      }
      .content-name {
        display: flex;
        align-items: center;
        padding-left: 16px;
        color: #1f2329;
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
      }
    }
    .wxcontent-list {
      display: flex;
      align-items: center;
      height: 60px;
      background: #ffffff;
      cursor: pointer !important;
      padding-left: 30px;

      .content-img {
        > img {
          width: 30px;
          height: 30px;
        }
      }

      &:hover {
        background: rgba(54, 209, 142, 0.07);
      }
      .content-pitch {
        img {
          width: 12px;
          height: 12px;
        }
      }
      .content-name {
        display: flex;
        align-items: center;
        padding-left: 16px;
        color: #1f2329;
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
      }
    }
    .move-wxcontent-list {
      display: flex;
      align-items: center;
      height: 60px;
      background: #ffffff;
      cursor: pointer !important;
      padding-left: 30px;
      .content-img {
        > img {
          width: 30px;
          height: 30px;
        }
      }

      &:hover {
        background: url("~@/assets/image/approval/wxicon.png") no-repeat 12px
          25px rgba(54, 209, 142, 0.07);
        background-size: 12px 12px;
      }

      .content-pitch {
        img {
          width: 12px;
          height: 12px;
        }
      }
      .content-name {
        display: flex;
        align-items: center;
        padding-left: 16px;
        color: #1f2329;
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
      }
    }
    .move-content-list {
      display: flex;
      align-items: center;
      height: 60px;
      background: #ffffff;
      cursor: pointer !important;
      padding-left: 30px;
      .content-img {
        > img {
          width: 30px;
          height: 30px;
        }
      }

      &:hover {
        color: #1f2329;
        background:  12px 25px
          rgba(62, 126, 255, 0.07);
        background-size: 12px 12px;
      }

      .content-pitch {
        img {
          width: 12px;
          height: 12px;
        }
      }
      .content-name {
        display: flex;
        align-items: center;
        padding-left: 16px;
        color: #1f2329;
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
      }
    }
  }
}
</style>
