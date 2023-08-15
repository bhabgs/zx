import Vue from "vue";
import Router from "vue-router";
import Login from "@/views/qrcode-login"; // 登录页
import MainPage from "@/views/main"; // 主界面

import ContactsRouter from "@/router/contacts.router";
import ChatNotify from "@/router/chatNotify.router";

const viewRoute = {
  template: "<router-view></router-view>",
};

Vue.use(Router);

const router = new Router({
  base: "/",
  mode: "hash",
  scrollBehavior: () => {
    history.pushState(null, null, document.URL);
  },
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
      alias: "/",
    },
    {
      path: "/main",
      component: MainPage,
      children: [
        ContactsRouter,
        ChatNotify,
        {
          name: "notify",
          path: "notifyOnly",
          component: viewRoute,
        },
        {
          name: "Open",
          path: "open",
          component: viewRoute,
        },
        {
          name: "zhiwen",
          path: "zhiwen",
          component: viewRoute,
        },
        {
          name: "Mail",
          path: "mail",
          component: viewRoute,
        },
        {
          name: "Mailstone",
          path: "mailstone",
          component: viewRoute,
        },
        {
          name: "Task",
          path: "task",
          component: viewRoute,
        },
        {
          name: "File",
          path: "file",
          component: viewRoute,
        },
        {
          name: "Okrs",
          path: "okrs",
          component: viewRoute,
        },
        {
          name: "Empty",
          path: "empty",
          component: viewRoute,
        },
      ],
    },
    {
      path: "",
      redirect: "/login",
    },
    {
      path: "*",
      name: "404",
      redirect: "/login",
    },
  ],
});
router.afterEach((to, from) => {
  sensors.quick("autoTrackSinglePage");
});

export default router;
