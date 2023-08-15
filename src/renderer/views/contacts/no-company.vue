<template>
  <div class="not-in-company">
    <img src="~@/assets/visitor/no-data.png" alt />
    <p>您还没有任何企业，去手机端加入企业吧！</p>
    <p class="line-two">
      您也可以
      <el-button type="text" @click="createCompany">立即创建企业/团队</el-button>
    </p>
  </div>
</template>
<script>
export default {
  name: "NotInTeam",
  data() {
    return {

    }
  },
  methods: {
    createCompany() {
      this.$root.$emit("createCompany")
    },
  }
};
</script>

<style lang="scss">
.not-in-company {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fff;
  position: relative;
  img {
    width: 194px;
    height: 108px;
  }
  p {
    font-size: 12px;
    font-family: PingFangSC-Regular, PingFang SC;
    font-weight: 400;
    color: #8f959e;
    margin-top: 24px;
    &.line-two {
      margin-top: 8px;
      .el-button {
        padding: 0;
        span {
          font-size: 12px;
          color: #3e7eff;
        }
      }
    }
  }
}
</style>

