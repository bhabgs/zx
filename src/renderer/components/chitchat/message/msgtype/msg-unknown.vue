<template>
  <div class="msg-unknown">不支持的消息类型，可在手机上查看</div>
</template>
<script>
export default {
  name: "",
  components: {},
  data() {
    return {};
  },
  created() {},
  mounted() {},
  computed: {},
  watch: {},
  methods: {}
};
</script>
<style lang="scss" scoped>
.msg-unknown {
  user-select: none;
  font-size: 13px;
  padding: 10px 15px;
  max-width: 100%;
  word-break: break-all;
  word-wrap: break-word;
  white-space: pre-wrap;
  color: #999;
}
</style>