<template>
  <p class="user-detail-info-item">
    <span class="info-key">{{ infoItem.key }}</span>
    <span
      class="info-value"
      v-if="isShow && infoItem.type != 'tag'"
      v-text="infoItem.value"
    >
    </span>
    <span
      class="info-value"
      v-else-if="isShow && infoItem.type == 'tag'"
      :id="infoItem.type == 'tag' ? 'tagValue' : ''"
    >
      <span
        class="tag-item"
        v-show="infoItem.value && infoItem.value.length"
        v-for="tag in showTagList"
        :key="tag.id"
        :style="{ color: tag.color, borderColor: tag.color }"
      >
        {{ tag.tagName }}
      </span>
      <span
        v-show="showTag.result.length < showTag.all.length"
        @click="expandTagHandle"
        class="show-all-tag"
        >{{ showAlltag ? "收起" : "展开" }}全部
        <img
          :class="showAlltag ? '' : 'expand'"
          src="@/assets/image/contacts/expand_tag.png"
          alt=""
      /></span>

      <span v-show="!infoItem.value || !infoItem.value.length">暂无</span>
    </span>
    <span class="info-value info-hide" v-else>{{ hideMeaasge }}</span>
  </p>
</template>

<script>
export default {
  name: "InfoItem",
  props: ["show", "info"],
  computed: {
    isShow() {
      return this.show;
    },
    infoItem() {
      return this.info;
    },
    showTag() {
      const tagList = this.infoItem.value;
      let result = 0;
      let lineOneLength = 0; // 第一行长度
      let lineOne = true; // 是否还在第一行
      let lineTwoLength = 0; // 第二行的长度
      let lineTwo = true; // 是否还继续第二行累加
      for (const tag of tagList) {
        const name = tag.tagName.length;
        if (lineOne) {
          lineOneLength += name * 10 + 16 + 8;
        }
        if (lineOneLength < 250) {
          // 长度小于时+1
          result += 1;
        } else {
          // 第一行折行
          lineOne = false;
          if (lineTwo) {
            lineTwoLength += name * 10 + 16 + 8;
          }
          if (lineTwoLength < 240) {
            result += 1;
          } else {
            lineTwo = false;
          }
        }
      }
      if (result < tagList.length) {
        //第二行最后一个加的长度
        const lastAddTagLength = tagList[result].tagName.length * 10 + 16 + 8;
        if (lineTwoLength - lastAddTagLength + 50 > 240) {
          result -= 1;
        }
      }

      return {
        result: this.infoItem.value.slice(0, result),
        all: this.infoItem.value
      };
    },
    showTagList() {
      let result = [];
      if (
        this.showAlltag ||
        this.showTag.result.length == this.showTag.all.length
      ) {
        result = [...this.showTag.all];
      } else {
        result = [...this.showTag.result];
      }
      return result;
    }
  },
  data() {
    return {
      hideMeaasge: "已保密",
      showAlltag: false
    };
  },
  methods: {
    expandTagHandle() {
      this.showAlltag = !this.showAlltag;
    }
  }
};
</script>

<style lang="scss">
.user-detail-info-item {
  margin-bottom: 16px;
  display: flex;
  line-height: 1;
  .info-key {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 300;
    color: #999;
    line-height: 18px;
  }
  .info-value {
    margin-left: 5px;
    font-size: 12px;
    font-weight: 400;
    color: #000;
    line-height: 18px;
    display: flex;
    flex-wrap: wrap;
    .tag-item {
      height: 16px;
      border-radius: 8px;
      display: -ms-flexbox;
      display: flex;
      -ms-flex-align: center;
      align-items: center;
      font-size: 10px;
      margin-right: 8px;
      padding: 0 8px;
      box-sizing: border-box;
      border: 1px solid rgba(60, 186, 255, 0.2);
      white-space: nowrap;
      margin-bottom: 8px;
    }
    .show-all-tag {
      display: flex;
      align-items: center;
      color: #3e7eff;
      font-size: 10px;
      cursor: pointer;
      margin-bottom: 8px;
      img {
        width: 8px;
        height: 8px;
        margin-left: 4px;
        transform: rotate(180deg);
        &.expand {
          transform: rotate(0deg);
        }
      }
    }
  }
  .info-hide {
    font-weight: 400;
    color: rgba(153, 153, 153, 1);
  }
}
</style>
