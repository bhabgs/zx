<template>
  <div name="list">
    <section class="top-notice-container">
      <header class="notice-header">
        <h1 class="only-line" v-text="notice.title"></h1>
        <a-badge
          class="badge-count"
          v-show="noticeList.length > 1"
          :count="noticeList.length"
          :overflow-count="99"
        ></a-badge>
      </header>
      <main class="notice-body">
        <div class="notice-info-title" v-if="notice.content">
          <h2 class="only-line" v-text="notice.content.title"></h2>
          <div
            class="tag-wrapper"
            v-if="notice.content.tags && notice.content.tags.length"
          >
            <template v-for="(tag, index) of notice.content.tags">
              <span
                class="tag-item"
                :key="index"
                v-text="tag.text"
                :style="{ color: tag.color, borderColor: tag.color }"
              ></span>
            </template>
          </div>
        </div>
        <div
          v-if="notice.contentType === 'HTML' && notice.content"
          v-html="notice.content.text"
        ></div>
        <p
          class="only-line"
          v-else-if="notice.content"
          v-text="notice.content.text"
        ></p>
      </main>
      <footer class="notice-footer">
        <a-dropdown
          placement="bottomCenter"
          v-model="visible"
          :trigger="['click']"
        >
          <a-menu slot="overlay">
            <a-menu-item key="1"
              ><a-button
                type="link"
                size="small"
                class="ignore-all-btn"
                @click.stop="disposeHandle('ignoreAll', notice)"
                >全部收起</a-button
              ></a-menu-item
            >
          </a-menu>
          <div class="ignore-btn-group">
            <a-button type="link" @click.stop="disposeHandle('ignore', notice)"
              >暂不处理</a-button
            >
            <a-icon
              type="down"
              :class="{ rotate: this.visible }"
              @click.stop="triggerDropmenu"
            />
          </div>
        </a-dropdown>
        <a-button type="primary" @click.stop="disposeHandle('check', notice)"
          >立即查看</a-button
        >
      </footer>
    </section>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
const remote = require('@electron/remote');

export default {
  name: "NoticeApp",
  data() {
    return {
      noticeList: [], // 通知列表,
      visible: false,
      notice: {} // 用于展示的数据
    };
  },
  created() {
    remote.getCurrentWebContents().on("push-notice", data => {
      this.noticeList.unshift(...data.reverse());
      this.setShowDataHandle();
    });

    remote.getCurrentWebContents().on("notice-pass", this.passNoticeHandle);
  },
  mounted() {
    this.$nextTick(() => {
      remote.getCurrentWebContents().emit("can-send");
    });
  },
  watch: {
    noticeList: {
      deep: true,
      handler() {
        this.setShowDataHandle();
      }
    }
  },
  methods: {
    /**
     * 通知处理
     */
    disposeHandle(type, notice) {
      let uuids = [];
      switch (type) {
        case "ignore": // 暂不处理
          uuids = [notice._uuid];
          this.noticeList.splice(0, 1);
          break;

        case "check": // 立即查看
          uuids = [notice._uuid];
          this.noticeList.splice(0, 1);
          break;

        case "ignoreAll": // 全部忽略
          uuids = this.noticeList.map(item => item._uuid);
          this.noticeList.splice(0);
          break;
      }
      this.visible = false;
      this.$nextTick(() => {
        remote.getCurrentWebContents().emit("handle-notify", {
          uuids,
          type,
          has: !!this.noticeList.length
        });
      });
    },
    passNoticeHandle(ids) {
      if (ids && ids.length) {
        // 根据传入的Id关闭对应通知弹框
        const uuids = [];

        ids.forEach(id => {
          let index = this.noticeList.findIndex(item => item.id === id);
          let notice = this.noticeList.splice(index, 1)[0];
          notice && uuids.push(notice._uuid);
        });

        remote.getCurrentWebContents().emit("handle-notify", {
          uuids,
          type: "pass",
          has: !!this.noticeList.length
        });
      }
    },
    triggerDropmenu() {
      this.visible = !this.visible;
    },
    setShowDataHandle() {
      const data = this.noticeList[0] || {};
      this.notice = data;
    }
  }
};
</script>

<style lang="scss">
html,
body,
.top-notice-container {
  background-color: transparent;
  // box-shadow: 0 0 10px 0 rgba($color: #000, $alpha: 0.3);
}

.only-line {
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.top-notice-container {
  position: absolute;
  padding: 10px 20px;
  width: 100vw;
  height: 100vh;
  background-color: #fff;
  border-radius: 4px;
  display: flex;
  flex-direction: column;

  > * {
    flex-shrink: 0;
  }

  .notice-header {
    display: flex;
    overflow: hidden;
    margin-bottom: 10px;
    align-items: center;
    > h1 {
      flex-shrink: 0;
      font-size: 16px;
      font-weight: bold;
      line-height: 21px;
      color: #4498f0;
    }

    .badge-count {
      margin-left: 8px;
      flex-shrink: 0;

      .ant-badge-count {
        padding: 0 4px;
        min-width: 20px;
        background: #eb5d52;
        font-size: 10px;
        border-radius: 8px;
        height: 16px;
        line-height: 16px;
      }
    }
  }

  .notice-body {
    flex: 1;
    overflow: hidden;
    h2 {
      font-size: 14px;
      font-weight: bold;
      line-height: 1;
    }

    .notice-info-title {
      display: flex;
      margin-bottom: 7px;
      align-items: center;
      justify-content: space-between;
      height: 20px;
      line-height: 1;

      .tag-wrapper {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        overflow: hidden;
        justify-content: flex-end;
      }
    }
  }

  .tag-item {
    flex-shrink: 0;
    margin-left: 8px;
    border-radius: 16px;
    border: 1px solid orange;
    color: orange;
    font-size: 10px;
    padding: 3px 6px;
  }

  .notice-footer {
    display: flex;
    justify-content: flex-end;

    .ignore-btn-group {
      display: flex;
      align-items: center;
      margin-right: 20px;

      > button {
        padding: 0;
        color: #4498f0;
      }

      .anticon {
        padding: 2px;
        font-size: 8px;
        color: #4498f0;
        transition: 0.15s linear;

        &.rotate {
          transform: rotateZ(-180deg);
        }
      }
    }
  }
}

.ant-dropdown-menu {
  padding: 0 !important;
  .ant-dropdown-menu-item {
    padding: 0;
  }
  .ignore-all-btn {
    color: #333 !important;
    font-size: 12px;
    width: 78px;
    text-align: center;
    height: 30px;
    line-height: 30px;
  }
}
</style>
