<template>
  <div class="main">
    <!-- <aside-menu
      :mailUnreadNum="mailUnreadCounts"
      :showMail="isShowMail"
      @createCompany="createCompanyHandle"
      @changActiveMail="changActiveMail"
    ></aside-menu> -->
    <new-aside-menu
      :mailUnreadNum="mailUnreadCounts"
      :showMail="isShowMail"
      :showZhiwen="isShowZhiwen"
      @createCompany="createCompanyHandle"
      @changActiveMail="changActiveMail"
    ></new-aside-menu>
    <section class="main-container">
      <keep-alive>
        <router-view
          v-if="isShowPanel.route && !showMailPanel"
          class="main-body"
        ></router-view>
      </keep-alive>
      <chat-notify
        v-show="isShowPanel.chat && !isShowPanel.notifyOnly && !showMailPanel"
        class="main-body"
      ></chat-notify>
      <notify-only
        v-show="isShowPanel.notifyOnly && !showMailPanel"
        class="main-body"
      ></notify-only>
      <open-panel
        v-show="isShowPanel.open && !showMailPanel"
        class="main-body"
        @refreshApps="refreshApps"
      ></open-panel>
      <zhiwen-wrapper
        key="zhiwen"
        class="main-body"
        :show=" isShowPanel.zhiwen && !showMailPanel"
        v-if="isShowZhiwen && net_type != 2"
        :url="showZhiwen.pcHomePageUrl"
        :type="showZhiwen.type" />
      <aside-webview
        key="mail"
        ref="mailContent"
        v-if="isShowMail && net_type != 2"
        v-show="showMailPanel"
        :url="showMail.pcHomePageUrl"
        :type="showMail.type"
        name="Mail"
        @refreshMailRead="refreshMailRead"
        class="main-body"
      ></aside-webview>
    </section>
    <el-alert
      v-if="isNetWorkWarn"
      class="network-warn"
      :title="alertConfig.text"
      :type="alertConfig.type"
      :closable="false"
      center
      show-icon
    ></el-alert>
    <!-- 创建群聊 -->
    <create-group-type
      :visible.sync="visibleSelectType"
      @closeCreate="closeCreateHandle"
    ></create-group-type>
    <create-group-dialog
      v-if="visibleCreate"
      :visible.sync="visibleCreate"
      :dialogOption="createGroupOpt"
      @closeHandle="closeHandle"
    ></create-group-dialog>
    <!-- <create-group
      :visible.sync="visibleCreate"
      :option="createGroupOpt"
    ></create-group>-->
    <create-company
      :visible="showCreateCompany"
      @closeCreateCompany="closeCreateCompany"
    ></create-company>
    <!-- 消息转发 -->
    <a-modal
      v-model="visibleTransmit"
      @cancel="cancelHandle"
      wrapClassName="transpond-modal"
      :maskClosable="false"
      :closable="true"
      :footer="null"
      width="690"
      destroyOnClose
    >
      <transmit-message-app
        @close="cancelHandle"
        :messageList="transmitMessageFromApp"
      >
      </transmit-message-app>
    </a-modal>
  </div>
</template>
<script>
import { mapGetters, mapActions } from "vuex";
import { ipcRenderer } from "electron";
import Vue from "vue";
import isOnline from "is-online";
window.isOnline = isOnline;

import { IMSDKServer, ConversationModel, MessageModel } from "../WebIM";

import { Util } from "@/plugin";
const { throttle } = Util;

import layouts from "@/components/layouts";
import OpenPanel from "@/views/open-panel";
import ZhiwenWrapper from "@/views/zhiwen-wrapper";
import ChatNotify from "@/views/chatNotify/chat-main";
import NotifyOnly from "@/views/chatNotify/notify-only";
import AsideWebview from "@/views/aside-webview";
import { IMConversationEnum } from "../WebIM/conversation/ConversationModel";
import WebSocket from "../plugin/websocket";
import AudioNotify from "../plugin/audio-notify";
import { PollingMailUnRead, PollingActionUnRead } from "../plugin/polling-notice";
import CreateGroupType from "../components/common/group/create-group-type.vue";
import CreateGroupDialog from "../components/common/group/create-group-dialog.vue";
import CreateCompany from "@/components/common/create-company.vue";
import TransmitMessageApp from "@/components/chitchat/transmit-message-app.vue"; // 从微应用转发消息到智信
import { TO_CHATGPT_PRIVAYE } from "@/config/chatGpt.config";
import { CHATGPT_PRIVAYE_ID } from "@/config/chatGpt.config";

let socketInstance = null; // websocket连接pulsar 实例
import { MessageBox } from "element-ui";
export default {
  name: "Main",
  beforeRouteEnter(to, from, next) {
    next();
  },
  components: {
    CreateGroupType,
    CreateGroupDialog,
    CreateCompany,
    ...layouts,
    OpenPanel,
    AsideWebview,
    ChatNotify,
    NotifyOnly,
    TransmitMessageApp,
    ZhiwenWrapper
  },
  data() {
    return {
      throttleNotice: "",
      grouPostFlag: 0,
      isNetWorkWarn: false, // 是否显示提示
      alertConfig: {
        text: "网络不可用",
        type: "warning"
      },
      visibleCreate: false, // 创建群窗口显示隐藏
      visibleSelectType: false, // 选择群聊类型
      createGroupOpt: {}, // 创建群参数
      timeoutCheckNetwork: null, // 网络状态监测定时任务
      showOfflineWarnTimeout: null, // 展示网络断开警告定时任务
      hintCount: 0, // 非免打扰未读数量
      mailUnreadCounts: {}, //智邮角标未读数
      hasOpenMail: false, //是否已打开智邮
      showCreateCompany: false,
      transmitMessageFromApp: [], // 从微应用转发的消息列表
      visibleTransmit: false, // 是否展示转发弹窗
      mailActive: null, // 1智邮2里程碑3我的任务
      showMailPanel: false,
      throttleRefreshAction: null,
    };
  },
  beforeRouteLeave(to, from, next) {
    if (to.fullPath === "/" || to.fullPath === "/login") {
      this.clearShowOfflineTimeout();
      this.timeoutCheckNetwork && clearTimeout(this.timeoutCheckNetwork);
      socketInstance && socketInstance.closeWS();
      next();
    }
    next();
  },
  created() {
    window.eventHub.$on("network-unavailable", this.networkUnavailable);
    window.eventHub.$on("loginim-success", this.onlineHandler);
    window.addEventListener("reconnect-im", this.loginWebIMToken);
    window.eventHub.$on("transimit-message-app", this.transmitMessageAppHandle);
  },
  mounted() {
    this.setCurrentTheme();
    if (Vue.prototype.net_type === undefined) {
      Vue.prototype.net_type = sessionStorage.getItem("net_type");
    }
    this.$nextTick(() => {
      ipcRenderer.send("gomain");
      ipcRenderer.invoke("create-operation-win");
      ipcRenderer.on("transimit-message-app", this.transmitMessageAppIpcHandle);
      ipcRenderer.on("set-theme", this.setCurrentTheme);
    });
    let self = this;
    this.isNetWorkWarn = false;
    this.throttleNotice = throttle(() => {
      self.MsgNoticePlayer();
      ipcRenderer.send("blink-remind", true);
    }, 100);
    if (this.net_type != "2") {
      this.$service.getAllSecret();
    }
    if (this.UserInfo.id) {
      this.$nextTick(async () => {
        if (this.net_type != "2") {
          await this.getConversationList();
          await this.updateStorageHandle();
        }
      });
      if (this.net_type != 2) {
        socketInstance = new WebSocket(this.UserInfo.id, this.$apipath.pulsar);
      }
    } else {
      this.$service.getUserInfo
        .call(this)
        .then(result => {
          if (result) {
            if (this.net_type != "2") {
              this.loginWebIMToken();
              socketInstance = new WebSocket(
                this.UserInfo.id,
                this.$apipath.pulsar
              );
            }
          } else {
            return Promise.reject();
          }
        })
        .catch(error => {});
    }

    window.eventHub.$on("KickedOffline", this.KickedOfflineHandle);

    this.$root.$on("create-group", data => {
      this.createGroupHandler(data);
    });

    this.$root.$on("createCompany", this.createCompanyHandle);

    if (this.isShowMail && this.net_type != 2) {
      PollingMailUnRead.startPulling();
    }

    // 设置节流函数
    this.throttleRefreshAction = throttle((data)=> {
      console.log(' -------- 调用接口：data = ', data);
      // 请求行动中心角标
      PollingActionUnRead.setupPolling(data);
    }, 1000);
    // 请求行动中心角标
    PollingActionUnRead.setupPolling();
    // 监听行动中心推送通知
    window.eventHub.$on("polling-action-unread", this.pollingActionUnread);

    window.addEventListener("dispath-app-push", this.appPushHandle);
  },
  beforeDestroy() {
    window.eventHub.$off("network-unavailable", this.networkUnavailable);
    window.eventHub.$off("loginim-success", this.onlineHandler);
    window.eventHub.$off("KickedOffline", this.KickedOfflineHandle);
    window.eventHub.$off(
      "transimit-message-app",
      this.transmitMessageAppHandle
    );
    window.eventHub.$off("polling-action-unread", this.pollingActionUnread);
    ipcRenderer.removeListener("transimit-message-app", this.transmitMessageAppIpcHandle);
    ipcRenderer.removeListener("set-theme", this.setCurrentTheme);

    window.removeEventListener("reconnect-im", this.loginWebIMToken);
    window.removeEventListener("dispath-app-push", this.appPushHandle);
    this.$root.$off("createCompany", this.createCompanyHandle);
  },
  computed: {
    ...mapGetters({
      UserInfo: "GetUser",
      HintFlag: "GetHintFlag",
      DialogMap: "GetDialogues",
      GetSendUser: "GetSendUser",
      getPrivateMsg: "getPrivateMsg",
      getGroupMsg: "getGroupMsg",
      LoginCompany: "GetCompany",
      ReminderMap: "GetReminderMap",
      IsHintMap: "GetIsHintMap",
      TopMap: "GetTopMap",
      GetMicroApps: "GetMicroApps",
      GetCompanyByRelate: "GetCompanyByRelate"
    }),
    allCompanyList() {
      let corp = [];
      for (const key in this.GetCompanyByRelate) {
        corp.push(...(this.GetCompanyByRelate[key] || []));
      }
      return corp;
    },
    isShowMail() {
      return !!Object.keys(this.showMail).length;
    },
    showMail() {
      let apps = this.GetMicroApps.listAppDTO || [];
      let temp =
        apps.find(item => item.name.includes("智邮") && item.status === 1) ||
        {};
      if (!!Object.keys(temp).length) {
        temp.type = this.mailActive;
        if (temp.pcHomePageUrl && temp.type) {
          temp.pcHomePageUrl += `${
            temp.pcHomePageUrl.includes("?") ? "&" : "?"
          }type=${temp.type}`;
        }
      }
      return temp;
    },
    isShowZhiwen() {
      return !!Object.keys(this.showZhiwen).length;
    },
    showZhiwen() {
      let apps = this.GetMicroApps.listAppDTO || [];
      let temp =
        apps.find(item => item.name.includes("智文") && item.status === 1) ||
        {};
        
      return temp
    },
    isShowPanel() {
      const routeName = this.$route.name;
      this.showMailPanel = false;
      const chat = this.$route.path.includes("chatNotify");
      const map = {
        chat,
        open: routeName == "Open",
        file: routeName == "File",
        okrs: routeName == "Okrs",
        notifyOnly: routeName == "notify",
        zhiwen: routeName == "zhiwen",
        route: !["Open", "Mail", "File", "Okrs"].includes(routeName) && !chat
      };
      return map;
    }
  },
  watch: {
    HintFlag(val, oldVal) {
      if (oldVal < val && this.throttleNotice) {
        this.throttleNotice();
      } else {
        ipcRenderer.send("blink-remind", false);
      }
    },
    LoginCompany: {
      deep: true,
      handler(newVal, oldVal) {
        if (newVal.corpId != oldVal.corpId) {
          this.SetMailUnReadCount([]);
          this.SetMicroApps([]);
          this.hasOpenMail = false;
          this.changeCompanying = true;
          PollingMailUnRead.stopPulling();
        }
      }
    },
    ReminderMap: {
      deep: true,
      handler(remindMap) {
        const groupRemind = remindMap.group;
        const privateRemind = remindMap.private;
        const groupIsHint = this.IsHintMap.group;
        const privateIsHint = this.IsHintMap.private;
        let sum = 0;
        for (const key in groupRemind) {
          !groupIsHint[key] && (sum += +groupRemind[key]);
        }

        for (const key in privateRemind) {
          !privateIsHint[key] && (sum += +privateRemind[key]);
        }
        if (this.hintCount !== sum) {
          this.hintCount = sum;
        }
      }
    }
  },
  methods: {
    ...mapActions([
      "setAllUser",
      "SetAllUserMap",
      "PushGroup",
      "UpdateDialog",
      "SaveAttribute",
      "SaveConversation",
      "SaveHistoryMessage",
      "SetNetWorkState",
      "SetNotifyList",
      "PushDialogue", //添加个人回话
      "AddDialogByKey", // 根据会话id增加会话
      "SetMicroApps", //清空微应用
      "SetMailUnReadCount" //清空未读数
    ]),
    setCurrentTheme(e, theme) {
      const themeInStore = localStorage.getItem('themeName')
      if (!e) {
        // mounted 初始设置
        this.setTheme(themeInStore || 'normal')
        ipcRenderer.invoke('set-theme', themeInStore || 'normal')
      } else if (theme !== themeInStore) {
        localStorage.setItem('themeName', theme)
        ipcRenderer.invoke('set-theme', theme)
        this.setTheme(theme)
      }
    },
    setTheme(theme) {
      const html = document.documentElement;
      switch(theme) {
        case 'normal': 
          html.style.setProperty('--theme-bg', '#4B87FF');
          html.style.setProperty('--theme-group-border', '#6094FF');
          html.style.setProperty('--theme-group-bg', '#3678FF');
          break;
        case 'dark':
          html.style.setProperty('--theme-bg', '#112C63');
          html.style.setProperty('--theme-group-border', '#395998');
          html.style.setProperty('--theme-group-bg', '#1C3872');
          break;
        default:
          break;
      }
      const themeBg = html.style.getPropertyValue('--theme-bg');
      ipcRenderer.invoke('set-theme-bg', themeBg);
      this.$refs.mailContent && this.$refs.mailContent.setThemeHeaderColor(themeBg);

    },
    changActiveMail(type) {
      if (type) {
        this.mailActive = type;
        this.showMailPanel = true;
        this.$refs.mailContent && this.$refs.mailContent.sendMailType(type);
      } else {
        this.showMailPanel = false;
      }
    },
    pollingActionUnread(data) {
      console.log(' -------- 收到消息：data = ', data);
      // 请求行动中心角标
      this.throttleRefreshAction && this.throttleRefreshAction(data);
    },
    transmitMessageAppHandle(messageList) {
      this.visibleTransmit = true;
      if (messageList.length) {
        this.transmitMessageFromApp = [...messageList];
      }
    },
    transmitMessageAppIpcHandle(_, messageList) {
      this.transmitMessageAppHandle(messageList)
    },
    cancelHandle() {
      this.visibleTransmit = false;
    },
    closeCreateCompany() {
      this.showCreateCompany = false;
    },
    createCompanyHandle() {
      this.showCreateCompany = true;
    },
    async updateStorageHandle() {
      // 获取收纳相关的数据
      // let sqliteUpdateTime =
      //   (await ipcRenderer.invoke("sqlite-query", {
      //     key: "indbTime",
      //     input: { id: "storage" },
      //   })) || {};
      // this.$service.getStorage.call(this, {
      //   startTime: (sqliteUpdateTime && sqliteUpdateTime.storage) || 0,
      // });
      // 增量接口存在问题，storage部分可以自己维护，但session部分不能增量，暂时退回全量
      this.$service.getStorage.call(this, {
        startTime: 0
      });
    },
    /**
     * 判断是否存在智邮
     */
    refreshApps(type) {
      if (this.isShowMail && this.net_type != 2) {
        //当前开微应用存在智邮且外网
        if (type == "companyChange") {
          // 当前切换公司时要开启轮询
          this.mailUnreadCounts = {};
          PollingMailUnRead.startPulling();
          if (this.showMailPanel) {
            // 切换公司已经打开智邮的需要重新打开智邮
            this.$nextTick(() => {
              this.$refs.mailContent && this.$refs.mailContent.init();
            });
          }
        }
      } else {
        // 不存在智邮内网时要停止轮徐
        PollingMailUnRead.stopPulling();
        if ((!this.isShowMail && this.showMailPanel) || this.isShowPanel.okrs) {
          this.$router.push({ name: "Empty" });
          this.mailActive = null;
          this.$router.push({ name: "chitchat" });
        }
      }
    },
    /**
     * 智邮未读数通知
     */
    refreshMailRead(counts) {
      this.hasOpenMail = true;
      PollingMailUnRead.stopPulling();
      this.mailUnreadCounts = counts || {};
    },
    MsgNoticePlayer() {
      AudioNotify.play();
    },
    loginWebIMToken(reconnect = false) {
      window.Logger.log({ message: "running loginWebIMToken", reconnect });
      try {
        IMSDKServer.logout();
      } catch (error) {}
      this.$service.getSecretKey
        .call(this)
        .then(result => {
          return this.$service.loginWebIM.call(this, {
            AppKey: result.data.appKey,
            token: this.UserInfo.imToken
          });
        })
        .then(res => {
          this.onlineHandler();

          if (!reconnect) {
            this.getAllData();
          }
        })
        .catch(error => {
          this.onlineHandler();
          this.$confirm("服务连接失败，请尝试重新登录", "提示", {
            confirmButtonText: "确定",
            type: "warning",
            showCancelButton: false
          })
            .then(() => {
              window.eventHub.$emit("logout");
            })
            .catch(() => {
              window.eventHub.$emit("logout");
            });
        });
    },
    async getAllData() {
      await this.getAllUsers();
      await this.getGroup();
      await this.getConversationList();
      // 登录成功后调用收纳组接口
      await this.updateStorageHandle();
    },
    getGroupAttribute() {
      this.$service.getGroupAttribute
        .call(this, { accountId: this.UserInfo.id })
        .then(result => {
          if (result) {
            this.SaveAttribute(result.data);
          }
        })
        .catch(error => {});
    },
    getConversationList() {
      this.$service.getConversationByIM().finally(() => {
        this.$service.createSelfConversation();
        this.checkTopDialog();
      });
    },
    checkTopDialog() {
      const { TopMap, DialogMap, AddDialogByKey } = this;
      for (const key in TopMap) {
        const dialogs = DialogMap[key] || {};
        const beIds = TopMap[key];
        for (const id in beIds) {
          if (!dialogs.hasOwnProperty(id)) {
            let type =
              key === "provate"
                ? IMConversationEnum.PRIVATE
                : IMConversationEnum.GROUP;
            AddDialogByKey({ key: id, type });
          }
        }
      }
    },
    getGroup(pageNum = 1) {
      this.$service.groupListApi
        .call(
          this,
          {
            accountId: this.UserInfo.id,
            pageNum,
            pageSize: 100
          },
          { timeout: 50000 }
        )
        .then(data => {
          if (data) {
            this.PushGroup(data.resultList);
            if (data.pageConfig && data.pageConfig.pages > pageNum) {
              setTimeout(() => {
                this.getGroup(pageNum + 1);
              }, 500);
            }
          }
        })
        .catch(error => {
          setTimeout(() => {
            if (this.grouPostFlag < 3) {
              ++this.grouPostFlag;
              this.getGroup(pageNum);
            } else {
              this.$Message.warning({
                content: "获取群列表失败！",
                duration: 2.5
              });
            }
          }, 2000);
        });
    },
    async getAllUsers() {
      let self = this;
      let allPeople = [];
      let ajaxList = [];
      for (let corp of this.UserInfo.corpUsers) {
        ajaxList.push(
          this.$service.getCorpAllUser.call(this, {
            corpId: corp.corpId,
            corpType: corp.corp.corpTypeEnums || corp.corp.corpType
          })
        );
      }
      try {
        let userList = await Promise.all(ajaxList);
        if (userList.length) {
          // 本地数据库存储用户数据
          userList = userList.reduce((userList, current) => {
            return userList.concat(current);
          });
        }
        this.setAllUser({ users: userList, needClear: true });
        return userList;
      } catch (error) {}
    },
    KickedOfflineHandle({ text = "" } = {}) {
      text = text || "登录已过期！";
      window.Logger.log({ message: "running KickedOfflineHandle", text });
      this.$Modal.error({
        content: text,
        onOk: () => {
          window.eventHub.$emit("logout");
        }
      });
    },
    networkUnavailable() {
      this.alertConfig.text = "正在重连...";
      window.Logger.log({ message: "running networkUnavailable" });
      this.alertConfig.type = "warning";

      !this.showOfflineWarnTimeout &&
        (this.showOfflineWarnTimeout = setTimeout(() => {
          this.isNetWorkWarn = true;
          window.Logger.log({
            message: "running networkUnavailable",
            isNetWorkWarn: this.isNetWorkWarn
          });
          // 广播出现断网提醒
          document.dispatchEvent(
            new CustomEvent("network-change", {
              detail: { state: "offline", showHint: true }
            })
          );
        }, 40000)); // 断网，增加展示断网警告状态的定时任务

      this.SetNetWorkState("offline");
      /** 广播网络状态改变--断网 */
      document.dispatchEvent(
        new CustomEvent("network-change", { detail: { state: "offline" } })
      );
      this.timeoutCheckNetwork && clearTimeout(this.timeoutCheckNetwork);
      this.checkNetwork();
    },
    reconnectServer() {
      const _this = this;
      this.onlineHandler();
      IMSDKServer.reconnect({
        onSuccess(userId) {},
        onTokenIncorrect(e) {
          _this.loginWebIMToken(true);
        },
        onError(error) {
          _this.loginWebIMToken(true);
        }
      });
    },
    checkNetwork(callback) {
      var myDate = new Date();
      isOnline({ timeout: 1000 })
        .then(online => {
          if (online) {
            // 融云SDK内部会进行重连
            // this.reconnectServer();
          } else {
            this.timeoutCheckNetwork && clearTimeout(this.timeoutCheckNetwork);
            this.timeoutCheckNetwork = setTimeout(() => {
              this.checkNetwork();
            }, 2000);
          }
        })
        .catch(err => {
          this.timeoutCheckNetwork && clearTimeout(this.timeoutCheckNetwork);
          this.timeoutCheckNetwork = setTimeout(() => {
            this.checkNetwork();
          }, 2000);
        });
    },
    onlineHandler() {
      // IM链接成功
      this.timeoutCheckNetwork && clearTimeout(this.timeoutCheckNetwork);
      this.SetNetWorkState("online");
      this.clearShowOfflineTimeout(); // 重连成功，清理展示断网警告状态的定时任务
      this.isNetWorkWarn = false;
      // 广播网络连接成功
      document.dispatchEvent(
        new CustomEvent("network-change", { detail: { state: "online" } })
      );
    },
    closeCreateHandle(data) {
      this.$root.$emit("close-create-dialog");
      if (data) {
        this.visibleCreate = true;
        this.createGroupOpt = {
          ...this.createGroupOpt,
          groupType: data.type
        };
      }
      this.visibleSelectType = false;
    },
    closeHandle() {
      this.$root.$emit("close-create-dialog");
      this.visibleCreate = false;
    },
    createGroupHandler(data) {
      const dialogOption = { ...data };
      if (data.id) {
        const typeDialog = dialogOption.groupType || 0;
        dialogOption.groupType =
          data.groupType >= 10 ? "outsource" : "organization";
        this.createGroupOpt = { ...dialogOption, typeDialog, type: 5 };
        this.visibleCreate = true;
      } else if (data.groupType && data.groupType === "outsource") {
        this.createGroupOpt = { ...dialogOption, type: 5 };
        this.visibleCreate = true;
      } else {
        this.createGroupOpt = { ...dialogOption, type: 5 };
        if (this.allCompanyList.length) {
          this.visibleSelectType = true;
        } else {
          MessageBox.confirm(
            "您未加入任何组织，建议您去手机端加入组织/团队/协会，再进行创建群聊。",
            "提示",
            {
              confirmButtonText: "确定",
              cancelButtonText: "取消",
              customClass: "warningDialog",
              type: "warning"
            }
          )
            .then(() => {})
            .catch(() => {});
        }
      }
    },
    clearShowOfflineTimeout() {
      clearTimeout(this.showOfflineWarnTimeout); // 重连成功，清理展示断网警告状态的定时任务
      this.showOfflineWarnTimeout = null;
    },
    /**
     * 微应用推送处理
     */
    appPushHandle(e) {
      const { detail } = e;
      if (detail) {
        const { type, extraJson } = detail;

        if (type === 8) {
          // 智邮推送
          if (!this.hasOpenMail && this.isShowMail) {
            PollingMailUnRead.triggerPolling();
          }
        }
      }
    }
  }
};
</script>
<style lang="scss" scoped>
$--container-width: 100%;
.main {
  flex: 0;
  flex-shrink: 1;
  display: flex;
  flex-basis: $--container-width;
  width: $--container-width;
  height: 100%;
  background: rgba(247, 247, 247, 1);
  border-radius: 2px;
  box-shadow: 0 0 20px rgba(139, 145, 139, 0.35);

  /* 主体 */
  .main-container {
    flex: 1;
    overflow: hidden;
    height: 100%;
  }
  .main-body {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .network-warn {
    position: fixed !important;
    top: 15px;
    left: 50%;
    transform: translateX(-50%);
    width: 130px !important;
    box-shadow: 0 0 10px 0 rgba($color: #000, $alpha: 0.3);
  }
}
</style>
