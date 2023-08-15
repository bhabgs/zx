<template>
  <div id="rename-storage-dialog">
    <el-dialog
      :close-on-click-modal="false"
      :visible="dialogVisible"
      custom-class="rename-storage-dialog"
      :class="isOrganization ? 'organization' : 'outsource'"
      @close="closeHandle"
    >
      <template slot="title">
        <p class="storage-title">重命名收纳组</p>
      </template>
      <el-form label-position="top" label-width="80px" :model="form">
        <el-form-item label="请输入收纳组名称">
          <StorageInput
            v-model="form.name"
            style="margin-bottom: 10px; height: 40px;"
            maxlength="30"
            ref="input"            
            placeholder="建议最多20个字符"
            @enter="submit" />
          <!-- <el-input
            ref="mark"
            v-model="form.name"
            @keypress.native.enter.prevent="submit"
            placeholder="请输入收纳组新名称"
            maxlength="15"
            clearable
          ></el-input> -->
        </el-form-item>
      </el-form>
      <tag-panel @select="handleTagSelect" style="margin-top: -16px"/>
      <div slot="footer" class="dialog-footer">
        <el-button class="close" @click="closeHandle">取消</el-button>
        <el-button
          type="primary"
          class="confirm"
          :loading="loading"
          @click="submit"
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
import TagPanel from './storage-name/tag-panel.vue'
import StorageInput from './storage-name/input.vue'
export default {
  name: "renameStorage",
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
  components: { TagPanel, StorageInput },
  data() {
    return {
      form: {
        name: "",
        storageId: 0
      },
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
  async mounted() {
    this.form.storageId = this.menuData.id;
    this.form.name = this.menuData.name;
    await this.$nextTick();
    // this.$refs["mark"].focus();
    // this.$refs["mark"].select();
    this.$refs["input"].select();
  },
  methods: {
    closeHandle() {
      this.$emit("closeHandle");
    },
    handleTagSelect(v) {
      this.$refs.input.insertTag(v);
    },
    submit() {
      if (this.form.name.trim() === "") {
        this.$Message.warning("请输入收纳组名称");
        return;
      }
      const tJson = {
        storageId: this.form.storageId,
        name: this.form.name
      };
      this.loading = true;
      this.$service
        .editStorage(tJson)
        .then(({ ctime }) => {
          this.$Message.success(`重命名收纳组成功`);
          this.loading = false;
          sendStorageMessage({
            operateType: 1,
            gatherId: tJson.storageId,
            gatherName: tJson.name,
            topStatus: this.getMenuData.isTop == 1 ? 1 : 2,
            belongSubgroup: this.getMenuData.belongSubgroup,
            moveToGatherId: "",
            childInfo: [],
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
          this.$Message.error(`重命名收纳组失败`);
          this.loading = false;
        });
    }
  }
};
</script>

<style lang="scss">
#rename-storage-dialog {
  .rename-storage-dialog {
    width: 338px;
    border-radius: 4px;
    .el-form-item__label {
      line-height: 1;
      padding-bottom: 16px;
    }
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
      // padding-top: 6px;
    }
    .dialog-footer {
      .el-button {
        line-height: 0.8;
      }
    }
  }
}
</style>
