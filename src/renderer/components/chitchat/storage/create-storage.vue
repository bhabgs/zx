<template>
  <div id="create-storage-dialog">
    <el-dialog
      :close-on-click-modal="false"
      :visible="dialogVisible"
      custom-class="create-storage-dialog"
      :class="isOrganization ? 'organization' : 'outsource'"
      @close="closeHandle"
    >
      <template slot="title">
        <div class="storage__title">
          <div class="storage__tittle--name">
            {{ isCreate ? "创建" : "加入" }}-选择单聊/群组
          </div>
          <template v-if="isCreate">
            <div v-if="isEdit" class="storage__name--editing" ref="editingArea">
              <StorageInput
                :tagWidth="18"
                v-model="form.name"
                ref="nameInput"
                placeholder="收纳组名称，建议最多20个字符"
                maxlength="30"
                @enter="tempSave"
              />
              <el-popover
                placeholder="bottom"
                trigger="manual"
                width="148"
                v-model="tagVisible"
              >
                <tag-panel
                  class="tag-panel-area"
                  style="margin: -5px;margin-top:-3px;"
                  @select="handleTagInsert"
                />
                <span
                  ref="tagPanelBtn"
                  slot="reference"
                  class="btn-icon iconfont icon-biaoqing"
                  :class="{ active: tagVisible }"
                  @click.stop="tagVisible = !tagVisible"
                ></span>
              </el-popover>
              <!-- <el-input
                ref="mark"
                size="mini"
                placeholder="输入收纳组名称，最长15个字符"
                v-model="form.name"
                clearable
                @blur="tempSave"
                maxlength="15"
                @keypress.native.enter.prevent="tempSave"
              >
              </el-input> -->
            </div>
            <div v-else class="storage__name--edited" style="margin-left:15px;">
              <span class="name" v-html="getHTMLByText(form.name)"></span>
              <img
                @click="editClickHandle()"
                class="to-edit-btn"
                :class="
                  isOrganization
                    ? 'storage__name--edited-img'
                    : 'storage__name--edited-img-outsource'
                "
                src="@/assets/image/approval/create-edit-default.png"
                alt=""
              />
            </div>
          </template>
          <div v-else class="storage__name--edited">
            {{ getMenuData.name }}
          </div>
        </div>
      </template>
      <div class="storage__div--parent">
        <div class="storage__div--left">
          <div class="storage_div--search">
            <el-input
              size="small"
              v-model="searchText"
              placeholder="搜索姓名、群组名"
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
          <div class="storage__div--selected">已选择</div>
          <div class="storage__div--right-top">
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
                v-if="isCreate"
                type="primary"
                @click="summitCreate"
                :loading="loading"
              >
                确定
              </el-button>
              <el-button
                v-else
                type="primary"
                @click="summitJoin"
                :loading="loading"
              >
                确定
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { IMConversationEnum } from "@/WebIM/conversation/ConversationModel.js";
import { mapGetters } from "vuex";
import { sendStorageMessage } from "@/components/chitchat/utils";
import { getHTMLByText } from "./storage-name/useStorageName";
import StorageInput from "./storage-name/input.vue";
import TagPanel from "./storage-name/tag-panel.vue";

const DEFAULT_NAME = "我的收纳组";
const SPLIT_STR = "__";
export default {
  name: "createStorage",
  components: { StorageInput, TagPanel },
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
    },
    type: {
      type: Number,
      default: 1
    }
  },
  data() {
    return {
      tagVisible: false,
      isEdit: true,
      loading: false,
      form: {
        name: DEFAULT_NAME,
        storageId: "",
        sessionList: []
      },
      searchText: "",
      activeName: "chatGroup",
      chatSingleChecked: [],
      chatGroupChecked: []
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
      const tlist =
        this.dialogType === "organization"
          ? this.GetStorageListSort.organizationList_out
          : this.GetStorageListSort.outsourceList_out;
      return tlist.map(item => {
        return {
          ...item,
          uniqueId: item.id + SPLIT_STR + item.conversationType
        };
      });
    },
    chatSingle() {
      const searchText = this.searchText;
      return this.allList.filter(item => {
        // 机器人不能加入收纳组
        return (
          item.conversationType === IMConversationEnum.PRIVATE &&
          item.name.includes(searchText) &&
          !item.id.includes("robot_")
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
    isCreate() {
      return this.type === 1;
    },
    isJoin() {
      return this.type === 2;
    }
  },
  mounted() {
    const currentIds = this.isCreate
      ? [this.menuData.id + SPLIT_STR + this.menuData.conversationType]
      : [];
    this.form.sessionList = this.getSessionListById(currentIds);
    if (this.menuData.conversationType === IMConversationEnum.PRIVATE) {
      this.activeName = "chatSingle";
      this.chatSingleChecked = currentIds;
    } else {
      this.activeName = "chatGroup";
      this.chatGroupChecked = currentIds;
    }
    if (this.isCreate) {
      // this.$refs["mark"].focus();
      // this.$refs["mark"].select();
      this.$refs.nameInput.select();
    } else {
      this.form.storageId =
        this.menuData.conversationType === IMConversationEnum.GATHER
          ? this.menuData.id
          : this.menuData.storageId;
    }

    document.body.addEventListener("click", this.globalClickHandle);
  },
  destroyed() {
    document.body.removeEventListener("click", this.globalClickHandle);
  },
  methods: {
    getHTMLByText,
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
    editClickHandle() {
      this.isEdit = true;
    },
    tempSave() {
      this.isEdit = false;
      if (this.form.name.trim() === "") {
        this.form.name = DEFAULT_NAME;
      }
    },
    summitCreate() {
      this.loading = true;
      const tJson = {
        name: this.form.name,
        belongSubgroup: this.dialogType === "organization" ? 0 : 1,
        sessionList: this.form.sessionList.map(item => {
          return {
            beId: item.id,
            objectType:
              item.conversationType === IMConversationEnum.PRIVATE ? 2 : 1
          };
        })
      };
      this.$service
        .createStorage(tJson)
        .then(async ({ data, ctime }) => {
          this.$Message.success(`创建收纳组成功`);
          this.loading = false;
          await sendStorageMessage({
            operateType: 0,
            gatherId: data.id,
            gatherName: tJson.name,
            topStatus: this.getMenuData.isTop == 1 ? 1 : 2,
            belongSubgroup: tJson.belongSubgroup,
            moveToGatherId: "",
            childInfo: tJson.sessionList.map(item => {
              return {
                conversationId: item.beId,
                conversationType: item.objectType === 2 ? "private" : "group"
              };
            }),
            time: ctime,
            extra: "",
            doNotDisturb: this.getMenuData.isDisturb,
            finalRealChildList: tJson.sessionList.map(item => {
              return {
                conversationId: item.beId,
                conversationType: item.objectType === 2 ? "private" : "group"
              };
            })
          });
          this.$emit("afterCreateStorage", { id: data.id });
          this.closeHandle();
        })
        .catch(error => {
          this.$Message.error(`创建收纳组失败`);
          this.loading = false;
        });
    },
    handleTagInsert(v) {
      this.$refs.nameInput.insertTag(v);
    },
    globalClickHandle(e) {
      const target = e.target;
      if (
        target.closest(".storage__name--editing") ||
        target.closest(".tag-panel-area") ||
        target.closest(".to-edit-btn")
      ) {
      } else {
        this.tagVisible = false;
        this.tempSave();
      }
    },
    summitJoin() {
      if (this.form.sessionList.length < 1) {
        this.$Message.warning(`请至少选择一个群组或单聊`);
        return;
      }
      this.loading = true;
      const tJson = {
        storageId: this.form.storageId,
        sessionList: this.form.sessionList.map(item => {
          return {
            beId: item.id,
            objectType:
              item.conversationType === IMConversationEnum.PRIVATE ? 2 : 1
          };
        })
      };
      this.$service
        .joinStorage(tJson)
        .then(({ ctime }) => {
          this.$Message.success(`加入会话成功`);
          this.loading = false;
          sendStorageMessage({
            operateType: 3,
            gatherId: tJson.storageId,
            gatherName: this.getMenuData.name,
            topStatus: this.getMenuData.isTop == 1 ? 1 : 2,
            belongSubgroup: this.getMenuData.belongSubgroup,
            moveToGatherId: "",
            childInfo: tJson.sessionList.map(item => {
              return {
                conversationId: item.beId,
                conversationType: item.objectType === 2 ? "private" : "group"
              };
            }),
            time: ctime,
            extra: "",
            doNotDisturb: this.getMenuData.isDisturb,
            finalRealChildList: this.getMenuData.children
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
                      item.objectType === 2 ? "private" : "group"
                  };
                })
              )
          });
          this.closeHandle();
        })
        .catch(error => {
          console.log(error);
          this.$Message.error(`加入会话失败`);
          this.loading = false;
        });
    }
  },
  watch: {
    isEdit: {
      async handler() {
        if (this.isCreate && this.isEdit) {
          await this.$nextTick();
          // this.$refs["mark"].focus();
          this.$refs.nameInput.select();
        }
      },
      immediate: true
    }
  }
};
</script>

<style lang="scss">
#create-storage-dialog {
  .el-dialog {
    width: 688px;
    height: 540px;
    position: fixed;
    left: 50%;
    top: 50%;
    margin: -260px 0 0 -344px !important;
    border-radius: 8px;
  }
  .create-storage-dialog {
    .storage__title {
      text-align: left;
      border-radius: 4px 4px 0px 0px;
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #1f2329;
      font-weight: 500;
    }
    .storage__tittle--name {
      padding-top: 5px;
      height: 30px;
      display: inline-flex;
    }
    .storage__searchtext {
      border-radius: 2px;
      font-weight: 400;
      font-size: 14px;
    }
    .storage__name--editing {
      height: 30px;
      padding-top: 2px;
      text-align: left;
      margin: 0 0 0 0;
      width: 270px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      left: 50%;
      position: absolute;
      transform: translateX(-50%);
      .storage-input {
        height: 30px;
        .input {
          img {
            width: 18px;
          }
        }
      }
      .btn-icon {
        cursor: pointer;
        color: #aaadbb;
        &:hover,
        &.active {
          color: #4598f0;
        }
      }
    }
    .storage__name--edited {
      height: 30px;
      text-align: center;
      display: inline-flex;
      align-items: center;
      font-weight: 600;
      font-size: 105%;
      left: 50%;
      position: absolute;
      transform: translateX(-50%);
      .name {
        display: flex;
        align-items: center;
        img {
          width: 18px;
        }
      }
      .storage__name--edited-img {
        height: 34px;
        width: 34px;
        // margin: 4px 8px;
        // position: relative;
        // top: -10px;
        // left: -10px;
        padding: 10px;
        cursor: pointer;
        &:hover {
          content: url("~@/assets/image/approval/create-edit-blue.png");
        }
      }
      .storage__name--edited-img-outsource {
        height: 34px;
        width: 34px;
        margin: 4px 8px;
        position: relative;
        top: -10px;
        left: -10px;
        padding: 10px;
        cursor: pointer;
        &:hover {
          content: url("~@/assets/image/approval/create-edit-green.png");
        }
      }
    }
    .storage__div--selected {
      width: 100%;
      text-align: left;
      margin: 10px 10px 5px;
      font-size: 12px;
      font-family: MicrosoftYaHei;
      color: #999999;
      padding-left: 10px;
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
        .storage_div--search {
          padding-right: 20px;
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
          .name {
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
          width: 100%;
          max-height: 75%;
          overflow: auto;
          margin-left: 16px;
          .storage-sessionlist__div--selected {
            height: 30px;
            background: #f3f4f5;
            border-radius: 16px;
            display: flex;
            align-items: center;
            padding: 0px 16px;
            margin: 5px 4px;
            max-width: 250px;
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
      padding: 10px 20px 10px;
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
