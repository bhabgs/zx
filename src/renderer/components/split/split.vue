<template>
  <div class="split-pane-wrapper" ref="outer">
    <div class="pane pane-left" :style="{ width: leftOffsetPercent, paddingRight: `${this.triggerWidth / 2}px` }">
      <slot name="left"></slot>
    </div>
    <div class="pane-trigger-con" @mousedown="handleMousedown" :style="{ left: triggerLeft, width: `${triggerWidth}px` }"></div>
    <div class="pane pane-right" :style="{ left: leftOffsetPercent, paddingLeft: `${this.triggerWidth / 2}px` }">
      <slot name="right"></slot>
    </div>
    <div class="mask" v-if="mask"></div>
  </div>
</template>
<script>
export default {
  name: 'Split',
  props: {
    triggerWidth: {
      type: Number,
      default: 1
    },
    minLeftWidth: {
      type: Number,
      default: 260
    },
    minRightWidth: {
      type: Number,
      default: 300
    },
    max:{
      type:Number,
      default:0.5
    },
    //初始化值和最小值应该分开，需求让改所有，故默认值设置为300；若不改所有则默认值应取最小值
    initLeftWidth: {
      type: Number,
      default: 300
    },
    actionValue: {
      type:Number,
      default: 0
    },
    actionWidth: {
      type:Number,
      default: 365
    },
  },
  data () {
    return {
      canMove: false,
      initOffset: 0,
      //拖拽百分比
      precent:0,
      value:0.32,
      mask:false,
      leftWidth: 0,
      lastValue: 0.32 // 上次的值
    }
  },
  activated() {
    this.computedValue();
  },
  watch: {
    actionValue: {
      handler(val) {
        if (val) {
          this.lastValue = this.value;
          this.value = val;
          // 不可拖拽
        } else {
          this.value = this.lastValue;
        }
      },
      immediate: true
    }
  },
  computed: {
    leftOffsetPercent () {
      return `${this.value * 100}%`
    },
    triggerLeft () {
      return `calc(${this.value * 100}% - ${this.triggerWidth / 2}px)`
    }
  },
  mounted() {
    this.leftWidth=this.initLeftWidth || this.minLeftWidth
    window.addEventListener("resize", this.handleResize);
  },
  beforeDestroy(){
    window.removeEventListener("resize", this.handleResize);
  },
  methods: {
    handleMousedown (event) {
      if (this.actionValue) {
        return;
      }
      document.addEventListener('mousemove', this.handleMousemove)
      document.addEventListener('mouseup', this.handleMouseup,true)
      this.initOffset = event.pageX - event.srcElement.getBoundingClientRect().left
      this.canMove = true
      this.mask= true
    },
    handleMousemove (event) {
      if (!this.canMove) return
      const outerRect = this.$refs.outer.getBoundingClientRect()
      let offsetPercent = (event.pageX - this.initOffset + this.triggerWidth / 2 - outerRect.left) / outerRect.width
      let leftWidth = (event.pageX - this.initOffset + this.triggerWidth / 2 - outerRect.left)
      if(leftWidth<=this.minLeftWidth){
        offsetPercent = this.minLeftWidth / outerRect.width
      }
      if (offsetPercent > this.max) offsetPercent = this.max
      this.value = offsetPercent
      this.precent = this.computedPrecent(offsetPercent,outerRect.width)
    },
    handleMouseup () {
      this.canMove = false
      document.removeEventListener('mousemove', this.handleMousemove)
      document.removeEventListener('mouseup', this.handleMouseup)
      this.mask = false
    },
    handleResize(){
      this.computedValue()
    },
    computedPrecent(movePercent,width){
      let computedPrecent = 0;
      let minPrecent = this.minLeftWidth / width;
      let precent = this.max - minPrecent;
      let offsetPrecent = movePercent - minPrecent;
      if (precent > 0) {
        computedPrecent = offsetPrecent / precent;
      }
      return computedPrecent;
    },
    computedValue() {
      if (this.actionValue) {
        let clientWidth = document.body.clientWidth - 60;
        this.value = this.actionWidth / clientWidth;
        return;
      }
      this.$nextTick(() => {
        let width = document.body.clientWidth - 60;
        if (width && width > 0) {
          let minPrecent = this.minLeftWidth / width;
          let offset = this.leftWidth / width + (this.max - minPrecent) * this.precent;
          this.value = offset;
        }
      });
    }
  }
}
</script>
<style lang="scss">
.split-pane-wrapper{
  // height: 100%;
  flex: 1;
  width: 100%;
  position: relative;
  .pane{
    position: absolute;
    top: 0;
    height: 100%;
    &-left{
      overflow: auto;
    }
    &-right{
      right: 0;
      bottom: 0;
    }
    &-trigger-con{
      height: 100%;
      background: #d6d6d6;
      position: absolute;
      top: 0;
      z-index: 10;
      user-select: none;
      cursor: e-resize;
    }
  }
  .mask{
    height:100%;
    width:100%;
    position: absolute;
    z-index:5;
    background: transparent;
  }
}
</style>