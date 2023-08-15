<!-- 联系人展示条目  -->
<template>
  <div class="search-contact-item" @click="selectPeopleHandle">
    <user-photo
      class="search-contact-item-avatar"
      :user="{ ...user, avatar: user.avatar || user.iconUrl }"
      :hasDefault="true"
    ></user-photo>
    <div class="search-contact-item-left">
      <div
        class="search-contact-item-user"
        :class="user.accountId.includes('robot_') ? 'my-12px pb-12px' : ''"
      >
        <div class="search-contact-item-user-name " v-html="showName"></div>
        <img
          class="certified-img"
          v-if="!user.accountId.includes('robot_') && isCertified == 1"
          src="~@/assets/visitor/has-certified.png"
          alt
        />
        <!-- 个人详情弹窗 -->
        <el-popover
          v-if="!user.accountId.includes('robot_')"
          placement="right"
          popper-class="contact-info-popper"
          width="292px"
          trigger="hover"
          @show="showUserInfoHandle"
          @hide="hideUserInfoHandle"
        >
          <user-pop-info
            v-if="showUser"
            class="user-detail-content"
            :user="user"
            :showChangeHead="false"
          ></user-pop-info>
          <el-button type="text" slot="reference"
            ><img
              class="show-people-info"
              src="~@/assets/image/search/person-card.png"
              alt=""
          /></el-button>
        </el-popover>
      </div>
      <div
        class="search-contact-item-info"
        v-if="!user.accountId.includes('robot_')"
      >
        <div class="search-contact-item-mobile" v-if="!!showMobile">
          <span>手机号：</span><span v-html="showMobile"></span>
        </div>
        <div
          class="search-contact-item-company"
          v-for="(item, index) in showCompanyList"
          :key="item.corpId"
        >
          <div class="search-contact-item-company-left">
            <div class="search-contact-item-company-left-name">
              <img
                :src="
                  require(`@/assets/image/search/${
                    item.type == 0 ? 'organization' : 'outsource'
                  }.png`)
                "
                alt=""
              />
              <span>{{ item.corpName || (item.corp && item.corp.name) }}</span>
            </div>
            <div
              v-show="item.isHide != 1"
              class="search-contact-item-company-left-deptName"
            >
              {{ item.deptName }}
            </div>
          </div>
          <div
            v-if="allCompanyList.length > 1 && index === 0"
            class="expand-more"
          >
            <img
              @click.stop="expand = !expand"
              :src="
                require(`@/assets/image/search/${
                  expand ? 'fold' : 'expand'
                }.png`)
              "
              alt=""
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import UserPopInfo from "../user/user-info";
export default {
  name: "SearchContactItem",
  components: { UserPopInfo },
  props: {
    user: {
      type: Object,
      default: () => {
        return {};
      }
    }
  },
  data() {
    return {
      expand: false,
      showUser: false
    };
  },
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany"
    }),
    showName() {
      if (this.user.searchResult.type.includes("name")) {
        return this.user.searchResult.name;
      } else {
        let name = this.user.name || this.user.nickName;
        return name;
      }
    },
    showMobile() {
      if (this.user.searchResult.type.includes("mobile")) {
        return this.user.searchResult.mobile;
      } else {
        return "";
      }
    },
    isCertified() {
      return this.user.isCertified;
    },
    allCompanyList() {
      let companyList = this.user.corpUsers || [];
      let result = [];
      result = companyList.map(item => {
        // isHide == 1隐藏人员,非隐藏人员才展示部门链路
        let { type, corpName, deptNameList, isHide, corpId, form } = item;
        if (item.corp) {
          corpName = item.corp.name;
        }
        if (type == null || type == undefined) {
          type = form;
        }
        if (type == 1 && item.serviceType == 1) {
          corpName += " 的公司服务人员";
        } else if (type == 1 && item.serviceType == 0) {
          corpName += " 我的服务公司";
        }
        return {
          corpId,
          type, // 0 组织 1外协
          corpName,
          deptName: (deptNameList && deptNameList[0]) || corpName,
          isHide
        };
      });
      const index = result.findIndex(corp => {
        return (
          this.GetCompany &&
          this.GetCompany.corp &&
          corp.corpId === this.GetCompany.corp.id
        );
      });
      if (index >= 0) {
        // 如果存在当前选中的公司则放在最前面
        const currentCompany = result.splice(index, 1);
        result.unshift(...currentCompany);
      }
      return result;
    },
    showCompanyList() {
      if (!this.expand) {
        return this.allCompanyList.slice(0, 1);
      } else {
        return [...this.allCompanyList];
      }
    }
  },
  methods: {
    selectPeopleHandle() {
      if (this.user.accountId.includes("robot_")) {
        this.$emit("selectHandle", {
          ...this.user,
          type: "robot"
        });
      } else {
        this.$emit("selectHandle", {
          type: "contact",
          id: this.user.accountId
        });
      }
    },
    showUserInfoHandle() {
      this.showUser = true;
    },
    hideUserInfoHandle() {
      this.showUser = false;
    }
  }
};
</script>

<style lang="scss" scoped>
.search-contact-item {
  display: flex;
  padding: 12px;
  padding-bottom: 0;
  cursor: pointer;
  * {
    line-height: 1;
  }
  &:hover {
    background: #f0f5ff;
    border-radius: 4px;
  }
  .search-contact-item-avatar {
    margin: 0 8px 0 0;
    flex-shrink: 0;
  }
  .search-contact-item-left {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    .search-contact-item-user {
      display: flex;
      align-items: center;

      .search-contact-item-user-name {
        font-size: 16px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        max-width: calc(100% - 70px);
      }
      .certified-img {
        width: 40px;
        height: 16px;
        margin-left: 8px;
      }
      > span {
        margin-left: auto;
        .el-button {
          padding: 0;
        }
        img {
          width: 24px;
          height: 24px;
        }
      }
    }
    .search-contact-item-info {
      margin-top: 8px;
      border-bottom: 1px solid #e7e7e7;
      padding-bottom: 12px;
      .search-contact-item-mobile {
        font-size: 12px;
        font-family: PingFangSC-Regular, PingFang SC;
        font-weight: 400;
        color: #8f959e;
        margin-bottom: 12px;
      }
      .search-contact-item-company {
        // margin-bottom: 13px;
        display: flex;
        align-items: flex-end;
        &-left {
          &-name {
            img {
              width: 24px;
              height: 14px;
              margin-right: 4px;
            }
            span {
              font-size: 12px;
              font-family: PingFangSC-Regular, PingFang SC;
              font-weight: 400;
              color: #1f2329;
            }
          }
          &-deptName {
            line-height: 1.5;
            margin-top: 8px;
            font-size: 12px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            color: #8f959e;
          }
        }
        ::v-deep .expand-more {
          cursor: pointer;
          margin-left: auto;
          img {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
}
</style>
<style>
.contact-info-popper {
  padding: 0 !important;
}
</style>
