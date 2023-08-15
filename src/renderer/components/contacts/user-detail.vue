<template>
  <div class="user-detail-container">
    <div class="user-info-header">
      <span>个人信息</span>
    </div>
    <user-pop-info
      class="user-detail-content"
      :user="options"
      :onlyCorp="options.corpId"
      :showChangeHead="false"
    ></user-pop-info>
  </div>
</template>
<script>
import UserPopInfo from "../common/user/user-info";

export default {
  name: "UserDetail",
  components: { UserPopInfo },
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  data() {
    return {};
  },
  created() {},
  mounted() {},
  computed: {}
};
</script>
<style lang="scss">
@import "~@/assets/styles/constant";

$--user-detail-title-height: 40px;

.user-detail-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-flow: column;
  align-items: center;
  line-height: 1;
  background: #fff;
  .user-info-header {
    width: 100%;
    height: 40px;
    line-height: 40px;
    padding-left: 20px;
    box-sizing: border-box;
    border-bottom: 1px solid rgba(231, 231, 231, 1);
    background: white;
    font-weight: bold;
  }
  .user-detail-content {
    margin-top: 15%;
    width: 340px;
    height: auto;
    background: #fff;
    box-shadow: none;
    .user-pop-header {
      background: #fff;
    }
  }
}
</style>
