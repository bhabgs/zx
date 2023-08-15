export default {
  onChanged(status) {
    const ConnectionStatus = RongIMLib.ConnectionStatus;
    const {
      CONNECTED, // 连接成功
      CONNECTING, // 连接中
      CONNECTION_CLOSED, // 连接关闭
      DISCONNECTED, // 链接断开，主动调用disconnect时触发
      DOMAIN_INCORRECT, // 域名错误
      KICKED_OFFLINE_BY_OTHER_CLIENT, // 当前账户在其他web设备登录
      NETWORK_UNAVAILABLE, //网络不可用
      REQUEST_NAVI, // 开始请求导航
      RESPONSE_NAVI, // 请求导航结束
      RESPONSE_NAVI_ERROR, // 请求导航失败
      RESPONSE_NAVI_TIMEOUT, // 请求导航超时
      ULTRALIMIT, // 互踢次数过多
      WEBSOCKET_ERROR, // AppKey被封禁或已删除
      WEBSOCKET_UNAVAILABLE // websock链接失败
    } = ConnectionStatus;
    window.Logger.log({ message: "running im changed", status });
    switch (status) {
      case CONNECTED:
        // console.log("-----------连接成功------------");
        window.eventHub.$emit("loginim-success");
        break;
      case CONNECTING:
        // console.log("-----------连接中------------");
        // window.eventHub.$emit("loginim-success");
        break;
      case CONNECTION_CLOSED:
        // console.log("-----------连接断开------------");
        window.eventHub.$emit("network-unavailable");
        break;
      case DISCONNECTED:
        break;
      case KICKED_OFFLINE_BY_OTHER_CLIENT:
        try {
          window.eventHub.$emit("KickedOffline", { text: "其他设备登录" });
        } catch (error) {}
        break;
      case DOMAIN_INCORRECT:
        break;
      case NETWORK_UNAVAILABLE:
        // console.log("-----------网络不可用------------");
        window.eventHub.$emit("network-unavailable");
        break;
      case WEBSOCKET_UNAVAILABLE:
        // console.log("-----------websocket不可用------------");
        // 融云内部会做重新连接处理，业务上不用做操作
        // const  evt = new Event("reconnect-im"); // 广播重连IM事件
        // window.dispatchEvent(evt);
        window.eventHub.$emit("network-unavailable");
        break;
    }
  }
};
