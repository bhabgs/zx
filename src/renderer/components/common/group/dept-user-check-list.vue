<template>
  <ul class="dept-user-check-list" v-loading="isLoading">
    <check-row
      class="dept-item"
      v-for="row in showData.depts"
      :checked="checkedObj[`${row.corpId}-${row.id}`]"
      @checked="toggleDept"
      :data="row"
      :key="`dept-${row.id}`"
      @go="e => handleDeptInnerClick(e, row)"
    >
      <div
        :class="[
          'dept-check-inner',
          { checked: checkedObj[`${row.corpId}-${row.id}`] }
        ]"
        @click="handleDeptInnerClick($event, row)"
      >
        <mask-icon name="dept" size="16" />
        <span class="name">{{ row.name }}</span>
        <span class="count">{{ row.userCnt }}人</span>
      </div>
    </check-row>
    <check-row
      v-for="user in showData.users"
      :key="`user-${user.accountId}`"
      class="user-item"
      :data="user"
      :multipleSelect="multipleSelect"
      :checked="checkedObj[`${user.accountId}`]"
      :disabled="disabledObj[`${user.accountId}`]"
      @checked="toggleUser"
    >
      <div class="user-check-inner">
        <user-photo :user="user" :key="user.accountId"></user-photo>
        {{ user.name }}
      </div>
    </check-row>
  </ul>
</template>
<script>
import checkRow from "./check-row.vue";
export default {
  components: { checkRow },
  name: "DeptUserCheckList",
  props: ["isLoading", "showData", "type", "checkedObj", "disabledObj", "multipleSelect"],
  methods: {
    toggleDept(dept) {
      this.$emit("toggle-dept", { ...dept, isDept: true });
    },
    toggleUser(user) {
      this.$emit("toggle-user", { ...user, isUser: true });
    },
    handleDeptInnerClick(e, dept) {
      e.stopPropagation();
      const { id, corpId } = dept;
      if (this.checkedObj[`${corpId}-${id}`]) return;
      this.$emit("changeDept", dept);
    }
  }
};
</script>
<style lang="scss" scoped>
@mixin flex($justify: flex-start, $align: center) {
  display: flex;
  justify-content: $justify;
  align-items: $align;
}
$--padding-right-or-left: 14px;
.dept-user-check-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  .select-right-item {
    width: 100%;
    @include flex();
    height: 32px;
    img {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }
    border-bottom: 1px solid #f0f0f0;
    box-sizing: border-box;

    .select-item-name {
      flex: auto;
      margin-left: 8px;
      display: flex;
      align-items: center;
      font-size: 14px;
      color: #5d616b;
      cursor: pointer;
      > button {
        font-size: 12px;
        color: #8f959e;
        margin-left: auto;
        .iconfont {
          font-size: 12px;
          color: #bdc0c6;
          margin-right: 16px;
        }
      }
      &.disabale-select {
        color: #3e7eff;
      }
      &.select-item-name-outsource {
        &.disabale-select {
          color: #36d18e;
        }
      }
    }
    .group-title {
      padding-left: $--padding-right-or-left;
      &.select-item-name {
        margin-left: 0;
      }
    }
  }
  .select-right-user {
    height: 40px;
    .user-photo {
      width: 24px;
      height: 24px;
      flex: 0 0 24px;
      font-size: 10px;
    }
  }
  .select-right-title {
    flex-wrap: wrap;
    padding: {
      top: 10px;
      bottom: 10px;
      left: $--padding-right-or-left;
    }
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    border-top: 1px solid #f0f0f0;
    border-bottom: 5px solid #eee;
    .defaultTitle {
      display: inline-block;
      width: 6px;
      height: 15px;
      background: #4498f0;
      margin: 0 8px;
    }
    a {
      flex: none;
      font-size: 14px;
      text-decoration: none;
      color: #269ae8;
      font-weight: bold;
      &:not(:first-of-type) {
        &::before {
          display: inline-block;
          content: "∧";
          padding: 0 2px;
          color: #666;
          font-size: 10px;
          transform: rotateZ(90deg);
        }
      }
      &:last-of-type {
        color: #999;
      }
    }
  }
}
.dept-item {
  line-height: 32px;
}
.dept-item,
.user-item {
  box-shadow: inset 0px -1px 0px 0px #f4f6f8;
}
.user-item {
  gap: 8px;
}
.dept-check-inner {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  .name {
    flex: 1;
    color: #5d616b;
  }
  .count {
    font-size: 10px;
    color: #8f959e;
    position: relative;
    left: 8px;
  }
  &.checked {
    cursor: default;
    .name {
      color: var(--color);
    }
    .count {
      color: var(--color);
    }
  }
}
.user-check-inner {
  display: flex;
  align-items: center;
  height: 40px;
  font-size: 12px;
  .user-photo {
    width: 24px;
    height: 24px;
    flex: 0 0 24px;
    font-size: 10px;
    margin: 0 8px 0 0;
  }
}
</style>
