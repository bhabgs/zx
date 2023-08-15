<template>
  <section class="contact-list">
    <organization-outsource :active="activeIndex" :btnList="btnList" @changeListType="goToPage"></organization-outsource>
    <div class="content-wrapper">
      <div
        class="my-group"
        @click="selectGroup"
        :class="
          showGroup
            ? `active-${activeIndex == 0 ? 'organization' : 'outsource'}`
            : ''
        "
      >
        <img src="@/assets/image/contacts/mygroup.png" alt />
        我的{{ activeIndex === 0 ? "组织" : "外联" }}群组
        <span>{{ groupSum }}</span>
      </div>
      <organization-list
        :contactType="activeIndex == 0 ? 'organization' : 'outsource'"
        :showGroup="showGroup"
        @showEmptyCompany="showEmptyCompany"
      ></organization-list>
    </div>
  </section>
</template>
<script>
// import Organizational from "@/components/contacts/organizational"; // 组织架构
import GroupList from "@/components/contacts/group-list"; // 群组
import OrganizationList from "@/components/contacts/organization-list";
import OrganizationOutsource from "@/components/common/organization-outsource";
import { mapGetters } from "vuex";
export default {
  name: "ContactList",
  components: {
    OrganizationList,
    OrganizationOutsource,
    GroupList
  },
  props: {
    showGroup: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      btnList: [
        { name: "组织", icon: "organization", key: "organization" },
        { name: "外联", icon: "outsource", key: "outsource" }
      ],
      groupSum: 0
    };
  },
  created() { },
  mounted() {
    this.getGroupSum();
  },
  computed: {
    ...mapGetters(["GetCompany"]),
    activeIndex() {
      let result = 0;
      this.btnList.some((item, index) => {
        if (item.key === this.$route.params.id) {
          result = index;
          return true;
        }
      });
      return result;
    }
  },
  watch: {},
  methods: {
    goToPage(config) {
      this.$emit("changeListType", config.key);
      if (this.$route.params.id != config.key) {
        sessionStorage.setItem("contacts-route-id", config.key);
        this.$router.push({ name: "Contacts", params: { id: config.key } });
        this.getGroupSum();
      }
    },
    async getGroupSum() {
      try {
        const res = await this.$service.getGroupSumByType({
          accountId: this.GetCompany.accountId,
          type: this.activeIndex == 0 ? 0 : 10
        });
        this.groupSum = res || 0;
      } catch (error) {
        this.groupSum = 0;
      }
    },
    selectGroup() {
      this.$emit("selectGroup");
    },
    showEmptyCompany() {
      this.$emit("showEmptyCompany");
    }
  }
};
</script>
<style lang="scss" scoped>
@import "~@/assets/styles/constant";

.contact-list {
  width: 100%;
  height: 100%;
  background-color: #fff;
  .content-wrapper {
    width: 100%;
    height: calc(100% - 40px);
    overflow: hidden;
    .my-group {
      height: 56px;
      display: flex;
      padding-left: 16px;
      align-items: center;
      font-size: 14px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #333333;
      cursor: pointer;
      border-bottom: 1px solid #e7e7e7;
      img {
        width: 32px;
        height: 32px;
        margin-right: 8px;
      }
      span {
        margin-left: auto;
        margin-right: 16px;
      }
      &.active-organization {
        color: #fff;
        background: linear-gradient(
          90deg,
          rgba(62, 126, 255, 0.8) 0%,
          #3e7eff 100%
        );
      }
      &.active-outsource {
        background-color: #36d18e;
        color: #fff;
      }
    }
  }
}
</style>
