<template>
  <div
    class="edit-img-box"
    :style="{ backgroundColor: isScreenCut ? '#5C646F' : 'f5f5f5' }"
  >
    <!-- <button @click="eventHandle('')">选择</button>
    <button @click="eventHandle('rectangle')">矩形</button>
    <button @click="eventHandle('text')">文字</button>
    <button @click="eventHandle('ellipse')">圆型</button>
    <button @click="eventHandle('arrow')">箭头</button>
    <button @click="eventHandle('pen')">画笔</button>
    <button @click="eventHandle('pentagram')">五角星</button>
    <button @click="eventHandle('make')">马赛克</button>
    <button @click="eventHandle('save')">完成</button> -->
    <div
      v-for="(item, index) in boxButtons"
      :class="[
        'edit-img-box-button',
        { 'text-button': ['save', 'send'].includes(item.type) },
        { 'close-button': item.type === 'quit' }
      ]"
      :key="item.type"
    >
      <el-popover
        v-model="item.showOption"
        v-if="item.tooltip"
        :placement="index < 4 ? 'bottom-start': 'bottom'"
        :popper-class="
          isScreenCut ? 'dark-image-edit-options' : 'image-edit-options'
        "
        :visible-arrow="true"
        :popper-options="{ boundariesElement: 'edit-img-box-button' }"
        width="365"
        trigger="manual"
      >
        <template solt="content" class="apps">
          <div class="image-option-body">
            <div class="image-option-size">
              <!-- 尺寸选择 -->
              <div
                v-for="size in sizeOptions"
                :key="size"
                :class="[
                  `image-option-size-${size}`,
                  { active: options.size === size }
                ]"
                @click="chooseSize(size)"
              ></div>
            </div>
            <div class="image-option-color">
              <!-- 颜色选择 -->
              <div
                v-for="color in colorOptions"
                :key="color"
                :class="[
                  'image-option-color-btn',
                  { active: options.color === color }
                ]"
                :style="{ backgroundColor: color, borderColor: color }"
                @click="chooseColor(color)"
              ></div>
            </div>
          </div>
        </template>
        <div
          slot="reference"
          class="image-option-button"
          @click.stop="eventHandle(item)"
        >
          <!-- <span v-if="item.text">{{item.text}}}</span> -->
          <img
            v-if="options.type !== item.type"
            :src="
              require(`@/assets/image/imageditor/${item.icon}${
                isScreenCut ? '_white' : ''
              }.${item.isPng ? 'png' : 'svg'}`)
            "
            @mouseleave="e => blurHandle(e, item)"
            @mouseenter="e => hoverHandle(e, item)"
            alt=""
          />
          <img
            v-else-if="item.hoverIcon && options.type === item.type"
            :src="
              require(`@/assets/image/imageditor/${item.hoverIcon}.${
                item.isPng ? 'png' : 'svg'
              }`)
            "
            alt=""
          />
        </div>
      </el-popover>
      <div v-else class="image-option-button" @click.stop="eventHandle(item)">
        <el-button type="primary" v-if="item.text">{{ item.text }}</el-button>
        <img
          v-else-if="item.isDisabled && !canvasHasChange"
          :src="require(`@/assets/image/imageditor/${item.icon}_gray.svg`)"
          alt=""
        />
        <img
          v-else-if="options.type === item.type && item.hoverIcon"
          :class="[{ 'big-icon': item.type === '' }]"
          :src="require(`@/assets/image/imageditor/${item.hoverIcon}.svg`)"
          alt=""
        />
        <img
          v-else
          @mouseenter="e => hoverHandle(e, item)"
          @mouseleave="e => blurHandle(e, item)"
          :class="[{ 'big-icon': item.type === '' }]"
          :src="
            require(`@/assets/image/imageditor/${item.icon}${
              isScreenCut ? '_white' : ''
            }.svg`)
          "
          alt=""
        />
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "editImgBox",
  props: {
    editImage: Boolean,
    operate: Array,
    showSendCurrent: {
      type: Boolean | String,
      default: false
    },
    isScreenCut: {
      type: Boolean,
      default: false
    },
    isDrawing: {
      type: Boolean,
      default: false
    },
    canvasHasChange: {
      type: Boolean,
      default: false
    }
  },
  data: () => ({
    options: {
      type: "",
      size: "middle", // 大小
      color: "#FF5152", // 颜色
      watermark: "" // 水印文字
    },
    buttons: [
      // {
      //   type: "",
      //   icon: "select",
      //   hoverIcon: "select_blue",
      //   handleType: "show"
      // },
      {
        type: "rectangle",
        icon: "rect",
        hoverIcon: "rect_blue",
        tooltip: true,
        showOption: false,
        handleType: "edit"
      },
      {
        type: "ellipse",
        icon: "circle",
        hoverIcon: "circle_blue",
        tooltip: true,
        showOption: false,
        handleType: "edit"
      },
      {
        type: "arrow",
        icon: "arrow",
        hoverIcon: "arrow_blue",
        tooltip: true,
        isPng: true,
        showOption: false,
        handleType: "edit"
      },
      {
        type: "pen",
        icon: "pen",
        hoverIcon: "pen_blue",
        tooltip: true,
        showOption: false,
        handleType: "edit"
      },
      {
        type: "text",
        icon: "text",
        hoverIcon: "text_blue",
        tooltip: true,
        showOption: false,
        handleType: "edit"
      },
      {
        type: "back",
        icon: "back",
        hoverIcon: "back_blue",
        isDisabled: true,
        handleType: "show"
      },
      {
        type: "trans",
        icon: "trans",
        hoverIcon: "trans_blue",
        handleType: "show"
      },
      {
        type: "download",
        icon: "download",
        hoverIcon: "download_blue",
        handleType: "show"
      },
      {
        type: "save",
        text: "复制",
        handleType: "show"
      },
      {
        type: "send",
        text: "发至当前会话",
        handleType: "show"
      },
      {
        type: "quit",
        icon: "close",
        hoverIcon: "close_blue",
        handleType: "show"
      }
    ],
    sizeOptions: ["small", "middle", "large"],
    colorOptions: [
      "#DDE0E3",
      "#FF5152",
      "#2B2B2B",
      "#FFCC00",
      "#0178FF",
      "#21FFCE"
    ]
  }),
  computed: {
    boxButtons() {
      let { operate, buttons, isScreenCut } = this;
      if (!operate.includes("transpond")) {
        buttons = buttons.filter(item => item.type !== "trans");
      }
      if (isScreenCut) {
        buttons = buttons.filter(
          item => !["download", "quit", "save", "send"].includes(item.type)
        );
      }
      if (!this.showSendCurrent) {
        buttons = buttons.filter(item => item.type !== "send");
      }
      return buttons;
    }
  },
  watch: {
    options: {
      deep: true,
      handler(newVal) {
        this.$emit("eventHandle", { ...newVal });
      }
    },
    isDrawing(newVal, oldVal) {
      if (!newVal) {
        this.options = {
          type: "",
          size: "middle", // 大小
          color: "#FF5152", // 颜色
          watermark: "" // 水印文字
        };
        this.buttons.forEach(item => {
          this.$set(item, "showOption", false);
        });
      }
    },
    editImage(newVal, oldVal) {
      if (newVal) {
        this.options = {
          type: "",
          size: "middle", // 大小
          color: "#FF5152", // 颜色
          watermark: "" // 水印文字
        };
      }
    }
  },
  methods: {
    hoverHandle(e, item) {
      if (item.hoverIcon) {
        const element = e.target;
        element.src = require(`@/assets/image/imageditor/${item.hoverIcon}.${
          item.isPng ? "png" : "svg"
        }`);
      }
    },
    blurHandle(e, item) {
      const element = e.target;
      element.src = require(`@/assets/image/imageditor/${item.icon}${
        this.isScreenCut ? "_white" : ""
      }.${item.isPng ? "png" : "svg"}`);
    },
    chooseColor(color) {
      this.options.color = color;
    },
    chooseSize(size) {
      this.options.size = size;
    },
    eventHandle(option) {
      this.buttons = this.buttons.map(item => {
        return {
          ...item,
          showOption: false
        };
      });
      if (option.handleType === "edit") {
        let showOption = !option.showOption;
        const itemIndex = this.buttons.findIndex(
          item => item.type === option.type
        );
        this.$set(this.buttons, itemIndex, { ...option, showOption });
        if (!showOption) {
          // 再次点击清空选项
          this.options = {
            type: "",
            size: "middle", // 大小
            color: "#FF5152", // 颜色
            watermark: "" // 水印文字
          };
        } else {
          // 每次点击按钮都重置颜色和大小
          this.options = {
            type: option.type,
            size: "middle", // 大小
            color: "#FF5152", // 颜色
            watermark: "" // 水印文字
          };
        }
      } else {
        // 先清空后赋值, 解决连续点击撤销问题
        this.$set(this.options, "type", "");
        this.$set(this.options, "type", option.type);
      }
    }
  }
};
</script>
<style scoped lang="scss">
.edit-img-box {
  flex: 0 0 50px;
  height: 40px;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  -webkit-app-region: drag;
  background: #f5f5f5;
  > div {
    height: 100%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    margin: 0 13px;
    -webkit-app-region: none;
    &.text-button {
      width: auto;
    }
    &.close-button {
      width: 54px;
      border-left: 1px solid #8f959e;
      margin: 0;
    }
    .el-popover__reference-wrapper {
      width: 100%;
      height: 100%;
    }
    .image-option-button {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      .el-button {
        width: auto;
        min-width: 54px;
        padding: 0 8px;
        box-sizing: border-box;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: #3e7eff;
      }
      > img {
        width: 20px;
        height: 20px;
        &.big-icon {
          width: 30px;
          height: 30px;
        }
      }
    }
  }
}
</style>
<style lang="scss">
.dark-image-edit-options,
.image-edit-options {
  height: 40px;
  background: #fff;
  padding-left: 0;
  padding-right: 0;
  .image-option-body {
    width: 100%;
    height: 100%;
    display: flex;
    > div {
      display: flex;
      align-items: center;
      &.image-option-size {
        margin-left: 8px;
        position: relative;
        &::before {
          content: "";
          width: 1;
          height: 20px;
          position: absolute;
          background: #8f959e;
          top: 10px;
          right: 20px;
        }
        > div {
          background: #f1f4f6;
          margin-right: 20px;
          border-radius: 50%;
          cursor: pointer;
          // box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.4);
          &.active {
            background: #3e7eff;
          }
        }
        .image-option-size-small {
          width: 12px;
          height: 12px;
        }
        .image-option-size-middle {
          width: 16px;
          height: 16px;
        }
        .image-option-size-large {
          width: 20px;
          height: 20px;
        }
      }
      &.image-option-color {
        > div {
          width: 19px;
          height: 19px;
          margin-right: 20px;
          cursor: pointer;
          border: 4px solid #fff;
          // box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.4);
        }
      }
    }
  }
}
.image-edit-options {
  .image-option-color {
    > div {
      &.active {
        background-color: #ffffff !important;
      }
    }
  }
}
.dark-image-edit-options {
  background-color: #3e444d !important;
  border-color: #3e444d !important;
  top: 3px !important;
  .popper__arrow {
    border-bottom-color: #3e444d !important;
    &::after {
      border-bottom-color: #3e444d !important;
    }
  }
  .image-option-color {
    > div {
      border: none;
      &.active {
        border: 2px solid #fff !important;
      }
    }
  }
}
</style>
