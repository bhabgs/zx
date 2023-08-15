<template>
  <div class="storage__div--parent">
    <div class="storage__div--left">
      <el-input
        size="small"
        v-model="searchText"
        placeholder="搜索姓名、群组名"
        clearable
      >
        <i slot="prefix" class="el-input__icon el-icon-search"></i>
      </el-input>
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
                    <group-photo class="avatar-box" :group="item"></group-photo>
                    <div>
                      <div class="name">
                        <div :title="item.name" class="tooltip">
                          {{ item.name }}
                        </div>
                      </div>
                      <div class="ren">{{ getMemberSizeById(item.id) }}人</div>
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
                    <user-photo class="avatar-box" :user="item"></user-photo>

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
            <span class="storage-sessionlist__div--span">{{ item.name }}</span>
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
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import { IMConversationEnum } from "@/WebIM/conversation/ConversationModel.js";
import { mapGetters } from "vuex";
export default {
  name: "sessionSelect",
  props: {
    storageList: {
      type: Array,
      default: function() {
        return [];
      }
    }
  },
  components: {},
  data() {
    return {
      form: {
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
      GetGroups: "GetGroups"
    }),
    allList() {
      return this.storageList;
    },
    getMemberSizeById() {
      return id => {
        const currentGroup = this.GetGroups[id] || {};
        return currentGroup.groupNumber || 0;
      };
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
    }
  },
  mounted() {},
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
    }
  },
  watch: {}
};
</script>

<style lang="scss">
.storage__div--parent {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  display: flex;
  .storage__div--left {
    flex: 1;
    padding: 10px 20px;
    display: flex;
    flex-direction: column;
    // overflow-y: auto;
    height: 100%;
    padding-left: 20px;
    .storage__div--left-list {
      overflow: hidden;
      overflow-y: auto;
      height: 380px;
    }
    .el-input--small {
      // padding-right: 20px;
    }
    // .el-input{
    //   width: 95%;
    // }
    .el-tabs__nav-wrap::after {
      background-color: #fff !important;
    }
    .el-tabs__content {
      overflow: hidden;
      position: relative;
      overflow-y: auto;
      // height: 55vh;
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
        // }
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
    // height: 72vh;
    padding-right: 16px;
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
</style>
