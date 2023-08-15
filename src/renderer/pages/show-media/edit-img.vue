<template>
  <div v-show="editImage" class="show-media-body" id="show-media-body">
    <canvas id="imageEdit"></canvas>
  </div>
</template>

<script>
import { fabric } from 'fabric';
export default {
  props: {
    editImage: Boolean,
    src: String,
    editOptions: Object
  },
  data() {
    return {
      position: {
        x: 0,
        y: 0
      },
      canvas: null,
      canvasFabric: null,
      context: null,
      history: [],
      dragging: false
    }
  },
  watch: {
    editImage(newVal, oldVal) {
      if(newVal) {
        this.lastImage = this.src;
        this.initImg();
      }
    },
    editOptions: {
      handler(newVal, oldVal) {
        this.history.splice(0);
        this.addHistoy();
      },
      deep: true,
      immediate: true
    }
  },
  computed: {
    img() {
      const img = new Image();
      img.src = this.lastImage;
      return img;
    },
    lineWidth() {
      let result = 1;
      if(this.editOptions.size) {
        switch(this.editOptions.size) {
          case "small": result = 1; break;
          case "middle": result = 3; break;
          case "large": result = 5; break;
        }
      }
      return result;
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.canvas = document.getElementById("imageEdit");
      this.canvasFabric = new fabric.Canvas('imageEdit');
      if(this.canvas) {
        this.context = this.canvas.getContext("2d");
        this.canvasFabric.on("mouse:wheel", (e) => {
          const event = e.e;
          if(event) {
            var zoom = (event.deltaY > 0 ? -0.1 : 0.1) + this.canvasFabric.getZoom();
            zoom = Math.max(0.1, zoom); //最小为原来的1/10
            zoom = Math.min(3, zoom); //最大是原来的3倍
            var zoomPoint = new fabric.Point(event.pageX, event.pageY);
            this.canvasFabric.zoomToPoint(zoomPoint, zoom);
          }
        })
        this.canvasFabric.on("object:moving", (e) => {
            if(this.dragging) {
              return;
            }
        })
      }
    })
  },
  methods: {
    showLastHistory() {
      this.context.putImageData(this.history[this.history.length - 1]['data'], 0, 0);
    },
    addHistoy() {
      this.context && this.history.push({
            mode: this.editOptions.type,
            data: this.context.getImageData(0, 0, this.canvas.width, this.canvas.height)
        });
    },
    addEvent() {
      this.$nextTick(() => {
        if(this.canvas) {
          this.canvas.addEventListener("mousedown", (e) => {
            e.preventDefault();
            this.position.x = e.offsetX;
            this.position.y = e.offsetY;
            this.dragging = true;
          });
          this.canvas.addEventListener("mousemove", (e) => {
            e.preventDefault();
            if(this.dragging) {
              this.eventHandle(e);
            }
          });
          this.canvas.addEventListener("mouseup", (e) => {
            e.preventDefault();
            this.dragging = false;
            this.addHistoy();
          })
        }
      })
    },
    eventHandle(e) {
      switch(this.editOptions.type) {
        case "rect": this.drawRect(e);break;
        case "round": this.drawRound(e);break;
        case "arrow": this.drawArraw(e);break;
      }
    },
    initCanvas() {
      this.context.clearRect(0, 0, canvas.width, canvas.height);  // 清空canvas
      this.initImg();  // 将最近的图片展示到canvas中
    },
    /**
     * 画箭头
     */
    drawArraw(e) {
      this.showLastHistory();
      this.context.fillStyle = "transparent";
      this.context.strokeStyle = this.editOptions.color;
      this.context.lineWidth = this.lineWidth;
      this.context.fillStyle = this.editOptions.color;
      this.context.save();
      this.context.beginPath();
      const theta = 20; // 角度
      const handlen = 10; // 箭头长度
      let arrowX = 0;
      let arrowY = 0;
      const angle= Math.atan2(this.position.y - e.offsetY, this.position.x - e.offsetX) * 180 / Math.PI; // 末位置和起始位置的偏移角度
      const angle1 = (angle + theta) * Math.PI / 180; // 箭头偏移角度
      const angle2 = (angle - theta) * Math.PI / 180; // 箭头偏移角度
      const topX = handlen * Math.cos(angle1); // 箭头长度*正弦值是箭头上半部分相对于终点x轴偏移量
      const topY = handlen * Math.sin(angle1); // 箭头长度*余弦值是箭头上半部分相对于终点y轴偏移量
      const botX = handlen * Math.cos(angle2); // 箭头长度*正弦值是箭头下半部分相对于终点x轴偏移量
      const botY = handlen * Math.sin(angle2); // 箭头长度*余弦值是箭头下半部分相对于终点y轴偏移量
      if(this.position.y === e.offsetY && this.position.x === e.offsetX) {
        return;
      } else {
        this.context.moveTo(this.position.x - topX, this.position.y - topY); // 把画布移动到上面箭头末端
        this.context.moveTo(this.position.x, this.position.y);
        this.context.lineTo(e.offsetX, e.offsetY); // 从箭头末端到鼠标终点画线
        // 画箭头两端连起来的线
        arrowX = e.offsetX + topX;
        arrowY = e.offsetY + topY;
        this.context.moveTo(arrowX, arrowY);
        this.context.lineTo(e.offsetX, e.offsetY); 
        arrowX = e.offsetX + botX;
        arrowY = e.offsetY + botY;
        // 将画布移动至下面箭头的末端
        this.context.lineTo(arrowX, arrowY);
        this.context.closePath();
        this.context.fill();
        this.context.stroke();
        this.context.restore();
      }
    },
    /**
     * 画椭圆
     */
    drawRound(e) {
      this.showLastHistory();
      this.context.fillStyle = "transparent";
      this.context.strokeStyle = this.editOptions.color;
      this.context.lineWidth = this.lineWidth;
      this.context.save();
      this.context.beginPath();
      const x = (e.offsetX + this.position.x) / 2; // 圆心X
      const y = (e.offsetY + this.position.y) / 2; // 圆心Y
      const radiusX = Math.abs(e.offsetX - this.position.x) / 2; // 半径X长
      const radiusY = Math.abs(e.offsetY - this.position.y) / 2; // 半径y长
      const radius = (radiusX > radiusY) ? radiusX : radiusY; // 半径
      const roundX = radiusX / radius; //横轴缩放比率
      const roundY = radiusY / radius; //纵轴缩放比率
      this.context.scale(roundX,roundY); //进行缩放（均匀压缩）
      this.context.moveTo((x + radiusX)/ roundX, y / roundY);//从椭圆的左端点开始绘制
      this.context.arc(x / roundX, y / roundY, radius , 0, 2 * Math.PI, false);
      this.context.closePath();
      this.context.restore();
      this.context.stroke();
    },
    /**
     * 画矩形
     */
    drawRect(e) {
      this.showLastHistory();
      this.context.fillStyle = "transparent";
      this.context.strokeStyle = this.editOptions.color;
      this.context.lineWidth = this.lineWidth;
      this.context.save();
      this.context.beginPath();
      this.context.strokeRect(this.position.x, this.position.y, e.offsetX - this.position.x, e.offsetY - this.position.y);
      this.context.restore();
    },
    getPixelRatio(context) {
      const backingStore = context.backingStorePixelRatio ||
          context.webkitBackingStorePixelRatio ||
          context.mozBackingStorePixelRatio ||
          context.msBackingStorePixelRatio ||
          context.oBackingStorePixelRatio ||
          context.backingStorePixelRatio || 1;
      return (window.devicePixelRatio || 1) / backingStore;
    },
    initImg() {
      this.$nextTick(() => {
        const container = document.getElementById("show-media-body");
        const maxW = container.clientWidth;
        const maxH = container.clientHeight;
        const ratio = this.getPixelRatio(this.context);
        const width = maxW * ratio;
        const height = maxH * ratio;
        this.canvasFabric.setWidth(width);
        this.canvasFabric.setHeight(height);
        fabric.Image.fromURL(this.lastImage, (oImag) => {
          const wScale = oImag.width / maxW;
          const hScale = oImag.height / maxH;
          const scale = wScale > hScale ? wScale : hScale;
          oImag.scale(1/scale);
          const imgW = Math.floor(oImag.width / scale) * ratio;
          const imgH = Math.floor(oImag.height / scale) * ratio;
          oImag.set({
            hasControls: false,
            left: (maxW - imgW) / 2,
            top: (maxH - imgH) / 2
          })
          this.canvasFabric.add(oImag);
          this.$nextTick(() => {
            this.canvas = document.getElementsByClassName("upper-canvas ")[0];
            if(this.canvas) {
              this.context = this.canvas.getContext("2d");
              this.addEvent();
            }
          })
        })
      })
    }
    // initImg() {
    //   this.$nextTick(() => {
    //     const canvas_rect = this.canvas.getBoundingClientRect();
    //     if(this.img.src) {
    //       const maxW = canvas_rect.width;
    //       const maxH = canvas_rect.height;
    //       const wScale = this.img.width / maxW;
    //       const hScale = this.img.height / maxH;
    //       const scale = wScale > hScale ? wScale : hScale;
    //       const ratio = this.getPixelRatio(this.context );
    //       this.canvas.width = maxW * ratio;
    //       this.canvas.height = maxH * ratio;
    //       const imgW = Math.floor(this.img.width / scale) * ratio;
    //       const imgH = Math.floor(this.img.height / scale) * ratio;
    //       setTimeout(() =>{
    //         this.context.drawImage(this.img, (this.canvas.width - imgW ) / 2, (this.canvas.height * ratio - imgH ) / 2, imgW, imgH);
    //         this.addHistoy();
    //       })
    //     }
    //   })
    // }
  }
}
</script>

<style>

</style>