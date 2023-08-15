<template>
  <div id="common-storage-dialog">
    <el-dialog
      :close-on-click-modal="false"
      :visible="dialogVisible"
      :custom-class="customClass"
      :class="isOrganization ? 'organization' : 'outsource'"
      @close="close"
    >
      <template slot="title">
        <div class="storage__title">
          <div class="storage__tittle--name">
            <slot name="title"></slot>
          </div>
          <slot name="title-append"></slot>
        </div>
      </template>
      <slot name="body"></slot>
    </el-dialog>
  </div>
</template>

<script>
export default {
  name: "storageDialog",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isOrganization: {
      type: Boolean,
      default: Boolean
    },
    customClass: {
      type: String,
      default: "common-storage-dialog"
    }
  },
  methods: {
    close() {
      this.$emit("close");
    }
  }
};
</script>

<style lang="scss">
#common-storage-dialog {
  .el-dialog {
    width: 688px;
    height: 540px;
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    margin: -260px 0 0 -344px !important;
    border-radius: 8px !important;
  }
  .common-storage-dialog {
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
