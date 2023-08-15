<template>
  <span
    class="inline-block bg-current bg-no-repeat"
    :style="{
      maskImage: `url(${svgPath})`,
      maskRepeat: 'no-repeat',
    }"
  />
</template>
<script>
export default {
  name: "SvgIcon",
};
</script>
<script setup>
import { ref } from "vue";

const props = defineProps({
  name: String,
});

const svgPath = ref("");

import(`../../assets/svgicon/${props.name}.svg`)
  .then((m) => {
    svgPath.value = m.default;
  })
  .catch((e) => {
  });
</script>
