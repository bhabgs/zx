<template>
  <div class="user-pop-info" v-loading="loading" @click="clickHandle">
    <div class="user-pop-header">
      <user-photo
        class="user-img"
        :user="userInfo"
        @click.native="previewAvatar"
      ></user-photo>
      <el-button
        v-show="showChangeHead && userInfo.id === GetUser.id"
        id="pick-avatar"
        class="change-avatar"
        icon="el-icon-camera-solid"
      ></el-button>
      <avatar-cropper
        @uploading="handleUploading"
        trigger="#pick-avatar"
        upload-url="/oss/v1/image/upload"
      ></avatar-cropper>
      <div class="user-basic-right">
        <div class="user-basic-right-name">
          {{ userName }}
          <img
            class="certified-img"
            v-if="userInfo.isCertified == 1"
            src="~@/assets/visitor/has-certified.png"
            alt
          />
          <img
            class="vip-img"
            v-if="userInfo.isVip == 1"
            src="~@/assets/visitor/registe-vip.png"
            alt
          />
          <img
            class="vip-img"
            v-if="userInfo.isVip == 2"
            src="~@/assets/visitor/normal-vip.png"
            alt
          />
        </div>
        <div class="user-basic-right-position" v-if="corpName">
          {{ corpName }}
        </div>
      </div>
    </div>
    <div v-if="hasTab" class="show-tab" id="user-info-tab">
      <div class="tab-content">
        <div
          class="org-item"
          :class="showType == 'org' ? 'active' : ''"
          @click.stop="selectShowType('org')"
        >
          组织信息
        </div>
        <div
          class="out-item"
          :class="showType == 'out' ? 'active' : ''"
          @click.stop="selectShowType('out')"
        >
          外联信息
        </div>
      </div>
    </div>
    <div class="user-pop-body" id="user-pop-body">
      <ul v-show="userDetail.visibleState == '1'">
        <li v-for="item of getShowCurrentInfos" :key="item.corpName">
          <div class="user-detail-block">
            <div class="title">
              <p class="text">
                <img
                  :src="
                    require(`@/assets/image/contacts/company${
                      item.form == 0 ? '' : '_outsource'
                    }_small.png`)
                  "
                  alt
                />
                {{ item.corpName || "暂无" }}
              </p>
            </div>
            <div class="info" v-if="item.visibleState">
              <info-item
                v-for="(info, index) in item.infos"
                :show="isShow"
                :info="info"
                :key="index + '' + item.key"
              ></info-item>
            </div>
            <div class="user-no-auth" v-else>
              <img src="@/assets/image/contacts/no_auth_show1.png" alt />
              <!-- <p class="user-no-auth-tip">
                <img src="@/assets/image/contacts/lock.png" alt />
                <span>暂未公开</span>
              </p>-->
            </div>
          </div>
        </li>
      </ul>
      <div
        class="user-no-auth"
        v-show="!loading && userDetail.visibleState != 1"
      >
        <img src="@/assets/image/contacts/no_auth_show1.png" alt />
        <!-- <p class="user-no-auth-tip">
          <img src="@/assets/image/contacts/lock.png" alt />
          <span>暂未公开</span>
        </p>-->
      </div>
      <div
        class="user-no-data"
        v-show="
          !loading && userDetail.visibleState == 1 && getShowInfos.length <= 0
        "
      >
        <img src="@/assets/image/chitchat/no_data.png" alt />
        <div class="user-no-data-tip">
          <div v-if="userInfo.id === GetUser.id" class="create-company-tip">
            <div>您还没有任何企业，去手机端加入企业吧！</div>
            <div>
              您也可以
              <el-button type="text" @click="createCompany"
                >立即创建企业/团队</el-button
              >
            </div>
          </div>
          <span v-else>暂无信息</span>
        </div>
      </div>
    </div>
    <div
      class="send-message"
      :class="
        (hasTab && showType == 'out') ||
        (!hasTab &&
          (userInfo.form == 1 ||
            (getShowInfos.length && getShowInfos[0].form == 1)))
          ? 'outsource'
          : ''
      "
      v-show="isSendMsg"
    >
      <button @click="handleSendMessage">发消息</button>
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import { ConversationModel } from "@/WebIM";
import { mapActions, mapGetters } from "vuex";
import InfoItem from "./info-item";
import moment from "moment";
import AvatarCropper from "vue-avatar-cropper";
export default {
  name: "UserPopInfo",
  props: {
    user: Object | String,
    onlyCorp: { type: String, default: "" },
    isStopEvent: { type: Boolean, default: false },
    showChangeHead: false
  },
  components: { InfoItem, AvatarCropper },
  data() {
    return {
      hideMeaasge: "已保密",
      userDetail: {},
      loading: false,
      userAvatar: undefined,
      showType: "org"
    };
  },
  mounted() {
    this.getUserInfo();
  },
  watch: {
    user: {
      deep: true,
      handler() {
        this.getUserInfo();
      }
    }
  },
  computed: {
    ...mapGetters({
      GetUser: "GetUser",
      AllUserMap: "GetAllUserMap",
      GetCompany: "GetCompany"
    }),
    userName() {
      let name = this.userInfo.name || this.userInfo.nickName;
      return name;
    },
    corpName() {
      let name = "";
      if (
        this.userDetail.visibleState == 1 &&
        this.getShowCurrentInfos.length
      ) {
        const corp = this.getShowCurrentInfos.find(
          item =>
            this.GetCompany &&
            this.GetCompany.corp &&
            item.corpId === this.GetCompany.corp.id
        );
        if (corp) {
          name = corp.corpName;
        } else {
          name = this.getShowCurrentInfos.length
            ? this.getShowCurrentInfos[0].corpName
            : "";
        }
      }
      return name;
    },
    isShow() {
      // 后台：isHide 0公开1隐藏
      if (this.userInfo.isHide != "1") {
        //公开
        return true;
      } else {
        //隐藏
        let self = this.user.id == this.userInfo.accountId;
        if (self) {
          //是本人
          return true;
        } else {
          //不是本人
          return false;
        }
      }
    },
    userInfo() {
      let userInfo = this.userDetail || {
        avatar: "",
        corpUsers: []
      };
      return userInfo;
    },
    emptyShow() {
      let result = "";
      result = this.userInfo.visibleState !== 1 ? "暂无权限" : "暂无";
      return result;
    },
    loginUserVip() {
      const user = this.GetUser;
      // insider==1;可见所有信息和发起群聊(可见信息)insider==0&&vipLevel=1；不可见信息（前端展示暂无权限）不可发起群聊（后台逻辑控制）insider==0&&vipLevel=2；仅可见自己不可发起群聊（后台逻辑控制）
      const hasAuth = user.insider == 1;
      return hasAuth;
    },
    getShowCurrentInfos() {
      let result = [];
      if (this.hasTab) {
        if (this.showType == "org") {
          result = this.getShowInfos.filter(item => item.form == 0);
        } else {
          result = this.getShowInfos.filter(item => item.form == 1);
        }
      } else {
        result = [...this.getShowInfos];
      }
      return result;
    },
    hasTab() {
      const orgList = this.getShowInfos.filter(item => item.form == 0);
      const outList = this.getShowInfos.filter(item => item.form == 1);
      return orgList.length && outList.length;
    },
    getShowInfos() {
      let result = [];
      const corpUsers = (this.userInfo.corpUsers || []).map(item => {
        if (
          this.user.labelType == "0" ||
          (item.corp && item.corp.canJoin == "1")
        ) {
          // 平台
          if (
            this.loginUserVip ||
            this.userInfo.id == this.GetCompany.accountId
          ) {
            // 平台有权限或是自己是可以看见
            item.visibleState = true;
          } else {
            item.visibleState = false;
          }
        } else {
          item.visibleState = true;
        }
        return item;
      });
      result = corpUsers.map(corpInfo => {
        let infos = [];
        let corpName = "";
        const corp = corpInfo.corp || {};
        const corpId = corp.id;
        if (this.user.labelType != "2" && corpInfo.serviceType != 1) {
          corpName = corp.name
            ? `${corpInfo.serviceType == 1 ? "服务公司-" : ""}${corp.name}`
            : "";
          if (corpInfo.visibleState) {
            infos.push({
              key: "电话:",
              value: this.userInfo.mobile || this.emptyShow
            });
            if (Array.isArray(corp.depts) && corp.depts.length) {
              // 有部门时循环添加部门信息
              let deptList = [...(corp.depts || [])];
              deptList.forEach(item => {
                infos.push({
                  key: "部门:",
                  value: item.longName || item.name || "暂无"
                });
                infos.push({
                  key: "职位:",
                  value: item.position || "暂无"
                });
              });
            } else {
              // 无部门信息时候显示信息
              infos.push({ key: "部门:", value: this.emptyShow });
              infos.push({ key: "职位:", value: this.emptyShow });
            }
            infos.push({
              key: "行业:",
              value:
                this.userInfo.industryList && this.userInfo.industryList.length
                  ? this.userInfo.industryList[0].industryName
                  : this.emptyShow
            });
            infos.push({
              key: "性别:",
              value:
                this.userInfo.gender == "F"
                  ? "女"
                  : this.userInfo.gender == "M"
                  ? "男"
                  : this.emptyShow
            });
            infos.push({
              key: corpInfo.type == 0 ? "入职时间:" : "加入时间:",
              value: corpInfo.createAt
                ? moment(Number(corpInfo.createAt)).format("YYYY年MM月DD日")
                : this.emptyShow
            });
          }
        } else {
          corpName = corp.name
            ? `${corpInfo.serviceType == 1 ? "服务公司-" : ""}${corp.name}`
            : "";
          if (corpInfo.visibleState) {
            infos.push({
              key: "标签：",
              type: "tag",
              value: corpInfo.tagsList || []
            });
            infos.push({
              key: "电话：",
              value: this.userInfo.mobile
            });
            infos.push({
              key: corpInfo.type == 0 ? "入职时间:" : "加入时间:",
              value: corpInfo.createAt
                ? moment(Number(corpInfo.createAt)).format("YYYY年MM月DD日")
                : this.emptyShow
            });
          }
        }
        return {
          infos: infos,
          corpName,
          form: corpInfo.form,
          corpId,
          visibleState: corpInfo.visibleState
        };
      });
      return result;
    },
    isSendMsg() {
      let flag =
        this.userInfo.externalContacts === 0 &&
        this.userInfo.visibleState === 1;
      return flag;
    }
  },
  methods: {
    ...mapActions([
      "PushDialogue",
      "SetOpenDialog",
      "setAllUser",
      "SetChitchatType",
    ]),
    createCompany() {
      this.$emit("hidePop");
      this.$root.$emit("createCompany");
    },
    /**
     * 获取用户信息
     */
    getUserInfo() {
      if (!this.user.accountId) {
        this.user.accountId = this.user.id;
      }
      if (this.user && this.user.accountId) {
        this.loading = true;
        const accountId = this.user.accountId || this.user;
        this.$service.getAccountInformationOrganization
          .call(this, { id: accountId })
          .then(res => {
            if (res) {
              if (this.onlyCorp) {
                let corpUsers = res.corpUsers.filter(
                  item => item.corpId == this.onlyCorp
                );
                this.userDetail = { ...res, accountId, corpUsers };
              } else {
                this.userDetail = { ...res, accountId };
              }
            } else {
              this.userDetail = {
                avatar: "",
                corpUsers: []
              };
            }
          })
          .catch(error => {
            this.userDetail = {
              avatar: "",
              corpUsers: []
            };
          })
          .finally(() => {
            // setTimeout(() => {
            this.loading = false;
            // }, 200);
          });
      } else {
        this.userDetail = this.user;
      }
    },
    handleSendMessage() {
      this.$emit("hidePop");
      const groupType = this.userInfo.type || this.userInfo.form;
      let dialogue = new ConversationModel.IMConversation(
        {
          id: this.userInfo.id,
          avatar: this.userInfo.avatar,
          name: this.userName,
          corpId: this.userInfo.corpId,
          groupType: groupType == 0 ? 0 : 10
        },
        ConversationModel.IMConversationEnum.PRIVATE
      );
      this.PushDialogue(dialogue);
      this.SetChitchatType(groupType == 0 ? "organization" : "outsource");
      this.SetOpenDialog({ ...dialogue });
      this.$router.push({
        name: "chitchat",
        query: { type: groupType == 0 ? "organization" : "outsource" }
      });
      window.eventHub.$emit("send-hander", {
        id: dialogue.id,
        conversationType: dialogue.conversationType
      });
    },
    clickHandle(e) {
      if (this.isStopEvent) {
        e.stopPropagation();
      }
    },
    //预览头像
    previewAvatar() {
      if (this.userInfo.avatar) {
        let index = 0;
        let ImgMsgs = [];
        const tempData = {
          messageType: "ImageMessage",
          isEncrypt: false,
          isPub: true,
          thumb: this.userInfo.avatar,
          url: this.userInfo.avatar
        };
        ImgMsgs.push(tempData);
        ipcRenderer.invoke("show-media", {
          type: "image",
          index,
          list: ImgMsgs
        });
      }
    },
    //上传图片
    handleUploading(form, xhr) {
      let formData = new FormData();
      formData.append("image", form.get("file"));
      this.$service.ossUpload
        .call(this, formData)
        .then(async res => {
          if (res) {
            await this.changeAvatarHandle(res);
          }
        })
        .catch(error => {
          this.$message.error("上传图片失败！");
        });
    },
    //更换头像
    changeAvatarHandle(url) {
      const data = {
        id: this.userInfo.id,
        avatar: url
      };
      this.$service.changeAvatar
        .call(this, data)
        .then(async res => {
          if (res.code === "M0000") {
            await this.$service.getUserInfo();
            this.userInfo.avatar = url;
            let user = this.AllUserMap[this.userInfo.id];
            user.avatar = url;
            this.setAllUser({
              users: [user],
              needClear: false
            });
            this.$root.$emit("refreshAvatar", this.userInfo.id);
            this.$message.success("修改成功");
          }
        })
        .catch(error => {
          this.$message.error("更换头像失败！");
        });
    },
    selectShowType(showType) {
      this.showType = showType;
      this.$nextTick(() => {
        document.getElementById("user-pop-body").scrollTop = 0;
      });
    }
  }
};
</script>
<style lang="scss" scoped>
.user-pop-info {
  width: 320px;
  height: 440px;
  background: #f9f9f9;
  box-shadow: 0px 0px 10px 0px rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  .user-pop-header {
    height: 55px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 15px 20px 0 20px;
    box-sizing: border-box;
    background: #fff;
    .user-photo {
      margin: 0;
    }
    .user-basic-right {
      line-height: 1;
      margin-left: 15px;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      .user-basic-right-name {
        font-size: 14px;
        color: #000;
        margin-bottom: 4px;
        flex-shrink: 0;
        height: 50%;
        display: flex;
        align-items: flex-end;
        img {
          height: 12px;
          margin-left: 4px;
        }
        .certified-img {
          width: 30px;
        }
        .vip-img {
          width: 62px;
        }
      }
      .user-basic-right-position {
        min-height: 10px;
        flex: 1;
        overflow: hidden;
        font-size: 10px;
        color: #999999;
        display: flex;
        align-items: flex-start;
      }
    }
    .change-avatar {
      padding: 0;
      border-radius: 50%;
      font-size: 12px;
      width: 16px;
      height: 16px;
      position: absolute;
      right: 256px;
      top: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .show-tab {
    background: #fff;
    .tab-content {
      height: 24px;
      margin: 16px;
      margin-bottom: 0;
      display: flex;
      width: 128px;
      align-items: center;
      border-radius: 4px;
      border: 1px solid #e7e7e7;
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #8f959e;
      > div {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        height: 100%;
        &.active {
          color: #fff;
        }
        &.org-item {
          border-radius: 4px 0px 0px 4px;
          &.active {
            background: #3e7eff;
          }
        }
        &.out-item {
          border-radius: 0px 4px 4px 0px;
          &.active {
            background: #36d18e;
          }
        }
      }
    }
  }
  .user-pop-body {
    flex: 1;
    overflow-y: auto;
    background: #fff;
    > ul {
      padding: 0 20px;
      box-sizing: border-box;
      > li {
        border-bottom: 1px solid #e7e7e7;
        &:nth-last-child(1) {
          border-bottom: none;
        }
        .user-detail-block {
          .title {
            font-size: 14px;
            color: #333333;
            position: relative;
            margin: 16px 0;
            display: flex;
            align-items: center;
            // &::before {
            //   content: "";
            //   width: 4px;
            //   height: 10px;
            //   background-color: #4498f0;
            //   position: absolute;
            //   top: 5px;
            //   left: 0;
            // }
            img {
              width: 14px;
              height: 14px;
              margin-right: 8px;
            }
            .text {
              min-height: 20px;
              display: flex;
              align-items: center;
            }
          }
        }
      }
    }
  }
  .user-no-data,
  .user-no-auth {
    width: 192px;
    height: auto;
    position: relative;
    margin: 15px 30px;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    img {
      width: 100%;
      height: 100%;
    }
    p {
      width: 124px;
      height: 24px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #1f2329;
      background: #f4f6f8;
      position: absolute;
      top: 64px;
      left: 44px;
      img {
        width: 14px;
        height: 14px;
        margin-right: 8px;
      }
    }
    &.user-no-data {
      width: 100%;
      margin: 0;
      margin-top: 16px;
      font-size: 14px;
      font-family: PingFangSC-Regular, PingFang SC;
      font-weight: 400;
      color: #8f959e;
      .user-no-data-tip {
        .create-company-tip {
          font-size: 12px;
          font-family: PingFangSC-Regular, PingFang SC;
          font-weight: 400;
          color: #8f959e;
          > div {
            margin-top: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            ::v-deep .el-button {
              padding: 0;
              span {
                font-size: 12px;
                color: #3e7eff;
              }
            }
          }
        }
      }
      img {
        width: 100%;
        height: 130px;
      }
    }
  }
  .send-message {
    height: 60px;
    line-height: 60px;
    text-align: center;
    background: #fff;
    > button {
      border-radius: 2px;
      width: 280px;
      height: 34px;
      line-height: 34px;
      background: #3e7eff;
      color: #fff;
      border-radius: 4px;
    }
    &.outsource {
      > button {
        background: #36d18e;
      }
    }
  }

  .no-auth-show {
    margin-top: 50%;
    transform: translateY(-50%);
    text-align: center;
    color: #999;
  }
}
::v-deep.avatar-cropper {
  .avatar-cropper-overlay {
    background: rgba(0, 0, 0, 0.5) !important;
    .avatar-cropper-container {
      border-radius: 0 0 4px 4px;
    }
    .avatar-cropper-mark {
      position: static;
      background: none;
      position: relative;
      top: -230px;
      left: 450px;
      display: none;
    }
    .avatar-cropper-close {
      padding: 0;
    }
    .avatar-cropper-btn:last-of-type {
      color: #4498f0;
    }
    .avatar-cropper-btn:hover {
      background-color: #ffffff !important;
      color: #1575db !important;
      border-radius: 0 0 4px 4px;
    }
    .avatar-cropper-image-container {
      height: 400px;
      width: 400px;
    }
    .cropper-container.cropper-bg {
      height: 400px;
      background-image: none;
      background: #333;
    }
    @media screen and (min-width: 860px) and (max-width: 900px) {
      ::v-deep.avatar-cropper-image-container {
        height: 350px !important;
        width: 350px !important;
      }
      ::v-deep.cropper-container.cropper-bg {
        height: 350px !important;
      }
    }
  }
}
</style>
