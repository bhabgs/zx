<template>
  <el-dialog
    class="guide-page"
    :close-on-click-modal="false"
    title="【收纳组】功能来了"
    :show-close="false"
    :visible.sync="dialogVisible"
    width="433px"
    :before-close="handleClose"
  >
    <template v-if="pageNumber === 1">
      <div class="title">群聊又多又乱怎么办？创建【收纳组】轻松解决</div>
      <div class="establish">
        <div class="yuan"></div>
        <div>创建收纳组</div>
      </div>
      <div class="content">
        <img src="@/assets/image/approval/create-storage-groups.gif" alt="" />
      </div>
      <div class="method">
        <div>
          <img src="@/assets/image/approval/bulb.png" alt="" />
        </div>
        <div>方法</div>
      </div>
      <div class="list">
        <p>第一步：右键单击单聊/群组。</p>
        <p>第二步：选择【创建收纳组】。</p>
        <p>第三步：将单聊/群组加进去，定义组名。</p>
      </div>
    </template>
    <template v-else-if="pageNumber === 2">
      <div class="title">会话快速归类，轻松一键搞定</div>
      <div class="establish">
        <div class="yuan"></div>
        <div>加入“已有收纳组”</div>
      </div>
      <div class="content">
        <img src="@/assets/image/approval/join-storage-groups.gif" alt="" />
      </div>
      <div class="method">
        <div>
          <img src="@/assets/image/approval/bulb.png" alt="" />
        </div>
        <div>方法</div>
      </div>
      <div class="list">
        <p>右键单击单聊/群组，在弹出菜单中选择【加入已有收纳组】。</p>
        <!-- 以下为了做占位使用 -->
        <p style="opacity: 0">&nbsp;</p>
        <p style="opacity: 0">&nbsp;</p>
      </div>
    </template>
    <div class="footer">
      <p>{{ pageNumber }} / {{ pageSize }}</p>
      <p @click="skip()" v-if="pageNumber !== pageSize" class="btn-hover">跳过，下次再说</p>
      <p @click="setPageNumber(-1)" v-if="pageNumber !== 1" class="btn-hover">上一页</p>
      <p @click="setPageNumber(1)" v-if="pageNumber !== pageSize" class="btn-hover">下一页</p>
      <p @click="immediateExperience()" v-if="pageNumber === pageSize" class="btn-hover">
        立即体验
      </p>
    </div>
  </el-dialog>
</template>
<script>
export default {
  props: ["dialogVisible"],
  data() {
    return {
      pageNumber: 1,
      pageSize: 2
    };
  },
  mounted() {},
  methods: {
    setPageNumber(number) {
      this.pageNumber =
        ((this.pageNumber - 1 + this.pageSize + number) % this.pageSize) + 1;
    },
    handleClose() {
      this.$emit("closeGuidePage", false);
    },
    skip() {
      // 跳过直接关闭，下次登录还会提醒
      this.handleClose();
    },
    immediateExperience() {
      this.handleClose();
      // 把变量存到localstorage中，当不存在或为空时，要有引导，如果取出来是时间则不处理
      localStorage.setItem("storage-guide", new Date());
      this.$Message.success("可在帮助中心查看");
    }
  }
};
</script>
<style scoped>
.el-dialog__wrapper {
  overflow: hidden !important;
}
</style>
<style lang="scss">
.guide-page {
  .el-dialog {
    background: url("~@/assets/image/approval/guide-page-bg.png") 0px -41px;
    background-size: 100%;
    margin-top: 8vh !important;
  }
  .el-dialog__body {
    padding: 10px 20px;
  }
  .el-dialog__header {
    line-height: 1;
    text-align: center;
    .el-dialog__title {
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #666666;
    }
  }
  .title {
    height: 14px;
    font-size: 14px;
    font-family: MicrosoftYaHei-Bold, MicrosoftYaHei;
    font-weight: bold;
    color: #333333;
    line-height: 14px;
  }
  .establish {
    height: 14px;
    font-size: 14px;
    font-family: MicrosoftYaHei;
    color: #3e7eff;
    line-height: 14px;
    margin-top: 16px;
    display: flex;
    align-items: center;
    .yuan {
      width: 8px;
      height: 8px;
      background: #3d7fff;
      margin-right: 10px;
      border-radius: 50%;
    }
  }
  .content {
    width: 100%;
    border-radius: 4px;
    margin-top: 10px;
    img {
      width: 100%;
      box-shadow: 5px 5px 20px rgba(0,0,0,0.08);
    }
  }
  .method {
    height: 12px;
    font-size: 12px;
    font-family: MicrosoftYaHei-Bold, MicrosoftYaHei;
    font-weight: bold;
    color: #3e7eff;
    line-height: 12px;
    margin-top: 10px;
    display: flex;
    align-items: center;
  }
  .list {
    margin-top: 10px;
    p {
      color: #333333;
      font-size: 12px;
    }
  }
  .footer {
    display: flex;
    margin-top: 15px;
    .btn-hover{
      cursor: pointer;
    }
    p:nth-child(1) {
      height: 12px;
      font-size: 12px;
      font-family: MicrosoftYaHei;
      color: #999999;
      line-height: 12px;
      flex: 1;
    }
    p:nth-child(2) {
      height: 12px;
      font-size: 12px;
      font-family: MicrosoftYaHei;
      color: #999999;
      line-height: 12px;
      padding-right: 16px;
    }
    p:nth-child(3) {
      height: 12px;
      font-size: 12px;
      font-family: MicrosoftYaHei;
      color: #3e7eff;
      line-height: 12px;
    }
  }
}
</style>
