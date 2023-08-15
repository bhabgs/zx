import Vue from "vue";
import Vuex from "vuex";
import state from "./state";
import * as actions from "@/store/actions";
import * as getters from "@/store/getters";
import * as mutations from "@/store/mutations";

/**
 * Module
 * MessageModule: 消息模块
 * GroupsModule: 群组模块
 * DialogModule: 会话模块
 * MicroApp: 微应用
 */
import MessageModule from "@/store/module/messageModule";
import GroupsModule from "@/store/module/groupsModule";
import DialogModule from "@/store/module/dialogModule";
import MicroApp from "./module/microAppModule";
import Contact from "./module/contact";

Vue.use(Vuex);

const store = new Vuex.Store({
  // strict: process.env.NODE_ENV !== 'production', // 严格模式
  state, // 状态集合
  mutations, // 突变集合
  actions, // 方法集合
  getters, // 显示集合
  modules: {
    MessageModule,
    GroupsModule,
    DialogModule,
    MicroApp,
    Contact
  }
});

export default store;
