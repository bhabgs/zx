<template>
  <div class="swipe-container" :style="{height}"
      @mouseover="mouseover"
      @mouseout="mouseout">
    <ul ref="ul" class="img-box">
      <li
        :class="[item]"
        v-for="(item, index) in classes"
        :key="index"
        @click="handleClick(item,index)"
      >
        <img v-if="data.length>0" :src="data[index].picUrl" :onerror="errorImg"/>
      </li>
    </ul>
    <ul class="dots">
      <li
        v-for="(item, index) in data"
        :key="'dot' + index"
        :class="{ dotActive: index === activeIndex }"
        @mouseover="(e) => dotMouseover(e, index)"
      ></li>
    </ul>
  </div>
</template>
<script>
export default {
  props:{
    data:{
      type:Array,
      required:true
    },
    height:{
      type:String,
      default:'200px'
    },
    errorImg:String,
    intervalValue:{
      type:Number,
      default:4000
    }
  },
  watch:{
    intervalValue(newValue){
      clearInterval(this.interval)
      this.interval = setInterval(() => {
        this.next()
      }, newValue)
    },
    data(newValue){
      this.fillClasses()
    }
  },
  data() {
    return {
      classes: ['center', 'right', 'left'],
      activeIndex: 0,
      interval: null,
    }
  },
  mounted() {
    this.fillClasses()
    this.setInterval()
  },
  methods: {
    /**
     * @description 设置样式
     */
    fillClasses(){
      if(this.data.length>3){
        let num = this.data.length -3
        for(let i=0;i<num;i++){
         this.classes.splice(2,0,'after')
        }
      }
    },
    /**
     * @description 设置定时器
     */
    setInterval() {
      this.interval = setInterval(() => {
        this.next()
      }, this.intervalValue)
    },
    /**
     * @description 下一张
     */
    next() {
      let last = this.classes.pop()
      this.classes.unshift(last)
      this.activeIndex++
      if (this.activeIndex > this.data.length - 1) {
        this.activeIndex = 0
      }
    },
    /**
     * @description 前一张
     */
    pre() {
      let first = this.classes.shift()
      this.classes.push(first)
      this.activeIndex--
      if (this.activeIndex < 0) {
        this.activeIndex = this.data.length - 1
      }
    },
    /**
     * @description 点击主图
     */
    handleClick(item,index) {
      if (item === 'right') {
        this.next()
      } else if (item === 'left') {
        this.pre()
      }else{
        this.$emit('click-center',this.data[index])
      }
    },
    /**
     * @description 鼠标移入，停止轮播
     */
    mouseover() {
      clearInterval(this.interval)
    },
    /**
     * @description 鼠标移出，开始轮播
     */
    mouseout() {
      this.setInterval()
    },
    /**
     * @description 指示器
     */
    dotMouseover(e, index) {
      let offset = this.activeIndex - index
      for (let i = 0; i < Math.abs(offset); i++) {
        if (offset > 0) {
          this.pre()
        } else {
          this.next()
        }
      }
    },
  },
}
</script>
<style lang="scss" scoped>
.swipe-container {
  margin: 0px 10px;
  position: relative;
  user-select: none;
  overflow: hidden;
  ul{
    list-style: none;
  }
  .img-box {
    position: relative;
    transform-style: preserve-3d;
    width: 55%;
    height: 100%;
    margin: 0 auto;
    box-sizing: border-box;
    li {
      position: absolute;
      width: 100%;
      height: 100%;
      cursor: pointer;
      transition: all 0.5s ease;
      img {
        width: 100%;
        height: 100%;
      }
    }
    .left {
      // (1-55/2)/55
      left: -40.9%;
      transform: scale(0.8);
      transform-origin: 0% 50%;
      z-index: 4;
    }
    .center {
      z-index: 6;
      left: 0;
      top: 0;
      bottom: 10%;
    }
    .right {
      left: 40.9%;
      transform: scale(0.8);
      z-index: 4;
      transform-origin: 100% 50%;
    }
    .after {
      z-index: 3;
      left: 0;
      top: 0;
      visibility: hidden;
      transform: scale(0);
    }
  }
  .dots {
    position: absolute;
    bottom: 20px;
    z-index: 200;
    display: inline-flex;
    margin: 0;
    padding: 0;
    left:50%;
    transform: translateX(-50%);
    li {
      margin: 0 4px;
      z-index: 200;
      width: 8px;
      height: 8px;
      background: rgba(59, 124, 255, 1);
      opacity: 0.3;
      border-radius: 50%;
      cursor: pointer;
    }
    .dotActive {
      opacity: 1;
    }
  }
}
</style>
