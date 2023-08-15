<template>
  <span
    class="group-sign"
    :class="groupType.class"
    v-if="groupType.text"
    v-text="groupType.text"
  ></span>
</template>
<script>
export default {
  name: "GroupSign",
  components: {},
  props: {
    type: Number // 群组类型
  },
  data() {
    return {};
  },
  created() {},
  mounted() {},
  computed: {
    groupType() {
      let result = { text: "", class: "" };
      // 暂时取消群标签 by 李孝威 2020-12-28
     /*  switch (this.type) {
        case 1:
          result = { text: "全员", class: "all-type" };
          break;
        case 2:
          result = { text: "部门", class: "dept-type" };
          break;
        case 3:
          result = { text: "内部", class: "inside-type" };
          break;
        case 4:
          result = { text: "外部", class: "outside-type" };
          break;
      } */
      return result;
    }
  },
  watch: {},
  methods: {}
};
</script>
<style lang="scss" scoped>
.group-sign {
  flex-shrink: 0;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  margin: 0 8px;
  width: 20px;
  height: 14px;
  border: 1px solid rgba(59, 204, 128, 1);
  border-radius: 2px;
  font-size: 8px;

  @mixin type-style($color) {
    color: $color;
    border-color: $color;
  }

  &.all-type {
    @include type-style(#85c3fc);
  }
  &.dept-type {
    @include type-style(#3bcc80);
  }
  &.inside-type {
    @include type-style(#ffa200);
  }
  &.outside-type {
    @include type-style(#ff6969);
  }
}
</style>
