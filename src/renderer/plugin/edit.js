export default class Edit {
  static deleteRange(selectedRange) {
    // 删除选中内容
    if (selectedRange) {
      selectedRange.deleteContents();
    }
  }
  static restoreSelection(range, type) {
    if (typeof type === "boolean") {
      range.collapse(type);
    }
    let selection = window.getSelection();
    if (selection) {
      try {
        selection.removeAllRanges(); // 清空所有Range
      } catch (error) {
        document.body.createTextRange().select();
        document.selection.empty();
      }

      selection.addRange(range);
    }
  }
  static pleaseCaretAtEnd(el) {
    if (window.getSelection) {
      el.focus();
      const RANGE = window.getSelection();
      RANGE.selectAllChildren(el);
      RANGE.collapseToEnd();
    } else if (document.selection) {
      const RANGE = document.selection.createTextRange();
      RANGE.moveToElementText(el);
      RANGE.collapse(false);
      RANGE.select();
    }
  }
  static pleaseBr() {
    let selection = window.getSelection(); // 获取光标的位置
    let range = selection.getRangeAt(0); // 获取选中的内容
    if (range.toString()) {
      // 有选中内容，换行是删除
      range.deleteContents();
    }
    // 不同系统平台换行符不同，使用<br>可以统一系统行为，发送消息时再将<br>替换成\n
    // 另外不使用<br>，粘贴到微信中会丢失换行。
    // let br = document.createTextNode("\n");
    let br = document.createElement("br");
    range.insertNode(br); // 插入换行
    Edit.restoreSelection(range, false);
  }
}
