<!--
 * @Author: lixiaowei
 * @Date: 2021-04-17 14:20:31
 * @LastEditors: lixiaowei
 * @LastEditTime: 2021-05-07 16:42:08
 * @Description: 快捷键设置
 * @FilePath: /zx-client-pc/src/renderer/pages/setting-panel/component/shortcut-key.vue
-->

<template>
  <section id="shortcut-key-box">
    <div class="shortcut-key-title" ref="shortcutKeyTitle">快捷键</div>
    <template v-for="(row, index) of shortcutList">
      <div
        :key="row.key"
        class="shortcut-item"
        :class="{ 'warning-box': row.showName && !row.status }"
      >
        <div>
          <span>{{ row.name }}</span>
          <a-input
            class="shortcut-item-input"
            v-model="row.showName"
            placeholder="键盘输入快捷键"
            readOnly
            :ref="row.key"
            @blur="inputBlurHandle(row, index)"
            @click="inputClickHandle(row, index)"
            @keydown="inputKeyHandle($event, row, index)"
          ></a-input>
        </div>
        <div class="warning-text" v-show="row.showName && !row.status">
          <span>*</span><span>该快捷键被占用，请重新设置</span>
        </div>
        <a-button
          type="link"
          class="revert-button"
          v-show="row.edit"
          @click="revertShortcut(row, index)"
          >还原</a-button
        >
      </div>
    </template>
  </section>
</template>

<script>
import { message } from 'ant-design-vue';
import { ipcRenderer } from "electron";
import { platform } from "process";
import {
  Short2Keyboard,
  Keyboard2Short,
  Keyboard2KeyCode,
  step,
  DefaultShortcut
} from "../../../../main/constants/shortcut";

let timerBlur = null; // 失焦事件

export default {
  name: "ShortcutKey",
  data() {
    return {
      shortcutList: [
        { name: "截屏", key: "screenshort", cmd: "", edit: false },
        { name: "打开对话", key: "openMainWindow", cmd: "", edit: false }
      ],
      tempKey: {
        origin: [],
        show: ""
      }
    };
  },
  created() {
    this.init();
  },
  beforeDestroy() {},
  methods: {
    async init() {
      const result = await ipcRenderer.invoke("get-shortcut");
      this.shortcutList.forEach(item => {
        const temp_data = result[item.key];
        if (temp_data) {
          item.edit = false;
          this.$set(item, "cmd", temp_data.hotkey);
          this.$set(item, "showName", temp_data.showName);
          this.$set(item, "status", temp_data.status);
        }
      });

    },
    /**
     * 快捷键编辑框点击事件
     */
    inputClickHandle(item, index) {
      item.showName = "";
      item.edit = true;
      this.tempKey.origin = [];
      this.tempKey.show = "";
    },
    inputBlurHandle(item, index) {
      clearTimeout(timerBlur);
      timerBlur = setTimeout(() => {
        const { init } = this;
        init();
      }, 200);
    },
    /**
     * 还原快捷键修改
     */
    revertShortcut(item, index) {
      // clearTimeout(timerBlur);
      const { hotkey } = DefaultShortcut[item.key];
      this.registerShortcut(hotkey, item.key, item.cmd);
    },
    /**
     * 键盘键入事件
     */
    async inputKeyHandle(e, item, index) {
      // console.log(e, item, index);
      const { tempKey } = this;
      const { altKey, code, ctrlKey, key, keyCode, metaKey, shiftKey } = e;
      // console.log(String.fromCodePoint(keyCode));
      tempKey.origin = [];
      let addShortcut = "";
      if (ctrlKey) {
        // 按下了ctrl键
        tempKey.origin.push("Ctrl");
      }
      if (shiftKey) {
        // 按下shift键
        tempKey.origin.push("Shift");
      }
      if (metaKey) {
        // window下window键，Mac下对应command
        if (platform === "darwin") {
          tempKey.origin.push("Command");
        }
      }
      if (altKey) {
        tempKey.origin.push("Alt");
      }

      if (keyCode >= 37 && key !== "Meta" && tempKey.origin.length) {
        let keyName = key;
        if (
          (keyCode >= 65 && keyCode <= 90) ||
          (keyCode >= 97 && keyCode <= 122)
        ) {
          // 字母
          keyName = (key.charCodeAt(0) === keyCode
            ? keyName
            : String.fromCharCode(keyCode)
          ).toLocaleUpperCase();
        }
        tempKey.origin.push(keyName);
      }
      addShortcut &&
        !tempKey.origin.includes(addShortcut) &&
        tempKey.origin.push(addShortcut);

      const platformKey = platform === "darwin" ? "macos" : "window";
      const temp_data = tempKey.origin.map(row => {
        return Short2Keyboard[platformKey][row] || row;
      });

      item.showName = temp_data.join(step[platformKey]);
      if (keyCode >= 37 && key !== "Meta" && tempKey.origin.length > 1) {
        this.registerShortcut(tempKey.origin.join("+"), item.key, item.cmd);
        const input = this.$refs[item.key];
        input && input[0] && input[0].blur();
      }
    },
    async registerShortcut(hotkey, key, cmd) {
      if (hotkey === cmd) return;
      let result = await ipcRenderer.invoke("register-global-shortcut", {
        hotkey,
        key
      });
      if (result) {
        await ipcRenderer.invoke("unregister-global-shortcut", cmd);
      } else {
        message.warning(`快捷键 ${hotkey} 被占用，无法设置`);
      }
      ipcRenderer.send("event-transfr", { channel: "update-global-shortcut" });
      this.init();
    }
  }
};
</script>

<style lang="scss">
#shortcut-key-box {
  width: 100%;
  .shortcut-key-title {
    color: #1f2329;
    line-height: 19px;
    margin: {
      bottom: 14px;
    }
  }

  .shortcut-item {
    // display: flex;
    // align-items: center;
    padding: {
      bottom: 14px;
      right: 40px;
    }
    position: relative;

    &.warning-box {
      padding: {
        bottom: 0;
      }

      .shortcut-item-input {
        border-color: #ea5858;
      }
    }

    > div {
      display: flex;
      align-items: center;
      &:not(.warning-text) {
        > span {
          flex: 1;
          margin: {
            right: 10px;
          }
          text-align: right;
          color: #8f959e;
          line-height: 19px;
        }
      }
    }

    .warning-text {
      justify-content: flex-end;
      padding: 2px 0;
      font-size: 10px;
      color: #ea5858;
      line-height: 12px;
    }

    .shortcut-item-input {
      flex-shrink: 0;
      flex-basis: 190px;
      width: 190px;
      padding: 0 10px;
    }

    .revert-button {
      position: absolute;
      right: 0;
      top: 0;
      color: #4498f0;
      font-size: 12px;
    }
  }
}
</style>
