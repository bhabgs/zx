<template>
  <div class="flex flex-col gap-6">
    <div>主题色</div>
    <div class="flex-1 flex flex-wrap gap-3.5">
      <div class="w-148px h-116px bg-cover flex items-end" :class="item.key === theme ? 'cursor-default' : 'cursor-pointer'"
        v-for="item in items" :style="{
          backgroundImage: `url(${item.bg})`,
        }" @click="setTheme(item.key)">
        <div class="flex items-center gap-1 h-9 !px-3">
          <img class="w-4 h-4"
            :src="require(`@/assets/image/chitchat/list-radio-${item.key === theme ? 'checked' : 'uncheck'}.png`)" />
          {{ item.name }}
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "ThemeColor",
};
</script>
<script setup>
import { ipcRenderer } from 'electron';
import { onMounted, ref } from 'vue'
const items = [
  { name: "经典蓝", key: "normal", bg: "./static/theme/card-normal.png" },
  { name: "深蓝", key: "dark", bg: "./static/theme/card-dark.png" },
];

const theme = ref('')

onMounted(async () => {
  theme.value = await ipcRenderer.invoke('get-theme')
})

const setTheme = (v) => {
  theme.value = v
  ipcRenderer.invoke('set-theme', v)
}

</script>
