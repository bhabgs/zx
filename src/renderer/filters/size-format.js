export default {
  name: "sizeformat",
  instance(size = 0) {
    switch (true) {
      case typeof size !== "number":
        break;
      case size < 1000:
        size = `${size} bytes`;
        break;
      case size < 1000000:
        size = `${(size / 1024).toFixed(2)} KB`;
        break;
      case size >= 1000000:
        size = `${(size / (1024 * 1024)).toFixed(2)} MB`;
        break;

      default:
        break;
    }

    return size;
  }
};
