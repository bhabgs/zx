<!--
 * @Author: lixiaowei
 * @Date: 2021-04-22 10:47:53
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-04-27 13:44:47
 * @Description: file content
 * @FilePath: /zx-client-pc/src/renderer/components/chitchat/search-box.vue
-->
<template>
  <div class="search-box">
    <i class="search-icon iconfont icon-sousuo"></i>
    <input
      id="search-input"
      class="search-input"
      ref="searchInput"
      v-model="searchVal"
      @focus="searchFocusHandle()"
      @blur="searchBlurHandle()"
      type="text"
      :placeholder="placeholder"
    />
    <search-result
      :needRobot="needRobot"
      :visible.sync="IsSearch"
      class="search-result"
      :search="searchVal"
      @selectresult="selectSearchHandle"
    ></search-result>
  </div>
</template>

<script>
export default {
  name: "SearchBox",
  props: {
    placeholder: { type: String, default: "搜索" },
    needRobot: { type: Boolean, default: false }
  },
  data() {
    return {
      searchVal: "",
      IsSearch: false
    };
  },
  created() {},
  mounted() {},
  computed: {},
  watch: {},
  methods: {
    searchFocusHandle() {
      this.IsSearch = true;
    },
    searchBlurHandle() {
      this.IsSearch = false;
    },
    selectSearchHandle(item) {
      this.$refs.searchInput.blur();
      this.$emit("select", item);
    }
  }
};
</script>

<style lang="scss" scoped>
$--search-box-height: 32px;
$--search-input-margin-left: 0;
$--search-icon-left: $--search-input-margin-left + 10px;

.search-box {
  -webkit-app-region: no-drag;
  position: relative;
  flex: 0 0;
  height: $--search-box-height;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  user-select: auto;
  margin: 10px 20px;
  .search-icon {
    position: absolute;
    top: 50%;
    left: $--search-icon-left;
    font-size: 14px;
    color: #c9cfd8;
    transform: translateY(-50%);
  }
  .search-input {
    margin: {
      left: $--search-input-margin-left;
    }
    width: 100%;
    height: 100%;
    border-radius: 17px;
    text-indent: 30px;
    font-size: 12px;
    background-color: #f3f4f5;
    &::-webkit-input-placeholder {
      color: #c9cfd8;
    }
  }

  /* 搜索结果 */
  .search-result {
    position: absolute;
    top: 45px;
    left: 15px;
    width: 274px;
    z-index: 999;
    box-shadow: 0 0 10px rgba($color: #000, $alpha: 0.3);
    border-radius: 4px;
  }
}
</style>
