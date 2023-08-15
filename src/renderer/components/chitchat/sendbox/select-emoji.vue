<template>
  <div id="select-emoji">
    <div class="emoji-content">
      <div v-show="Object.values(recentlyEmojiList).length > 0">
        <div class="biaoti"><span>最近使用</span></div>
        <ul class="recently-box" @click.stop="window.eventHub.$emit('native-click')">
          <li v-for="(row, k) in recentlyEmojiList" :key="k" v-show="!abandonedList.includes(row)">
            <more-emoji-mean
              :emojidata="row"
              :emojicode="k"
              :type="'recent'"
              @selectMeaning="selectMeaning"
              @rightSelected="rightSelected"
            >
              <template v-slot:moremeaning>
                <div class="emoji-box">
                  <div class="emoji-icon-box">
                    <img class="emoji-icon" :ref="`recent_${row}`" :src="path + row" :[codeKey]="k" />
                    <!-- 一个看不到的框 只为了触发表情提示语 可更改大小变动提示语距离表情的间距 -->
                    <el-tooltip effect="dark" :content="k.substring(1, k.length - 1)" placement="top" :visible-arrow="false" :open-delay="300" :enterable="false">
                      <div class="tooltip-show-box" @click="select($event, row, k)"></div>
                    </el-tooltip>
                  </div>
                  <!-- <span class="emoji-spot" v-if="haveMoreMeaning.includes(row)"></span> -->
                </div>
              </template>
            </more-emoji-mean>
          </li>
        </ul>
      </div>
      <div class="biaoti"><span>全部</span></div>
      <ul @click.stop="window.eventHub.$emit('native-click')">
        <li v-for="(row, k) in emojiList" :key="k" v-show="!abandonedList.includes(row)">
          <more-emoji-mean
            :emojidata="row"
            :emojicode="k"
            :type="'all'"
            @selectMeaning="selectMeaning"
            @rightSelected="rightSelected"
          >
            <template v-slot:moremeaning>
              <div class="emoji-box">
                <div class="emoji-icon-box">
                  <img class="emoji-icon" :ref="`all_${row}`" :src="path + row" :[codeKey]="k" />
                  <!-- 一个看不到的框 只为了触发表情提示语 可更改大小变动提示语距离表情的间距 -->
                  <el-tooltip effect="dark" :content="k.substring(1, k.length - 1)" placement="top" :visible-arrow="false" :open-delay="300" :enterable="false">
                    <div class="tooltip-show-box" @click="select($event, row, k)"></div>
                  </el-tooltip>
                </div>
                <!-- <span class="emoji-spot" v-if="haveMoreMeaning.includes(row)"></span> -->
              </div>
            </template>
          </more-emoji-mean>
        </li>
      </ul>
    </div>
  </div>
</template>
<script>
import { Emoji } from "@/WebIM";
import moreEmojiMean from "@/components/chitchat/sendbox/more-emoji-mean.vue";

export default {
  components: { moreEmojiMean },
  data() {
    return {
      codeKey: Emoji.getCodeKey(),
      list: { path: "", map: {}, abandonedList: [], haveMoreMeaning: [], moreMeaning: {}},
      showMoreMeaning: false
    };
  },
  created() {
    this.list = Emoji.getEmojiMap();
  },
  computed: {
    emojiList() {
      return this.list.map;
    },
    path() {
      return this.list.path;
    },
    abandonedList() {
      return this.list.abandonedList;
    },
    haveMoreMeaning() {
      return this.list.haveMoreMeaning;
    },
    recentlyEmojiList() {
      let list = JSON.parse(localStorage.getItem("recentlyEmoji")) || [];
      let obj = {};
      for (let item of list) {
        obj[item] = this.list.map[item];
      }
      return obj;
    }
  },
  methods: {
    /**
     * e: 默认事件
     * data：表情
     * key：表情编码
     * moredata：选择表情快捷含义的内容 {content：'', path: '', msg: ''}
     */
    select(e, data, key, moredata) {
      if (moredata) {
        this.$emit("selectEmoji", moredata);
      } else {
        let element = e.target;
        if (element.className.includes("tooltip-show-box")) {
          this.$emit("selectEmoji", {
            content: key,
            path: this.path + data
          });
        }
      }
      //更新本地最近使用表情
      let recentlyEmojiCode = JSON.parse(localStorage.getItem("recentlyEmoji")) || [];
      if (recentlyEmojiCode.length > 0) {
        let index = recentlyEmojiCode.findIndex(item => item == key);
        if (index != -1) {
          recentlyEmojiCode.splice(index, 1);
        }
      }
      recentlyEmojiCode.unshift(key);
      if (recentlyEmojiCode.length > 12) {
        recentlyEmojiCode.splice(recentlyEmojiCode.length - 1, 1);
      }
      localStorage.setItem("recentlyEmoji", JSON.stringify(recentlyEmojiCode));
      //关掉表情的快捷含义选项
      this.$root.$emit("closeMoreMeaning");
      // 阻止事件冒泡
      window.event ? (window.event.cancelBubble = true) : e.stopPropagation();
    },
    //选择表情快捷含义
    selectMeaning(key, data) {
      this.select('', '', key, data);
    },
    //右击打开表情快捷含义
    rightSelected(show, type, data) {
      let refname = type + '_' + data;
      let targetObj = this.$refs[refname];
      if (show) {
        targetObj[0].style.height = "34px";
        targetObj[0].style.width = "34px";
      } else {
        targetObj[0].style.height = "24px";
        targetObj[0].style.width = "24px";
      }
    }
  }
};
</script>

<style lang="scss">
#select-emoji {
  max-width: 430px;
  background-color: #fff;
  border-radius: 6px;
  box-shadow: 0 0 10px 0 rgba($color: #000000, $alpha: 0.12);
  border: 1px solid #eee;
  z-index: 100;
  -webkit-touch-callout:none; /*系统默认菜单被禁用*/
  -webkit-user-select:none; /*webkit浏览器*/
  -khtml-user-select:none; /*早期浏览器*/
  -moz-user-select:none;/*火狐*/
  -ms-user-select:none; /*IE10*/
  user-select:none; 
  -webkit-app-region: no-drag;
  .emoji-content {
    position: relative;
    padding-top: 5px;
    &::after {
      content: "";
      position: absolute;
      bottom: -7px;
      right: 18px;
      width: 11px;
      height: 11px;
      z-index: 99;
      transform: rotateZ(-90deg);
      background: url("~@/assets/image/tringleo.png") no-repeat;
    }
  }
  .biaoti {
    span {
      padding: 0 15px;
      text-decoration: none;
      color: #333;
      font-size: 12px;
    }
  }
  .recently-box {
    height: 42px;
  }
  ul {
    padding: 5px 10px 0;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    height: 230px;
    overflow: auto !important;
    .emoji-box {
      width: 34px;
      height: 37px;
      display: flex;
      flex-direction: column;
      .emoji-icon-box {
        width: 34px;
        height: 31px;
        // padding: 5px 5px 2px 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.1s;
        position: relative;
        &:hover {
          padding: 0;
          .emoji-icon {
            width: 34px !important;
            height: 34px !important;
          }
        }
        .emoji-icon {
          width: 28px;
          height: 28px;
          image-rendering: -webkit-optimize-contrast;
          transition: all 0.1s;
        }
        .tooltip-show-box {
          width: 28px;
          height: 26px;
          position: absolute;
          :focus {
            outline: 0 !important;
          }
        }
      }
      .emoji-spot {
        width: 4px;
        height: 4px;
        border-radius: 2px;
        background: #DDE0E3;
        margin: 0 15px 2px 15px;
      }
    }
    .el-popover__reference {
      &:focus {
        outline: 0 !important;
      }
    }
  }
  img {
    cursor: pointer;
    width: 34px;
  }
  .rong-emoji-content {
    cursor: pointer;
    margin: 2px;
  }
}
</style>
