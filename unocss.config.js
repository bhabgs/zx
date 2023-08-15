import { defineConfig, presetUno, transformerVariantGroup } from "unocss";
import transformerDirective from "@unocss/transformer-directives";

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      black: "#1F2329",
      primary: "#3E7EFF",
      primaryActive: "#2E6BE6",
      danger: "#FA4141",
      dangerActive: "#DD3636",
      split: "#E7E7E7",
      grayDark: "#5D616B",
      grayLight: "#F4F6F8",
    },
  },
  rules: [["gutter-stable", { "scrollbar-gutter": "stable" }]],
  transformers: [transformerDirective(), transformerVariantGroup()],
  shortcuts: [],
  safelist: [],
});
