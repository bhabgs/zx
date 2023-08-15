import ChatNotify from "@/views/chatNotify/chat-main";

const viewRoute = {
  template: "<router-view></router-view>"
};

export default {
  path: "chatNotify",
  name: "chatNotify",
  component: viewRoute,
  children: [
    {
      path: "chitchat",
      name: "chitchat",
      component: viewRoute
    },
    {
      path: "notify",
      name: "notify",
      component: viewRoute
    }
  ]
};
