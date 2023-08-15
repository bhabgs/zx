export default {
  name: "groupTypeName",
  instance(type) {
    let name = "";
    switch (type) {
      case 1:
        name = "全员";
        break;
      case 2:
        name = "部门";
        break;
      case 3:
        name = "内部";
        break;
      case 4:
        name = "外部";
        break;
      case 10:
        name = "外联";
        break;

      default:
        break;
    }

    return name;
  }
};
