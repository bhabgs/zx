<!-- 全文检索无数据时展示 -->
<template>
  <div class="no-search-data">
    <img
      v-if="noSearchValue"
      src="@/assets/image/approval/no-data.png"
      alt=""
    />
    <img
      v-else-if="noSearchResult"
      src="@/assets/image/search/no-result.png"
      alt=""
    />
    <p>
      <span v-if="search"
        >未搜索到“<font color="#3E7EFF">{{ search }}</font
        >”相关结果</span
      >
      <span v-else>请输入关键词</span>
    </p>
  </div>
</template>

<script>
export default {
  name: "NoData",
  props: {
    search: { type: String, default: "" },
    noSearchResult: { type: Boolean, default: false }
  },
  computed: {
    noSearchValue() {
      return !this.search;
    } // 当前无关键词
  }
};
</script>

<style lang="scss" scoped>
@import "~@/assets/styles/constant";
.no-search-data {
  width: 100%;
  height: 100%;
  @include flexCenter;
  justify-content: flex-start;
  margin-top: 50px;
  flex-direction: column;
  img {
    width: 160px;
    height: 160px;
  }
  p {
    margin-top: 4px;
    span {
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #999999;
    }
  }
}
</style>
