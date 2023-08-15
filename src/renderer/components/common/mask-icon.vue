<template>
  <span
    class="mask-icon"
    :style="{
      ['--size']: size || 16,
      ['--rotate']: rotate || 0,
      ...(name && {
        maskImage: `url(${require(`@/assets/image/mask/${name}.svg`)})`
      }),
      ...(color && { ['--color']: color })
    }"
  ></span>
</template>
<script>
export default {
  name: "MaskIcon",
  props: {
    name: String,
    color: String,
    size: [Number, String],
    rotate: [Number, String]
  }
};
</script>
<style scoped>
.mask-icon {
  display: inline-block;
  background-color: var(--color, #000);
  width: calc(var(--size) * 1px);
  height: calc(var(--size) * 1px);
  transform: rotate(calc(var(--rotate) * 1deg));
}
</style>
