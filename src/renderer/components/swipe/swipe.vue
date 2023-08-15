<template>
  <carousel
    :data="data"
    :height="height"
    :errorImg="errorImg"
    @click-center="handleClick"
    :interval-value="interval"
  ></carousel>
</template>
<script>
/**
 * @description 广告位轮播图组件
 */
import { mapGetters } from "vuex";
import Carousel from "./carousel";
import { PollingExtCorpInfo } from "../../plugin/polling-notice";
export default {
  name: "Swipe",
  components: {
    Carousel
  },
  mounted() {
    window.addEventListener("resize", this.changeHeight);
    this.changeHeight();
    PollingExtCorpInfo.startPulling();
    this.init();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.changeHeight);
    PollingExtCorpInfo.stopPulling();
  },
  data() {
    return {
      height: "200px",
      interval: 4000,
      defaultData: [
        {
          picUrl: require("@/assets/image/swipe/ad-one.png")
        },
        {
          picUrl: require("@/assets/image/swipe/ad-two.png")
        },
        {
          picUrl: require("@/assets/image/swipe/ad-three.png")
        }
      ],
      data: [],
      errorList: [],
      errorImg: 'this.src="' + require("@/assets/image/swipe/ad-two.png") + '"'
    };
  },
  computed: {
    ...mapGetters(["GetCompany"])
  },
  watch: {
    GetCompany(val, old) {
      if (old.corpId !== val.corpId) {
        this.init();
        PollingExtCorpInfo.startPulling();
      }
    },
    $route(route) {
      if (route.name === "Open") {
        this.init(false);
        PollingExtCorpInfo.startPulling();
      }
    }
  },
  methods: {
    /**
     * @description 初期化
     */
    async init(isSetDefault = true) {
      try {
        //先显示默认图
        if (isSetDefault) {
          this.data = this.defaultData;
          this.interval = 4000;
        }
        this.errorList = [];
        const { corpId } = this.GetCompany;
        // let res = await this.$service.getSwipeImage({corpId,adverSpace:"pczhixin_workbench_banner"})
        let res = await this.$service.getCorpExtInfo({ corpId });
        //轮播间隔
        res = res.adverByCorpRspDTO;
        if (res && res.intervalTime) {
          if (Number(res.intervalTime) >= 1000)
            this.interval = Number(res.intervalTime);
        }
        //轮播图片
        if (res && Array.isArray(res.corpAdvers)) {
          this.data = res.corpAdvers;
          const length = this.data.length;
          if (length < 3) {
            for (let i = 0; i < 3 - length; i++) {
              this.data.push(this.defaultData[i]);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    /**
     * @description 修改图片高度
     */
    changeHeight() {
      this.$nextTick(() => {
        let height = document.body.clientWidth;
        if (height >= 1920) {
          this.height = "400px";
        } else if (height >= 1200 && height < 1920) {
          this.height = "300px";
        } else {
          this.height = "180px";
        }
      });
    },
    /**
     * @description 点击图片跳转
     */
    handleClick(item) {
      if (item.jumpUrl) window.open(item.jumpUrl);
    }
    /**
     * @description 接口返回的图片不存在
     */
    // errorImage(e,index){
    //   this.errorList.push({
    //     index,
    //     e
    //   })
    //   this.errorList.sort((a,b)=>{
    //     return a.index-b.index
    //   })
    //   this.errorList.forEach((item,i)=>{
    //     this.setErrorImg(item.e,i)
    //   })
    // },
    /**
     * @description 设置补位图片
     */
    // setErrorImg(e,index){
    //   switch(index){
    //     case 0:
    //       e.target.src=require("@/assets/image/swipe/ad-one.png")
    //       break
    //     case 1:
    //       e.target.src=require("@/assets/image/swipe/ad-two.png")
    //       break
    //     case 2:
    //      e.target.src=require("@/assets/image/swipe/ad-three.png")
    //       break
    //     default:
    //       e.target.src=require("@/assets/image/swipe/ad-one.png")
    //       break
    //   }
    // }
  }
};
</script>
<style lang="scss">
.el-carousel__container {
  .el-carousel__item {
    img {
      width: 100%;
      height: 100%;
      user-select: none;
    }
    .el-carousel__mask {
      opacity: 0 !important;
    }
  }
}
.el-carousel__indicators {
  position: absolute !important;
  bottom: 0px !important;
  left: 50% !important;
  transform: translate(-50%, 0) !important;
  .el-carousel__button {
    width: 8px;
    height: 8px;
    background: rgba(59, 124, 255, 1);
    opacity: 0.3;
    border-radius: 50%;
  }
}
</style>
