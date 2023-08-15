<template>
  <div class="group-photo-wrapper">
    <div class="group-photo" v-if="userList.length">
      <user-photo
        v-for="accountId in userList"
        :key="accountId"
        :user="accountId"
        :length="1"
        class="group-photo-item"
      ></user-photo>
    </div>
    <div class="group-photo" v-if="hasDefault && !userList.length">
      <img
        src="@/assets/image/search/default_group.png"
        class="default-image"
        alt=""
      />
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "GroupPhoto",
  props: {
    group: {
      type: Object,
      default() {
        return {};
      }
    },
    hasDefault: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      userList: [],
      flag: 0,
      timeout: null
    };
  },
  created() {
    this.flag = 0;
    this.setGroupInfo();
  },
  mounted() {
    window.eventHub.$on("UpdateGroupMember", this.UpdateGroupMember);
  },
  beforeDestroy() {
    window.eventHub.$off("UpdateGroupMember", this.UpdateGroupMember);
  },
  watch: {
    group(val, oldVal) {
      this.setGroupInfo();
    },
    groupInfo: {
      handler() {
        this.setGroupInfo();
      }
    }
  },
  computed: {
    ...mapGetters({ GroupInfoMap: "GetGroups" }),
    groupInfo() {
      let info = this.GroupInfoMap[this.group.id] || {};
      return info;
    }
  },
  methods: {
    ...mapActions(["DeleteDialog"]),
    UpdateGroupMember(id) {
      const groupId = this.group.id;
      if (groupId === id) {
        setTimeout(() => {
          this.$service.groupInfoApi
            .call(this, { id: groupId })
            .then(res => {
              this.setUserList(res.data.data);
            })
            .catch(error => {});
        }, 300);
      }
    },
    setGroupInfo() {
      try {
        clearTimeout(this.timeout);
        const self = this;
        const groupId = this.group.id;
        if (this.GroupInfoMap[groupId]) {
          const groupDetail = this.GroupInfoMap[groupId];
          this.setUserList(groupDetail);
        } else if (!this.hasDefault) {
          ++this.flag;
          if (this.flag > 50) {
            this.UpdateGroupMember(groupId);
          } else {
            this.timeout = setTimeout(() => {
              this.setGroupInfo();
            }, 400);
          }
        }
      } catch (error) {}
    },
    setUserList(groupDetail) {
      let memberList = [];
      const groupMembers = groupDetail.groupMembers || [];
      let users = [...groupMembers] || [];
      memberList = users.splice(0, 3);
      memberList.unshift(groupDetail.owner);
      this.userList = memberList;
    }
  }
};
</script>

<style lang="scss" scoped>
.group-photo-wrapper {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  margin: 0 10px;
  .group-photo {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    height: 100%;
    border-radius: 100%;
    overflow: hidden;
    background-color: #f3f3f3;
    .group-photo-item {
      margin: 0;
      width: 49.5%;
      height: 49.5%;
      flex: 0 0 49.5%;
      border-radius: 0;
      &:nth-of-type(1) {
        border-right: 1px solid #fff;
      }
      &:nth-of-type(3) {
        border-right: 1px solid #fff;
        border-top: 1px solid #fff;
      }
      &:nth-of-type(4) {
        border-top: 1px solid #fff;
      }
      &:first-of-type {
        align-self: flex-start !important;
      }
      &:last-of-type {
        align-self: flex-end;
      }
    }
    .default-image {
      width: 100%;
      height: 100%;
    }
  }
}
</style>
