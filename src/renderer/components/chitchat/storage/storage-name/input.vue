<template>
  <div class="storage-input">
    <div class="placeholder" v-if="!count">{{ placeholder }}</div>
    <div
      class="input"
      ref="input"
      v-once
      v-html="html"
      :style="{ lineHeight: `${tagWidth}px` }"
      @click="handleInputClick"
      @input="handleChange"
      @keydown="handleKeydown"
      @paste="handlePaste"
      @copy="handleCopy"
      @cut="handleCopy"
      contenteditable
    ></div>
    <!-- {{ count }} -->
    <i class="el-icon-circle-close" v-show="count" @click="clear"></i>
  </div>
</template>
<script>
export default {
  name: "StorageInput",
};
</script>
<script setup>
import { nextTick, onBeforeMount, onMounted, onUnmounted, ref } from "vue";
import useStorageName, {
  getImgElementByTagText,
  getTagByImgElement,
} from "./useStorageName";

const props = defineProps({
  value: String,
  maxlength: String | Number,
  placeholder: String,
  tagWidth: {
    default: 22,
    type: Number,
  },
});
const emit = defineEmits(["enter", "input"]);

// 单个标签计数
const TAG_SIZE = 4;

const input = ref(null);
const { html } = useStorageName(ref(props.value));
// 光标位置
const cursorPos = ref(null);

const count = ref(0);

const handleKeydown = (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    emit("enter");
  }
  if (e.key === "Backspace") {
    const [start, startOffset, end, endOffset] = Array.from(cursorPos.value);
    if (!end || (start === end && startOffset === endOffset)) {
      const nodes = input.value.childNodes;
      // 两个标签之间
      if (
        start === input.value &&
        nodes[startOffset - 1] &&
        nodes[startOffset - 1].nodeName === "IMG"
      ) {
        // nodes[startOffset-1].remove()
        const range = getRange(
          input.value,
          startOffset - 1,
          input.value,
          startOffset
        );
        console.log("backspace range", range);
        range.deleteContents();
        e.preventDefault();
        handleChange();
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
      // 标签后 文字前
      else if (
        (!end && startOffset === 0 && start.nodeName === "#text") ||
        (startOffset === endOffset &&
          startOffset === 0 &&
          start === end &&
          start.nodeName === "#text")
      ) {
        const offset = Array.from(nodes).findIndex((x) => start === x);
        if (nodes[offset - 1] && nodes[offset - 1].nodeName === "IMG") {
          const range = getRange(input.value, offset - 1, input.value, offset);
          console.log("backspace range", range);
          range.deleteContents();
          e.preventDefault();
          handleChange();
          const selection = document.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      // 文字后 标签前
      else if (
        start === input.value &&
        nodes[startOffset - 1] &&
        nodes[startOffset - 1].nodeName === "#text" &&
        nodes[startOffset - 1].data.length >= 1
      ) {
        const range = getRange(
          nodes[startOffset - 1],
          nodes[startOffset - 1].data.length - 1,
          nodes[startOffset - 1],
          nodes[startOffset - 1].data.length
        );
        console.log("backspace range", range);
        range.deleteContents();
        e.preventDefault();
        handleChange();
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }
};

const getRange = (start, startOffset, end, endOffset) => {
  const range = new Range();
  range.setStart(start, startOffset);
  if (end) {
    range.setEnd(end, endOffset);
  }
  return range;
};
const handleSelectionChange = (e) => {
  const selection = document.getSelection();
  const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
  // if (!input.value.innerHTML) {
  //   const range = new Range();
  //   range.setStart(input.value, 0);
  //   cursorPos.value = [input.value, 0];
  // } else
  if (input.value.contains(anchorNode)) {
    // const range = new Range();
    // range.setStart(anchorNode, anchorOffset);
    const range = selection.getRangeAt(0);
    console.log("xxxx", range);
    // const { startContainer, startOffset, endContainer, endOffset } = range;
    // if (
    //   startContainer === input.value &&
    //   startContainer === endContainer &&
    //   startOffset === endOffset &&
    //   startContainer.childNodes[startOffset - 1] &&
    //   startContainer.childNodes[startOffset - 1].nodeName === "#text"
    // ) {
    //   const beforeText = startContainer.childNodes[startOffset - 1];
    //   range.setStart(beforeText, beforeText.data.length);
    //   range.collapse(true);
    // }
    cursorPos.value = [
      range.startContainer,
      range.startOffset,
      range.endContainer,
      range.endOffset,
    ];
  }
};

// 根据最大长度截取内容
const spliceContent = () => {
  const max = +props.maxlength;
  if (isNaN(max) || max <= 0) return;
  const childNodesIter = input.value.childNodes.values();
  let length = 0,
    node;
  while (length < max) {
    if ((node = childNodesIter.next().value)) {
      if (!node) break;
      if (node.nodeName === "IMG") {
        length += TAG_SIZE;
      } else {
        length += node.data.length;
      }
    } else {
      break;
    }
  }
  const nodeIndex = Array.from(input.value.childNodes).indexOf(node);
  const inputChildLength = input.value.childNodes.length;

  const range = new Range();
  range.setEnd(input.value, inputChildLength);

  // const selection = window.getSelection()
  // selection.removeAllRanges()
  if (length === max) {
    // node之后截断
    range.setStart(input.value, nodeIndex + 1);
    // selection.addRange(range)
    range.deleteContents();
  } else if (length > max) {
    if (node.nodeName === "IMG") {
      range.setStart(input.value, nodeIndex);
      range.deleteContents();
    } else {
      range.setStart(node, node.data.length - (length - max));
      range.deleteContents();
    }
  }
};

const handleInputClick = (e) => {
  const { target, offsetX } = e;
  if (target.nodeName === "IMG") {
    // 点击图片定位光标
    const index = Array.from(input.value.childNodes).indexOf(target);
    const range = new Range();

    if (offsetX <= props.tagWidth / 2) {
      range.setStart(input.value, index);
    } else {
      range.setStart(input.value, index + 1);
    }
    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }
  nextTick().then(() => {
    input.value.focus();
  });
};

const setCurrentRange = () => {
  const selection = document.getSelection();
  const { startContainer, startOffset } = selection.getRangeAt(0);
  console.log("xxxx", startContainer, startOffset);
  cursorPos.value = [startContainer, startOffset];
};
const handleChange = () => {
  // 截断内容
  spliceContent();
  // 配合 v-model 更新，输入区域 v-once，不重新渲染
  const newValue = Array.from(input.value.childNodes)
    .map((node) => {
      if (node.nodeName === "IMG") return `[${getTagByImgElement(node)}]`;
      if (node.nodeName === "#text") return node.data || "";
      return "";
    })
    .join("");
  console.log("newValue", newValue);
  emit("input", newValue);
  count.value = Array.from(input.value.childNodes).reduce(
    (c, { nodeName, data }) => {
      if (nodeName === "IMG") return c + TAG_SIZE;
      if (nodeName === "#text") return c + data.length;
      return 1;
    },
    0
  );
  setCurrentRange();
  // if (count.value === 0) {
  //   // input.value.click()
  //   select();
  //   input.value.focus();
  // }
};

const insertTag = (v) => {
  console.log("insertTag", v);
  const img = getImgElementByTagText(v);
  // const selection = document.getSelection();
  // selection.removeAllRanges();
  // console.log("cursorPos", cursorPos.value);
  // selection.addRange(getRange(...cursorPos.value));
  // const range = selection.getRangeAt(0);
  const range = getRange(...cursorPos.value);
  range.deleteContents();
  range.insertNode(img);
  range.collapse();
  // range.setStartAfter(img);
  // range.collapse(true)
  const selection = document.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const index = Array.from(input.value.childNodes).findIndex((x) => x === img);
  if (index !== -1) {
    cursorPos.value = [input.value, index + 1];
  }
  img.scrollIntoView();

  handleChange();
};

onBeforeMount(() => {
  document.addEventListener("selectionchange", handleSelectionChange);
});
onMounted(() => {
  handleChange();

  // input.value.focus();
});
onUnmounted(() => {
  document.removeEventListener("selectionchange", handleSelectionChange);
});

const handleCopy = (e) => {
  console.log("handleCopy", e, e.clipboardData.getData("text/html"));
};
const handlePaste = (e) => {
  console.log("paste", e);
  var dataInput = e.clipboardData || e.dataTransfer;
  // 富文本
  let htmlOrigin = dataInput.getData("text/html");
  // 纯文本
  let textOrigin = dataInput.getData("text");

  // 如果包含富文本
  if (htmlOrigin) {
    // 手动插入
    // 阻止默认的行为
    e.preventDefault();

    // 只插入纯文本
    let lastRange = window.getSelection().getRangeAt(0);
    const newNode = document.createTextNode(textOrigin.replaceAll("\n", ""));
    lastRange.deleteContents();
    lastRange.insertNode(newNode);
    lastRange.setStartAfter(newNode);
    e.target.focus();
  }

  handleChange();
};

const select = () => {
  console.log("iiiiiiiiii", "select");
  const range = new Range();
  range.setStart(input.value, 0);
  range.setEnd(input.value, input.value.childNodes.length);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
};

const clear = async () => {
  input.value.innerHTML = "";
  handleChange();
  await nextTick();
  const range = new Range();
  range.setStart(input.value, 0);
  range.collapse(true);
  const selection = document.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  // cursorPos.value = range
  // input.value.click()
};
defineExpose({
  insertTag,
  select,
});
</script>
<style lang="scss" scoped>
.storage-input {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 100%;
  padding: 0 8px;
  gap: 8px;
  border: 1px solid #dcdfe6;
  padding: 0 15px;
  border-radius: 4px;
  background: white;
  &:hover,
  &:focus-within {
    .el-icon-circle-close {
      display: block;
    }
  }
  .placeholder {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #c0c4cc;
    pointer-events: none;
  }
  &:focus-within {
    border-color: #3e7eff;
  }
  .el-icon-circle-close {
    margin-right: -5px;
    display: none;
    color: #c0c4cc;
    cursor: pointer;
    &:hover {
      color: #909399;
    }
  }
  .input {
    flex: 1;
    display: flex;
    align-items: center;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: visible;
    :deep(img) {
      width: 22px;
    }

    &:focus-within {
      .el-icon-circle-close {
        color: #c0c4cc;
      }
    }
    &::-webkit-scrollbar {
      height: 0;
    }
  }
}
</style>
