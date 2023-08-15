import { computed, unref } from "vue";

export const imgList = [
  "徽章",
  "星星",
  "太阳",
  "重要",
  "紧急",
  "旗帜",
  "图钉",
  "一级",
  "二级",
  "三级",
];

const matchMap = {};
export const srcToName = {};
export const assetsMap = imgList.reduce((o, name) => {
  // todo env
  const src = `./static/storage-faces/${name}@2x.png`;
  o[name] = src;
  matchMap[`[${name}]`] = `<img src="${src}" />`;
  srcToName[src] = name;
  return o;
}, {});

const defaultOption = {
  delimiters: ["[", "]"],
};

export const getImgElementByTagText = (tag) => {
  const img = document.createElement("img");
  img.setAttribute("src", `./static/storage-faces/${tag}@2x.png`);
  return img;
};

export const getTagByImgElement = (img) => {
  const src = img.getAttribute("src");
  return src.match(/\/([^/]+)@2x.png$/)[1];
};

const matchText = imgList.map((i) => `\\[(${i})\\]`);
const matchExp = new RegExp(`(${matchText.join("|")})`, "g");
export const getHTMLByText = (text) =>
  text.replaceAll(matchExp, (match) => matchMap[match]);

export default (text, option) => {
  const mergeOption = { ...defaultOption, ...option };
  const { delimiters } = mergeOption;
  //   const [delimiterLeft, delimiterRight] = delimiters;
  const html = computed(() => getHTMLByText(unref(text)));
  return {
    html,
  };
};
