<template>
  <div class="flex flex-col h-full" v-show="show">
    <!-- <div class="h-12 bg-#4B87FF" style="-webkit-app-region:drag"></div> -->
    <base-header />
    <aside-webview ref="webview" v-bind="$attrs" name="zhiwen" isZhiwen class="flex-1" />
    <!-- <webview-control :option="{url:$attrs.url}" /> -->
  </div>
</template>
<script>
export default {
  name: "ZhiwenWrapper",
};
</script>
<script setup>
import { ref, watch } from "vue";
import AsideWebview from "@/views/aside-webview";
const props = defineProps(["show"]);
const webview = ref(null);
watch(
  () => props.show,
  (v) => {
    if (v) {
      webview.value.init();
    }
  }
);
</script>
