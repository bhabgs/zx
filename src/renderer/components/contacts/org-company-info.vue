<template>
  <div class="org-company-info">
    <div class="org-company-info-title">
      <img src="~@/assets/image/statistics/icon-company.png" alt="">
      <span class="org-company-info-name" :title="companyName">{{companyName}}</span>
    </div>
    <div class="org-company-info-content">
      <div class="org-company-info-content-block" v-for="(item, index) in showList" :key="`${item}_${index}`">
        <div class="item-block" v-for="(value, key) in item" :key="key" v-show="!item.hasOwnProperty('separator')">
          <div class="label">{{key}}</div>
          <div class="value">{{value}}</div>
        </div>
        <div v-if="item.hasOwnProperty('separator')" class="separator"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "OrgCompanyInfo",
  props: {
    companyInfo: {
      type: Object,
      default:() => {
        return {
          companyName: "",
          itemList: []
        }
      }
    }
  },
  data(){
    return {}
  },
  mounted() {},
  computed: {
    companyName() {
      return this.companyInfo.corpName;
    }, 
    showList() {
      return this.companyInfo.itemList || []
    }
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.org-company-info {
  width: 255px;
  height: 340px;
  background: #fff;
  margin: 0 0 10px 10px;
  padding: 0 3px;
  flex-shrink: 0;
  box-shadow: 0px 0px 14px 0px rgba(147, 157, 176, 0.2);
  border-radius: 4px;
  &-title {
    height: 66px;
    display: flex;
    padding-top: 16px;
    box-sizing: border-box;
    align-items: flex-start;
    flex-shrink: 0;
    padding: 20px 16px;
    img {
      width: 22px;
      height: 22px;
      margin-right: 5px;
    }
    span {
      display: flex;
      font-size: 14px;
      font-family: PingFangSC-Medium, PingFang SC;
      font-weight: bold;
      color: #1F2329;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
  &-content {
    padding: 0 16px;
    height: calc(100% - 66px);
    overflow-y: auto;
    &-block {
      padding-top: 5px;
      > div {
        margin-bottom: 5px;
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        .label {
          color: #5D616B;
        }
        .value {
          color: #8F959E;
        }
      }
    }
    .separator {
      height: 6px;
      width: 100%;
      background: #F6F6F6;
    }
  }
}
</style>