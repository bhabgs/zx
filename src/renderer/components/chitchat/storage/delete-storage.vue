<template>
  <div id="delete-storage-dialog">
    <el-dialog
      :close-on-click-modal="false"
      :visible="dialogVisible"
      title="温馨提示"
      custom-class="delete-storage-dialog"
      :class="isOrganization ? 'organization' : 'outsource'"
      @close="closeHandle"
    >
      <template slot="title">
        <p class="storage-title">温馨提示</p>
      </template>
      <p class="normal-word">确定解散当前收纳组吗？</p>
      <p class="small-word">分组内的会话不会被删除，将移动至会话列表。</p>
      <div slot="footer" class="dialog-footer">
        <el-button class="close" @click="closeHandle">取消</el-button>
        <el-button
          type="primary"
          class="confirm"
          @click="summit"
          :loading="loading"
        >
          确定
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { sendStorageMessage } from "@/components/chitchat/utils";
import { IMConversationEnum } from "@/WebIM/conversation/ConversationModel.js";
export default {
  name: "deleteStorage",
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
  components: {},
  data() {
    return {
      storageId: 0,
      loading: false
    };
  },
  computed: {
    dialogVisible() {
      return this.visible;
    },
    isOrganization() {
      return this.menuData.belongSubgroup === 0;
    },
    getMenuData() {
      return this.menuData;
    }
  },
  mounted() {
    this.storageId = this.menuData.id;
  },
  methods: {
    closeHandle() {
      this.$emit("closeHandle");
    },
    summit() {
      this.loading = true;
      this.$service
        .deleteStorage({
          storageIdList: [this.storageId]
        })
        .then(({ ctime }) => {
          this.$Message.success(`解散收纳组成功`);
          this.loading = false;
          sendStorageMessage({
            operateType: 7,
            gatherId: this.storageId,
            gatherName: this.getMenuData.name,
            topStatus: this.getMenuData.isTop == 1 ? 1 : 2,
            belongSubgroup: this.getMenuData.belongSubgroup,
            moveToGatherId: "",
            childInfo: this.getMenuData.children.map(item => {
              return {
                conversationId: item.id,
                conversationType:
                  item.conversationType === IMConversationEnum.PRIVATE
                    ? "private"
                    : "group"
              };
            }),
            time: ctime,
            extra: "",
            doNotDisturb: this.getMenuData.isDisturb,
            finalRealChildList: this.getMenuData.children.map(item => {
              return {
                conversationId: item.id,
                conversationType:
                  item.conversationType === IMConversationEnum.PRIVATE
                    ? "private"
                    : "group"
              };
            })
          });
          this.closeHandle();
        })
        .catch(error => {
          this.$Message.error(`解散收纳组失败`);
          this.loading = false;
        });
    }
  }
};
</script>

<style lang="scss">
#delete-storage-dialog {
  .delete-storage-dialog {
    width: 338px;
    border-radius: 4px;
    .storage-title {
      text-align: center;
      border-radius: 4px 4px 0px 0px;
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #1f2329;
      font-weight: 500;
    }
    .el-dialog__header {
      height: 40px;
      background: #f3f4f5;
      border-radius: 4px 4px 0px 0px;
      padding: 10px 20px 15px;
      color: #1f2329;
      .el-dialog__title {
        font-size: 14px;
      }
      .el-dialog__headerbtn {
        top: 10px;
        right: 16px;
      }
    }
    .el-dialog__body {
      padding: 24px 20px;
    }
    .el-dialog__footer {
      padding-top: 6px;
    }
    .normal-word {
      font-size: 14px;
      color: #1f2329;
    }
    .small-word {
      margin-top: 12px;
      font-size: 12px;
      color: #5d616b;
    }
  }
}
</style>
