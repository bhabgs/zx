/**
 * Change the scroll axis.
 * @param {Node Event} [eve]
 */
function horizontalWheel(eve) {
  if (!eve.deltaX && eve.preventDefault) {
    eve.preventDefault();
  }
  if (!eve.deltaX) {
    this.scrollLeft += eve.deltaY;
  }
}

/**
 * Mouse horizontal scroll command
 * use: v-horwheel
 */
export default {
  name: "horwheel",
  instance: {
    bind(node) {
      if (node === undefined) {
        return false;
      }
      node.addEventListener("wheel", horizontalWheel, false);
    },
    unbind(node) {
      if (node === undefined) {
        return false;
      }
      node.removeEventListener("wheel", horizontalWheel, false);
    }
  }
};
