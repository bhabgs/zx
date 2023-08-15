<template>
  <section class="screen-cut">
    <div id="js-bg" class="bg"></div>
    <div id="js-mask" class="mask" v-show="showNode.mask"></div>
    <canvas id="js-canvas" class="image-canvas"></canvas>
    <canvas id="imageEdit" :width="0" :height="0"></canvas>
    <div id="js-size-info" class="size-info"></div>
    <div id="js-toolbar" class="toolbar">
      <edit-img-box
        :editImage="true"
        :operate="operate"
        :isDrawing="isEditImage"
        :isScreenCut="true"
        :canvasHasChange="canvasHasChange"
        @eventHandle="eventHandle"
      ></edit-img-box>
      
      <el-tooltip effect="dark" content="重置截图范围" placement="bottom" :visible-arrow="false" :open-delay="300" :enterable="false">
        <div
        class="imageBtn imageBtn-zhongzhi"
        title="重置截图范围"
        @click="operateHandler('reset')"
        ></div>
      </el-tooltip>
      <div class="imageBtn imageBtn-xiazai" @click="operateHandler('save')"></div>
      <div class="imageBtn imageBtn-guanbi" @click="operateHandler('close')"></div>
      <div class="imageBtn imageBtn-duihao" @click="operateHandler('ok')"></div>
    </div>
  </section>
</template>
<script>
const { ipcRenderer, clipboard, nativeImage } = require("electron");
const remote = require('@electron/remote');
const fs = require("fs");
import moment from "moment";
import { getScreenSources } from "./util/desktop-capturer";
import { CaptureEditor } from "./util/capture-editor";
import { getCurrentScreen } from "./util/utils";
const { productName } = remote.getGlobal("appInfo");
import EditImgBox from "../show-media/edit-img-box";
import { fabric } from "fabric";
import { log } from "console";
export default {
  name: "ScreenCut",
  components: {
    EditImgBox
  },
  data: () => ({
    capture: null,
    $canvas: null, // 画布
    $bg: null, // 背景
    $sizeInfo: null, // 尺寸信息展示
    $toolbar: null, // 截图工具栏
    currentScreen: null, // 当前屏幕信息
    isDraging: false, // 是否已开始绘制
    showNode: {
      mask: false
    }, // 控制元素显示隐藏
    operate: [],
    editImageOptions: {
      type: ""
    },

    eventHandleCount: 0,
    isEditImage: false,
    canvas: {},
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
  }),
  mounted() {
    this.$nextTick(() => {
      this.canvas = new fabric.Canvas("imageEdit", {
        skipTargetFind: false //当为真时，跳过目标检测。目标检测将返回始终未定义。点击选择将无效
        // selectable: false,  //为false时，不能选择对象进行修改
        // selection: false   // 是否可以多个对象为一组
      });
      this.canvas.selectionColor = "rgba(0,0,0,0.05)";
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
      this.$canvas = document.getElementById("js-canvas");
      this.$bg = document.getElementById("js-bg");
      this.$sizeInfo = document.getElementById("js-size-info");
      this.$toolbar = document.getElementById("js-toolbar");
      this.currentScreen = getCurrentScreen();

      const {
        $canvas,
        $bg,
        $sizeInfo,
        $toolbar,
        onDragEnd,
        onDrag,
        mousedownHandler,
        reset,
        keypressHandler,
        captureScreen,
        currentScreen
      } = this;
      // 右键取消截屏
      document.body.addEventListener("mousedown", mousedownHandler, true);
      ipcRenderer.on("capture-screen", captureScreen);

      getScreenSources(
        {},
        imgSrc => {
          ipcRenderer.send('show-capture')
          this.showNode.mask = true;
          let capture = new CaptureEditor($canvas, $bg, imgSrc); // 初始化截图编辑工具类
          this.capture = capture;

          capture.on("start-dragging", onDrag);
          capture.on("dragging", onDrag);

          capture.on("end-dragging", onDragEnd);

          capture.on("reset", reset);

          window.addEventListener("keypress", keypressHandler);
        },
        e => {
          ipcRenderer.send("capture-screen", { type: "close" });
        }
      );
    });
  },
  watch: {
    drawType() {
      this.canvas.selection = !this.drawType;
    },
    editImageOptions: {
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
    },
    eventHandleCount(newVal) {
      if (newVal == 1) {
        this.isEditImage = true;
        this.capture.clearEvent();
        this.canvas.on("mouse:down", this.mousedown);
        this.canvas.on("mouse:move", this.mousemove);
        this.canvas.on("mouse:up", this.mouseup);
        const { width, height } = this.$canvas.style;
        // const ratio = this.getPixelRatio(this.$canvas.getContext("2d"));
        const realWidth = parseInt(width.replace("px", ""));
        const realHeight = parseInt(height.replace("px", ""));
        this.imageW = realWidth;
        this.imageH = realHeight;
        this.canvas.setWidth(realWidth);
        this.canvas.setHeight(realHeight);
        const element = document.getElementsByClassName("canvas-container");
        if (element && element.length) {
          const { top, left } = this.$canvas.style;
          element[0].style.display = "block";
          element[0].style.top = top;
          element[0].style.left = left;
        }
        const imgSrc = this.$canvas.toDataURL("image/png");
        const imgInstance = fabric.Image.fromURL(imgSrc, oImag => {
          oImag.scaleX = realWidth / oImag.width;
          oImag.scaleY = realHeight / oImag.height;
          this.canvas.setBackgroundImage(
            oImag,
            this.canvas.renderAll.bind(this.canvas)
          );
          this.canvas.renderAll();
        });
      }
    }
  },
  computed: {
    // 判断撤销是否置灰
    canvasHasChange() {
      let result = false;
      if(this.canvas && this.canvas.getObjects) {
        result = this.canvas.getObjects().length >= 1
      }
      return result;
    }
  },
  methods: {
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
    eventHandle(options) {
      if (!!options.type) {
        this.eventHandleCount += 1;
        this.editImageOptions = { ...options };
      }
    },
    // 开始绘制时，指定绘画种类
    drawTypeChange(option) {
      this.drawType = option.type;
      if (option.type === "save") {
        this.operateHandler("ok");
      } else if (option.type === "quit") {
        this.operateHandler("close");
      } else if (option.type === "trans") {
      } else if (option.type === "download") {
        this.operateHandler("save");
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
    getBorder() {
      return {
        left: 0,
        right: this.imageW - this.drawWidth,
        top: 0,
        bottom: this.imageH - this.drawWidth
      };
    },
    // 鼠标按下时触发
    mousedown(e) {
      // 记录鼠标按下时的坐标
      var xy = e.pointer || this.transformMouse(e.e.offsetX, e.e.offsetY);
      this.mouseFrom.x = xy.x;
      this.mouseFrom.y = xy.y;
      this.doDrawing = true;
      const position = this.getBorder();
      if (
        xy.x < position.left ||
        xy.x > position.right ||
        xy.y < position.top ||
        xy.y > position.bottom
      ) {
        console.log("不在画布范围内");
        this.doDrawing = false;
        // 此时起点不在画布范围内
        return;
      }
      if (this.drawType == "text") {
        this.drawing();
      }

      if (this.textbox) {
        this.textbox.enterEditing();
        this.textbox.hiddenTextarea.focus();
      }
    },
    // 鼠标松开执行
    mouseup(e) {
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
    },

    //鼠标移动过程中已经完成了绘制
    mousemove(e) {
      if (this.moveCount % 2 && !this.doDrawing) {
        //减少绘制频率
        return;
      }
      this.moveCount++;
      var xy = e.pointer || this.transformMouse(e.e.offsetX, e.e.offsetY);
      const mouseTo = xy;
      const position = this.getBorder();
      if (this.drawType == "pen") {
        console.log("pen", position, mouseTo);
        if (
          mouseTo.x < position.left ||
          mouseTo.x > position.right ||
          mouseTo.y < position.top ||
          mouseTo.y > position.bottom
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
      this.mouseTo.x = mouseTo.x;
      this.mouseTo.y = mouseTo.y;
      // 多边形与文字框特殊处理
      if (this.drawType != "text" || this.drawType != "polygon") {
        this.drawing(e);
      }
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
            strokeWidth: this.drawWidth
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
            strokeWidth: this.drawWidth
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
            strokeWidth: this.drawWidth
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
          console.log("rectPath", path);
          canvasObject = new fabric.Path(path, {
            left: left,
            top: top,
            stroke: this.color,
            strokeWidth: this.drawWidth,
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

        default:
          break;
      }

      if (canvasObject) {
        // canvasObject.index = getCanvasObjectIndex();\
        this.canvas.add(canvasObject); //.setActiveObject(canvasObject)
        this.drawingObject = canvasObject;
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
    operateHandler(type) {
      const { selectCapture, saveCapture, capture, onDragEnd } = this;
      switch (type) {
        case "reset":
          onDragEnd();
          capture.init();
          capture.reset();
          if (this.textbox) {
            // 选择其他时清除文字输入状态
            this.textbox.exitEditing();
          }
          this.canvas.clear();
          this.canvas.remove(this.canvas.getActiveObject());
          this.eventHandleCount = 0;
          this.isEditImage = false;
          this.editImageOptions = {
            type: ""
          };
          // const element = document.getElementsByClassName("canvas-container");
          // if (element && element.length) {
          //   element[0].style.display = "none";
          // }
          break;

        case "save":
          saveCapture();
          break;
        case "close":
          ipcRenderer.send("capture-screen", { type: "close" });
          break;

        case "ok":
          selectCapture();
          break;

        default:
          break;
      }
    },
    selectCapture() {
      const { capture } = this;
      if (!capture.selectRect) {
        return;
      }
      let url = "";
      if (this.isEditImage) {
        url = this.canvas.toDataURL({
          format: "jpeg", // jpeg或png
          quality: 1 // 图片质量，仅jpeg时可用
        });
      } else {
        url = capture.getImageUrl();
      }

      clipboard.writeImage(nativeImage.createFromDataURL(url));
      ipcRenderer.send("capture-screen", {
        type: "complete",
        operate: "paste"
      });
    },
    async saveCapture() {
      const { capture } = this;
      const filename = `${productName}_${moment().format(
        "YYYYMMDDHHmmss"
      )}.jpeg`;
      let path = await remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
        defaultPath: filename,
        filters: [
          {
            name: "jpeg",
            extensions: ["jpeg"]
          }
        ]
      });

      if (!path.canceled) {
        let url = "";
        if (this.isEditImage) {
          url = this.canvas.toDataURL({
            format: "jpeg", // jpeg或png
            quality: 1 // 图片质量，仅jpeg时可用
          });
        } else {
          url = capture.getImageUrl();
        }
        if (path) {
          // eslint-disable-next-line no-buffer-constructor
          fs.writeFile(
            path.filePath,
            new Buffer(url.replace(/data:image\/[^;]+;base64,/, ""), "base64"),
            () => {
              ipcRenderer.send("capture-screen", {
                type: "complete",
                url,
                path
              });
            }
          );
        }
      }
    },
    onDragEnd() {
      if (!this.isEditImage) {
        const { capture, $toolbar } = this;
        if (capture.selectRect) {
          const { r, b } = capture.selectRect;
          $toolbar.style.display = "flex";
          if (window.screen.height <= b + 50) {
            $toolbar.style.top = `${b - 50}px`;
          } else {
            $toolbar.style.top = `${b + 10}px`;
          }
          $toolbar.style.right = `${window.screen.width -
            capture.selectRect.r}px`;
        }
        this.isDraging = false;
      }
    },
    onDrag(selectRect) {
      if (!this.isEditImage) {
        const { capture, $toolbar, $sizeInfo, isDraging, currentScreen } = this;
        if (!isDraging) {
          this.isDraging = true;
          ipcRenderer.send("capture-screen", {
            type: "select",
            screenId: currentScreen.id
          });
        }

        $toolbar.style.display = "none";
        $sizeInfo.style.display = "block";
        $sizeInfo.innerText = `${selectRect.w} * ${selectRect.h}`;
        if (selectRect.y > 35) {
          $sizeInfo.style.top = `${selectRect.y - 30}px`;
        } else {
          $sizeInfo.style.top = `${selectRect.y + 10}px`;
        }
        $sizeInfo.style.left = `${selectRect.x}px`;
      }
    },
    captureScreen(e, { type, screenId }) {
      const { currentScreen, capture } = this;
      if (type === "select") {
        if (screenId && screenId !== currentScreen.id) {
          capture.disable();
          capture.reset();
        } else {
          capture.enable();
        }
      }
    },
    mousedownHandler(e) {
      const { capture, operateHandler } = this;
      if (e.button === 2) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
        if (capture.selectRect) {
          operateHandler("reset");
        } else {
          ipcRenderer.send("capture-screen", { type: "close" });
        }
      }
    },
    reset() {
      /**
       * 重置选取状态
       */
      const { $toolbar, $sizeInfo } = this;
      $toolbar.style.display = "none";
      $sizeInfo.style.display = "none";
      this.isDraging = false;
    },
    keypressHandler(e) {
      /**
       * 键盘按下事件处理
       * 按下回车键时选中选取处理
       */
      if (e.code === "Enter" || e.code === "NumpadEnter") {
        e.stopPropagation();
        e.preventDefault();
        this.selectCapture();
      }
    }
  }
};
</script>
<style lang="scss">
@import "./assets/iconfont/iconfont.css";
html,
body,
div,
section,
p,
button,
i {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  width: 0;
  height: 0;
  background-color: unset !important;
  overflow: hidden;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
}

.bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.image-canvas {
  position: absolute;
  display: none;
  z-index: 1;
}

.size-info {
  position: absolute;
  color: #ffffff;
  font-size: 12px;
  background: rgba(40, 40, 40, 0.8);
  padding: 5px 10px;
  border-radius: 2px;
  font-family: Arial Consolas sans-serif;
  display: none;
  z-index: 2;
}

.toolbar {
  position: absolute;
  color: #343434;
  font-size: 12px;
  background: #5c646f;
  padding: 5px 10px;
  border-radius: 4px;
  font-family: Arial Consolas sans-serif;
  display: none;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.4);
  z-index: 2;
  align-items: center;
}

.toolbar {
  width: auto !important;
  > div {
    width: auto !important;
  }
  .imageBtn {
    width: 20px!important;
    height: 20px;
    background-position: center;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    margin: 0 13px;
    cursor: pointer;
    &.imageBtn-zhongzhi {
      background-image: url("~@/assets/image/imageditor/zhongzhi_white.svg");
      &:hover {
        background-image: url("~@/assets/image/imageditor/zhongzhi_blue.svg");
      }
    }
    &.imageBtn-xiazai {
      background-image: url("~@/assets/image/imageditor/download_white.svg");
      &:hover {
        background-image: url("~@/assets/image/imageditor/download_blue.svg");
      }
    }
    &.imageBtn-guanbi {
      position: relative;
      margin-left: 23px;
      &::before {
        content: "";
        position: absolute;
        width: 1px;
        height: 20px;
        background: rgba(255, 255, 255, 0.3);
        top: 0;
        left: -18px;
      }
      background-image: url("~@/assets/image/imageditor/close_white.svg");
      &:hover {
        background-image: url("~@/assets/image/imageditor/close_blue.svg");
      }
    }
    &.imageBtn-duihao {
      width: 25px!important;
      height: 24px;
      background-image: url("~@/assets/image/imageditor/done_white.svg");
      &:hover {
        background-image: url("~@/assets/image/imageditor/done_blue.svg");
      }
    }
  }
}
.canvas-container {
  z-index: 10;
  position: absolute !important;
  display: none;
  background: none;
  canvas {
    background-color: unset;
  }
}
</style>
