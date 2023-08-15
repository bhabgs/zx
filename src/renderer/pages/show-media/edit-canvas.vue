<template>
  <div id="show-media-body" class="show-media-body">
    <canvas id="imageEdit" :width="width" :height="height"></canvas>
    <img id="img" :src="lastImage" />
  </div>
</template>

<script>
const { clipboard, nativeImage } = require("electron");
import { fabric } from "fabric";
export default {
  props: {
    editImage: Boolean,
    src: String,
    editOptions: Object
  },
  data() {
    return {
      lastImage: "",
      width: 0,
      height: 0,
      rect: [],
      canvas: {},
      showMenu: false,
      x: "",
      y: "",

      mouseFrom: {},
      mouseTo: {},
      drawType: null, //当前绘制图像的种类
      canvasObjectIndex: 0,
      textbox: null,
      rectangleLabel: "warning",
      drawWidth: 2, //笔触宽度
      drawSize: 32, // 文字大小
      color: "#E34F51", //画笔颜色
      drawingObject: null, //当前绘制对象
      moveCount: 1, //绘制移动计数器
      doDrawing: false, // 绘制状态

      //polygon 相关参数
      polygonMode: false,
      pointArray: [],
      lineArray: [],
      activeShape: false,
      activeLine: "",
      line: {},

      delectKlass: {},
      imgFile: {},
      imgSrc: "",
      isDragging: false, // 是否正在拖动
      lastPosX: 0, // 移动y
      lastPosY: 0, // 移动y
      imageW: 0, // 原图宽
      imageH: 0, // 原图高
      zoomCenterPosition: {
        x: 0,
        y: 0
      }
    };
  },
  watch: {
    editImage(newVal, oldVal) {
      if (this.textbox) {
        // 改变编辑状态时清空文字编辑状态
        this.textbox.exitEditing();
        this.canvas && this.canvas.remove(this.textbox);
      }
      if (newVal) {
        this.canvas.clear();
        this.canvas.remove(this.canvas.getActiveObject());
        this.lastImage = this.src;
        this.initImg();
      }
    },
    drawType() {
      this.canvas.selection = !this.drawType;
    },
    canvasHasChange(newVal) {
      this.$emit("canvasChange", newVal);
    },
    editOptions: {
      handler(newVal, oldVal) {
        // 参数发生变化
        this.color = newVal.color;
        if (this.textbox && oldVal === "text") {
          // 选择其他时清除文字输入状态
          this.textbox.exitEditing();
        }
        this.canvas.isDrawingMode = false;
        if (newVal.type === "text") {
          switch (newVal.size) {
            case "small":
              this.drawSize = 14;
              break;
            case "middle":
              this.drawSize = 18;
              break;
            case "large":
              this.drawSize = 32;
              break;
          }
        } else {
          switch (newVal.size) {
            case "small":
              this.drawWidth = 1;
              break;
            case "middle":
              this.drawWidth = 3;
              break;
            case "large":
              this.drawWidth = 6;
              break;
          }
        }
        this.drawTypeChange(newVal);
      },
      deep: true,
      immediate: true
    }
  },
  mounted() {
    this.init();
    window.addEventListener("resize", this.resizeHandle);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resizeHandle);
  },
  computed: {
    // 判断撤销是否置灰
    canvasHasChange() {
      let result = false;
      if (this.canvas && this.canvas.getObjects) {
        result = this.canvas.getObjects().length >= 1;
      }
      return result;
    }
  },
  methods: {
    init() {
      this.$nextTick(() => {
        this.lastImage = this.src;
        const canvas = document.getElementById("imageEdit");
        this.context = canvas.getContext("2d");
        this.canvas = new fabric.Canvas("imageEdit", {
          skipTargetFind: false //当为真时，跳过目标检测。目标检测将返回始终未定义。点击选择将无效
          // selectable: false,  //为false时，不能选择对象进行修改
          // selection: false   // 是否可以多个对象为一组
        });
        this.canvas.selectionColor = "rgba(0,0,0,0.05)";
        this.canvas.on("mouse:down", this.mousedown);
        this.canvas.on("mouse:move", this.mousemove);
        this.canvas.on("mouse:up", this.mouseup);
        this.canvas.on("object:selected", this.selectHandle);
        this.initImg();

        document.onkeydown = e => {
          // 键盘 delect删除所选元素
          if (e.keyCode == 46) {
            this.deleteObj();
          }
          // ctrl+z 删除最近添加的元素
          if (e.keyCode == 90 && e.ctrlKey) {
            this.canvas.remove(
              this.canvas.getObjects()[this.canvas.getObjects().length - 1]
            );
          }
        };
        this.canvas.on("mouse:wheel", this.mouseWheel);
      });
    },
    resizeHandle() {
      const container = document.getElementById("show-media-body");
      const maxW = container.clientWidth;
      const maxH = container.clientHeight;
      this.canvas.setWidth(maxW);
      this.canvas.setHeight(maxH);
      this.width = maxW;
      this.height = maxH;
      let zoom = this.canvas.getZoom();
      const imgW = this.imageW * zoom;
      const imgH = this.imageH * zoom;
      this.initViewportTransform(zoom, maxW, maxH, imgW, imgH);
    },
    getPixelRatio(context) {
      const backingStore =
        context.backingStorePixelRatio ||
        context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio ||
        1;
      return (window.devicePixelRatio || 1) / backingStore;
    },
    selectHandle(object) {},
    initImg() {
      this.$nextTick(() => {
        const container = document.getElementById("show-media-body");
        const maxW = container.clientWidth;
        const maxH = container.clientHeight;
        // const ratio = this.getPixelRatio(this.context);
        const ratio = 1;
        let imgW = 0;
        let imgH = 0;
        let scale = 1;
        const oImag = new Image();

        oImag.onload = () => {
          this.imageW = oImag.width;
          this.imageH = oImag.height;
          if (oImag.width > maxW && oImag.height > maxH) {
            const wScale = oImag.width / maxW;
            const hScale = oImag.height / maxH;
            scale = wScale > hScale ? wScale : hScale;
          }
          imgW = Math.floor(oImag.width / scale) * ratio;
          imgH = Math.floor(oImag.height / scale) * ratio;
          this.width = maxW;
          this.height = maxH;
          this.canvas.setWidth(maxW);
          this.canvas.setHeight(maxH);
          const imgInstance = fabric.Image.fromURL(this.lastImage, oImag => {
            this.canvas.setBackgroundImage(
              oImag,
              this.canvas.renderAll.bind(this.canvas)
            );
            this.canvas.renderAll();
          });
          setTimeout(() => {
            let zoom = 1 / scale;
            this.initViewportTransform(zoom, maxW, maxH, imgW, imgH);
          }, 100);
        }
        oImag.src = this.lastImage;
      });
    },
    initViewportTransform(zoom, maxW, maxH, imgW, imgH) {
      const vpt = this.canvas.viewportTransform;
      vpt[4] = (maxW - imgW) / 2;
      vpt[5] = (maxH - imgH) / 2;
      const zoomPoint = new fabric.Point(vpt[4], vpt[5]);
      this.canvas.zoomToPoint(zoomPoint, zoom);
      this.zoomCenterPosition.x = vpt[4];
      this.zoomCenterPosition.y = vpt[5];
    },
    // 开始绘制时，指定绘画种类
    drawTypeChange(option) {
      this.drawType = option.type;
      if (option.type === "save") {
        this.save();
      } else if (option.type === "send") {
        this.send();
      } else if (option.type === "quit") {
        this.quit();
      }
      if (option.type === "trans") {
        this.trans();
      } else if (option.type === "download") {
        this.download();
      } else if (option.type === "back") {
        if (this.canvas && this.canvas.getObjects().length >= 1) {
          // 撤销操作
          this.canvas.remove(
            this.canvas.getObjects()[this.canvas.getObjects().length - 1]
          );
          this.canvas.renderAll();
        }
      } else {
        this.canvas.skipTargetFind = !!this.drawType;
        if (this.drawType == "pen") {
          // isDrawingMode为true 才可以自由绘画
          this.canvas.isDrawingMode = true;
          this.canvas.freeDrawingBrush.color = this.color;
          this.canvas.freeDrawingBrush.width =
            this.drawWidth / this.canvas.getZoom();
        } else {
          this.canvas.isDrawingMode = false;
        }
      }
    },
    mouseWheel(opt) {
      if (this.textbox) {
        this.textbox.exitEditing();
      }
      const delta = opt.e.deltaY;
      let zoom = this.canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 5) zoom = 5;
      if (zoom < 0.1) zoom = 0.1;
      const vpt = this.canvas.viewportTransform;
      vpt[4] = (this.width - this.width * zoom) / 2;
      vpt[5] = (this.height - this.height * zoom) / 2;
      this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
      this.checkViewPort(zoom);
    },
    /**
     * 检测图片移动
     */
    checkViewPort(zoom) {
      const vpt = this.canvas.viewportTransform;
      if (zoom < this.width / this.imageW || zoom < this.height / this.imageH) {
        vpt[4] = this.width / 2 - (this.imageW * zoom) / 2;
        vpt[5] = this.height / 2 - (this.imageH * zoom) / 2;
      } else {
        if (vpt[4] >= 0) {
          vpt[4] = 0;
        } else if (vpt[4] < this.canvas.getWidth() - this.imageW * zoom) {
          vpt[4] = this.canvas.getWidth() - this.imageW * zoom;
        }
        if (vpt[5] >= 0) {
          vpt[5] = 0;
        } else if (vpt[5] < this.canvas.getHeight() - this.imageH * zoom) {
          vpt[5] = this.canvas.getHeight() - this.imageH * zoom;
        }
      }
      this.zoomCenterPosition.x = vpt[4];
      this.zoomCenterPosition.y = vpt[5];
    },
    /**
     * 获取图片边缘位置
     */
    getBorder() {
      const realWidth = this.imageW * this.canvas.getZoom();
      const realHeight = this.imageH * this.canvas.getZoom();
      const crossing = (this.width - realWidth) / 2; //横向
      const vertical = (this.height - realHeight) / 2; //垂直
      return {
        left: crossing,
        right: crossing + realWidth,
        top: vertical,
        bottom: vertical + realHeight
      };
    },
    /**
     * 获取真正图标
     */
    getRealPoint(value, type) {
      const vpt = this.canvas.viewportTransform;
      const position = this.getBorder();
      const realWidth = this.imageW * this.canvas.getZoom();
      const realHeight = this.imageH * this.canvas.getZoom();
      const x = vpt[4] - this.zoomCenterPosition.x; //画布水平移动距离
      const y = vpt[5] - this.zoomCenterPosition.y; //画布垂直移动距离
      if (type === 1) {
        // x
        return ((value - position.left - x) / realWidth) * this.imageW;
      } else {
        // y
        return ((value - position.top - y) / realHeight) * this.imageH;
      }
    },
    // 鼠标按下时触发
    mousedown(e) {
      // 记录鼠标按下时的坐标
      var xy = e.pointer || this.transformMouse(e.e.offsetX, e.e.offsetY);
      if (e.e.altKey === true) {
        // 点Alt+鼠标移动为移动画布
        this.isDragging = true;
        this.canvas.selection = false;
        this.lastPosX = e.e.clientX;
        this.lastPosY = e.e.clientY;
      } else {
        this.doDrawing = true;
      }
      const mouseFrom = xy;
      const position = this.getBorder();
      if (
        mouseFrom.x < position.left ||
        mouseFrom.x > position.right ||
        mouseFrom.y < position.top ||
        mouseFrom.y > position.bottom
      ) {
        console.log("不在画布范围内");
        this.doDrawing = false;
        // 此时起点不在画布范围内
        return;
      }
      this.mouseFrom.x = this.getRealPoint(mouseFrom.x, 1);
      this.mouseFrom.y = this.getRealPoint(mouseFrom.y, 2);
      if (this.drawType == "text") {
        this.drawing();
      }

      if (this.textbox) {
        this.textbox.enterEditing();
        this.textbox.hiddenTextarea.focus();
      }
      // 绘制多边形
      if (this.drawType == "polygon") {
        this.canvas.skipTargetFind = false;
        try {
          // 此段为判断是否闭合多边形，点击红点时闭合多边形
          if (this.pointArray.length > 1) {
            // e.target.id == this.pointArray[0].id 表示点击了初始红点
            if (e.target && e.target.id == this.pointArray[0].id) {
              this.generatePolygon();
            }
          }
          //未点击红点则继续作画
          if (this.polygonMode) {
            this.addPoint(e);
          }
        } catch (error) {
          console.log(error);
        }
      }
    },
    // 鼠标松开执行
    mouseup(e) {
      if (this.isDragging) {
        this.canvas.setViewportTransform(this.canvas.viewportTransform);
        this.isDragging = false;
        this.canvas.selection = true;
      } else {
        var xy = e.pointer || this.transformMouse(e.e.offsetX, e.e.offsetY);
        const position = this.getBorder();
        this.mouseTo.x = xy.x;
        this.mouseTo.y = xy.y;
        if (this.mouseTo.x < position.left) {
          this.mouseTo.x = position.left;
        } else if (this.mouseTo.x > position.right) {
          this.mouseTo.x = position.right;
        }
        if (this.mouseTo.y < position.top) {
          this.mouseTo.y = position.top;
        } else if (this.mouseTo.x > position.bottom) {
          this.mouseTo.y = position.bottom;
        }
        this.drawingObject = null;
        this.moveCount = 1;
        if (this.drawType != "polygon") {
          this.doDrawing = false;
        }
      }
    },

    //鼠标移动过程中已经完成了绘制
    mousemove(e) {
      if (this.isDragging) {
        // alt+鼠标平移画布
        const opt = e.e;
        var vpt = this.canvas.viewportTransform;
        let zoom = this.canvas.getZoom();
        if (zoom < this.width / this.imageW) {
          vpt[4] = this.width / 2 - (this.imageW * zoom) / 2;
        } else {
          vpt[4] += opt.clientX - this.lastPosX;
          if (vpt[4] >= 0) {
            vpt[4] = 0;
          } else if (vpt[4] < this.canvas.getWidth() - this.imageW * zoom) {
            vpt[4] = this.canvas.getWidth() - this.imageW * zoom;
          }
        }
        if (zoom < this.height / this.imageH) {
          vpt[5] = this.height / 2 - (this.imageH * zoom) / 2;
        } else {
          vpt[5] += opt.clientY - this.lastPosY;
          if (vpt[5] >= 0) {
            vpt[5] = 0;
          } else if (vpt[5] < this.canvas.getHeight() - this.imageH * zoom) {
            vpt[5] = this.canvas.getHeight() - this.imageH * zoom;
          }
        }
        this.canvas.requestRenderAll();
        this.lastPosX = opt.clientX;
        this.lastPosY = opt.clientY;
      } else {
        if (this.moveCount % 2 && !this.doDrawing) {
          //减少绘制频率
          return;
        }
        this.moveCount++;
        var xy = e.pointer || this.transformMouse(e.e.offsetX, e.e.offsetY);
        const mouseTo = xy;
        const position = this.getBorder();
        if (this.drawType == "pen") {
          if (
            mouseTo.x < position.left + this.drawWidth ||
            mouseTo.x > position.right - this.drawWidth ||
            mouseTo.y < position.top + this.drawWidth ||
            mouseTo.y > position.bottom - this.drawWidth
          ) {
            // 画笔边缘检测
            this.canvas.isDrawingMode = false;
          } else {
            this.canvas.isDrawingMode = true;
          }
        }
        if (mouseTo.x < position.left) {
          mouseTo.x = position.left;
        } else if (mouseTo.x > position.right) {
          mouseTo.x = position.right;
        }
        if (mouseTo.y < position.top) {
          mouseTo.y = position.top;
        } else if (mouseTo.y > position.bottom) {
          mouseTo.y = position.bottom;
        }
        this.mouseTo.x = this.getRealPoint(mouseTo.x, 1);
        this.mouseTo.y = this.getRealPoint(mouseTo.y, 2);
        // 多边形与文字框特殊处理
        if (this.drawType != "text" || this.drawType != "polygon") {
          this.drawing(e);
        }
        if (this.drawType == "polygon") {
          if (this.activeLine && this.activeLine.class == "line") {
            var pointer = this.canvas.getPointer(e.e);
            this.activeLine.set({ x2: pointer.x, y2: pointer.y });

            var points = this.activeShape.get("points");
            points[this.pointArray.length] = {
              x: pointer.x,
              y: pointer.y,
              zIndex: 1
            };
            this.activeShape.set({
              points: points
            });
            this.canvas.renderAll();
          }
          this.canvas.renderAll();
        }
      }
    },
    deleteObj() {
      this.canvas.getActiveObjects().map(item => {
        this.canvas.remove(item);
      });
    },
    transformMouse(mouseX, mouseY) {
      return { x: mouseX / 1, y: mouseY / 1 };
    },
    // 绘制多边形开始，绘制多边形和其他图形不一样，需要单独处理
    drawPolygon() {
      this.drawType = "polygon";
      this.polygonMode = true;
      //这里画的多边形，由顶点与线组成
      this.pointArray = new Array(); // 顶点集合
      this.lineArray = new Array(); //线集合
      this.canvas.isDrawingMode = false;
    },
    addPoint(e) {
      var random = Math.floor(Math.random() * 10000);
      var id = new Date().getTime() + random;
      var circle = new fabric.Circle({
        radius: 5,
        fill: "#ffffff",
        stroke: "#333333",
        strokeWidth: 0.5,
        left: (e.pointer.x || e.e.layerX) / this.canvas.getZoom(),
        top: (e.pointer.y || e.e.layerY) / this.canvas.getZoom(),
        selectable: false,
        hasBorders: false,
        hasControls: false,
        originX: "center",
        originY: "center",
        id: id,
        objectCaching: false
      });
      if (this.pointArray.length == 0) {
        circle.set({
          fill: "red"
        });
      }
      var points = [
        (e.pointer.x || e.e.layerX) / this.canvas.getZoom(),
        (e.pointer.y || e.e.layerY) / this.canvas.getZoom(),
        (e.pointer.x || e.e.layerX) / this.canvas.getZoom(),
        (e.pointer.y || e.e.layerY) / this.canvas.getZoom()
      ];

      this.line = new fabric.Line(points, {
        strokeWidth: 2,
        fill: "#999999",
        stroke: "#999999",
        class: "line",
        originX: "center",
        originY: "center",
        selectable: false,
        hasBorders: false,
        hasControls: false,
        evented: false,

        objectCaching: false
      });
      if (this.activeShape) {
        var pos = this.canvas.getPointer(e.e);
        var points = this.activeShape.get("points");
        points.push({
          x: pos.x,
          y: pos.y
        });
        var polygon = new fabric.Polygon(points, {
          stroke: "#333333",
          strokeWidth: 1,
          fill: "#cccccc",
          opacity: 0.3,

          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false,
          objectCaching: false
        });
        this.canvas.remove(this.activeShape);
        this.canvas.add(polygon);
        this.activeShape = polygon;
        this.canvas.renderAll();
      } else {
        var polyPoint = [
          {
            x: (e.pointer.x || e.e.layerX) / this.canvas.getZoom(),
            y: (e.pointer.y || e.e.layerY) / this.canvas.getZoom()
          }
        ];
        var polygon = new fabric.Polygon(polyPoint, {
          stroke: "#333333",
          strokeWidth: 1,
          fill: "#cccccc",
          opacity: 0.3,

          selectable: false,
          hasBorders: false,
          hasControls: false,
          evented: false,
          objectCaching: false
        });
        this.activeShape = polygon;
        this.canvas.add(polygon);
      }
      this.activeLine = this.line;

      this.pointArray.push(circle);
      this.lineArray.push(this.line);
      this.canvas.add(this.line);
      this.canvas.add(circle);
    },
    generatePolygon() {
      var points = new Array();
      this.pointArray.map((point, index) => {
        points.push({
          x: point.left,
          y: point.top
        });
        this.canvas.remove(point);
      });
      this.lineArray.map((line, index) => {
        this.canvas.remove(line);
      });
      this.canvas.remove(this.activeShape).remove(this.activeLine);
      var polygon = new fabric.Polygon(points, {
        stroke: this.color,
        strokeWidth: this.drawWidth / this.canvas.getZoom(),
        fill: "rgba(255, 255, 255, 0)",
        opacity: 1,
        hasBorders: true,
        hasControls: false
      });
      this.canvas.add(polygon);

      this.activeLine = null;
      this.activeShape = null;
      this.polygonMode = false;
      this.doDrawing = false;
      this.drawType = null;
    },
    drawing(e) {
      if (this.drawingObject) {
        this.canvas.remove(this.drawingObject);
      }
      const position = this.getBorder();
      var canvasObject = null;
      var left = this.mouseFrom.x,
        top = this.mouseFrom.y,
        mouseFrom = this.mouseFrom,
        mouseTo = this.mouseTo;
      switch (this.drawType) {
        case "arrow": //箭头
          var x1 = mouseFrom.x,
            x2 = mouseTo.x,
            y1 = mouseFrom.y,
            y2 = mouseTo.y;
          var w = x2 - x1,
            h = y2 - y1,
            sh = Math.cos(Math.PI / 4) * 16;
          var sin = h / Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
          var cos = w / Math.sqrt(Math.pow(w, 2) + Math.pow(h, 2));
          var w1 = (16 * sin) / 4,
            h1 = (16 * cos) / 4,
            centerx = sh * cos,
            centery = sh * sin;
          /**
           * centerx,centery 表示起始点，终点连线与箭头尖端等边三角形交点相对x，y
           * w1 ，h1用于确定四个点
           */

          var path = " M " + x1 + " " + y1;
          path += " L " + (x2 - centerx + w1) + " " + (y2 - centery - h1);
          path +=
            " L " + (x2 - centerx + w1 * 2) + " " + (y2 - centery - h1 * 2);
          path += " L " + x2 + " " + y2;
          path +=
            " L " + (x2 - centerx - w1 * 2) + " " + (y2 - centery + h1 * 2);
          path += " L " + (x2 - centerx - w1) + " " + (y2 - centery + h1);
          path += " Z";
          canvasObject = new fabric.Path(path, {
            stroke: this.color,
            fill: this.color,
            strokeWidth: this.drawWidth / this.canvas.getZoom()
          });
          break;
        case "pentagram": //五角星
          var x1 = mouseFrom.x,
            x2 = mouseTo.x,
            y1 = mouseFrom.y,
            y2 = mouseTo.y;
          /**
           * 实现思路  (x1,y1)表示鼠标起始的位置 (x2,y2)表示鼠标抬起的位置
           * r 表示五边形外圈圆的半径，这里建议自己画个图理解
           * 正五边形夹角为36度。计算出cos18°，sin18°备用
           */
          var w = Math.abs(x2 - x1),
            h = Math.abs(y2 - y1),
            r = Math.sqrt(w * w + h * h);
          var cos18 = Math.cos((18 * Math.PI) / 180);
          var sin18 = Math.sin((18 * Math.PI) / 180);

          /**
           * 算出对应五个点的坐标转化为路径
           */
          var point1 = [x1, y1 + r];
          var point2 = [x1 + 2 * r * sin18, y1 + r - 2 * r * cos18];
          var point3 = [x1 - r * cos18, y1 + r * sin18];
          var point4 = [x1 + r * cos18, y1 + r * sin18];
          var point5 = [x1 - 2 * r * sin18, y1 + r - 2 * r * cos18];

          var path = " M " + point1[0] + " " + point1[1];
          path += " L " + point2[0] + " " + point2[1];
          path += " L " + point3[0] + " " + point3[1];
          path += " L " + point4[0] + " " + point4[1];
          path += " L " + point5[0] + " " + point5[1];
          path += " Z";
          canvasObject = new fabric.Path(path, {
            stroke: this.color,
            fill: this.color,
            strokeWidth: this.drawWidth / this.canvas.getZoom()
            // angle:180,  //设置旋转角度
          });
          break;
        case "ellipse": //椭圆
          // 按shift时画正圆，只有在鼠标移动时才执行这个，所以按了shift但是没有拖动鼠标将不会画圆
          if (e.e.shiftKey) {
            mouseTo.x - left > mouseTo.y - top
              ? (mouseTo.y = top + mouseTo.x - left)
              : (mouseTo.x = left + mouseTo.y - top);
          }
          var radius =
            Math.sqrt(
              (mouseTo.x - left) * (mouseTo.x - left) +
                (mouseTo.y - top) * (mouseTo.y - top)
            ) / 2;
          canvasObject = new fabric.Ellipse({
            left: (mouseTo.x - left) / 2 + left,
            top: (mouseTo.y - top) / 2 + top,
            stroke: this.color,
            fill: "rgba(255, 255, 255, 0)",
            originX: "center",
            originY: "center",
            rx: Math.abs(left - mouseTo.x) / 2,
            ry: Math.abs(top - mouseTo.y) / 2,
            strokeWidth: this.drawWidth / this.canvas.getZoom()
          });
          break;
        case "rectangle": //长方形
          // 按shift时画正方型
          if (e.e.shiftKey) {
            const width = mouseTo.x - left;
            const height = mouseTo.y - top;
            if (width > height) {
              mouseTo.y = top + width;
            } else {
              mouseTo.x = left + height;
            }
            // 边缘检测
            if (mouseTo.x < position.left) {
              mouseTo.x = position.left;
            } else if (mouseTo.x > position.right) {
              mouseTo.x = position.right;
            }
            if (mouseTo.y < position.top) {
              mouseTo.y = position.top;
            } else if (mouseTo.x > position.bottom) {
              mouseTo.y = position.bottom;
            }
          }
          var path =
            "M " +
            mouseFrom.x +
            " " +
            mouseFrom.y +
            " L " +
            mouseTo.x +
            " " +
            mouseFrom.y +
            " L " +
            mouseTo.x +
            " " +
            mouseTo.y +
            " L " +
            mouseFrom.x +
            " " +
            mouseTo.y +
            " L " +
            mouseFrom.x +
            " " +
            mouseFrom.y +
            " z";
          canvasObject = new fabric.Path(path, {
            left: left,
            top: top,
            stroke: this.color,
            strokeWidth: this.drawWidth / this.canvas.getZoom(),
            fill: "rgba(255, 255, 255, 0)",
            hasControls: false
          });
          //也可以使用fabric.Rect
          break;
        case "text": //文本框
          const zoom = this.canvas.getZoom();
          this.textbox = new fabric.Textbox("", {
            left: mouseFrom.x,
            top: mouseFrom.y,
            editingBorderColor: this.color,
            transparentCorners: true,
            width: this.imageW - mouseFrom.x,
            fontSize: this.drawSize / zoom,
            borderColor: this.color,
            lineHeight: 1,
            fill: this.color,
            isWrapping: true,
            padding: 5,
            cornerSize: 5, // Size of object's controlling corners
            cornerColor: "#ff0000",
            lockScalingFlip: true, // 不能通过缩放为负值来翻转对象
            lockUniScaling: true, // 对象非均匀缩放被锁定
            splitByGrapheme: true,
            charSpacing: 16 / zoom
          });
          this.canvas.add(this.textbox);
          this.textbox.enterEditing();
          this.textbox.hiddenTextarea.focus();
          break;
        case "mark": // 马赛克
          this.drawMake(mouseFrom, mouseTo);
          break;
        default:
          break;
      }

      if (canvasObject) {
        // canvasObject.index = getCanvasObjectIndex();\
        this.canvas.add(canvasObject); //.setActiveObject(canvasObject)
        this.drawingObject = canvasObject;
      }
    },
    /** 马赛克 */
    drawMake() {},
    /** 马赛克 */
    // 保存当前画布为png图片
    save(type = "copy") {
      if (this.canvas && Object.keys(this.canvas).length) {
        this.canvas.setWidth(this.imageW);
        this.canvas.setHeight(this.imageH);
        this.initViewportTransform(
          1,
          this.imageW,
          this.imageH,
          this.imageW,
          this.imageH
        );
        const dataURL = this.canvas.toDataURL({
          format: "jpeg", // jpeg或png
          quality: 0.8 // 图片质量，仅jpeg时可用
        });
        if (type === "copy") {
          clipboard.writeImage(nativeImage.createFromDataURL(dataURL));
        }
        this.$emit("editImageHandle", { url: dataURL, type });
      }
    },
    /**
     * 发送至当前会话
     */
    send() {
      this.save("send");
    },
    trans() {
      this.save("trans");
    },
    download() {
      this.save("download");
    },
    quit() {
      this.$emit("editImageHandle");
    }
  }
};
</script>

<style lang="scss">
.show-media-body {
  display: flex;
  justify-content: center;
  align-items: center;
  #img {
    display: none;
  }
}
</style>
