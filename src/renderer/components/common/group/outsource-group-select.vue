<template>
  <div class="outsource-group-select">
    <organization-outsource is-select :active="activeIndex" :btnList="btnList" @changeListType="goToPage"></organization-outsource>
    <organization-list
      :contactType="activeIndex == 0 ? 'organization' : 'outsource'"
      showType="group"
      showArrow
    ></organization-list>
  </div>
</template>

<script>
import OrganizationOutsource from "@/components/common/organization-outsource";
import OrganizationList from "@/components/contacts/organization-list";
export default {
  name: "OutsourceGroupSelect",
  components: {
    OrganizationOutsource,
    OrganizationList
  },
  props: ["type"],
  data() {
    return {
      activeIndex: 1,
      btnList: [
        { name: "组织", icon: "organization", key: "organization" },
        { name: "外联", icon: "outsource", key: "outsource" }
      ]
    };
  },
  beforeDestroy() {
    this.$root.$off("showGroupCompanyDept", this.showCompanyDept);
    this.$root.$off("selectGroupCompany", this.selectCompany);
  },
  mounted() {
    if(this.type) {
      this.activeIndex = this.btnList.findIndex(item => item.key === this.type)
    }
    this.$root.$on("showGroupCompanyDept", this.showCompanyDept);
    this.$root.$on("selectGroupCompany", this.selectCompany);
  },
  methods: {
    goToPage(config) {
      const index = this.btnList.findIndex(item => item.key === config.key);
      this.activeIndex = index;
      this.$emit(
        "currentType",
        this.activeIndex == 0 ? "organization" : "outsource"
      );
    },
    showCompanyDept(company) {
      this.$emit("showCompanyDept", company);
    },
    selectCompany(company) {
      this.$emit("selectCompany", company);
    }
  }
};
</script>

<style lang="scss">
.outsource-group-select {
  flex: 1;
  overflow: hidden;
  padding-top: 16px;
  .organization-outsourtce-header {
    border-top: 1px solid #f0f0f0;
  }
}
</style>
