import { Util } from "../plugin";
const { randomNumber } = Util;
const COLORS = [
  "#4598f0",
  "#85c4ff",
  "#dddc6e",
  "#f0b5fa",
  "#f8aeb2",
  "#99b9f7",
  "#8eda90",
];
const randombgcolor = {
  inserted(el, binding) {
    const index = binding.value.val
      ? binding.value.val % 7
      : randomNumber(0, 6);
    const color = COLORS[index];
    if (el.tagName !== "IMG") {
      el.style.backgroundColor = color;
      el.style.color = "#fff";
    }
  },
};

export default {
  name: "randombgcolor",
  instance: randombgcolor,
};
