import Vue from "vue";
import store from "@/store";

export default {
  /**
   * 创建机器人
   * @param {Object} data 参数
   * @param {Object|null} config
   */
  craeteRobot(data, config = {}) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(`${$apipath.chatPath}/robot_info/create_base_info`, data, config)
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          Vue.prototype.$message.success("创建成功");
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        let msg = "创建失败";
        if (error && error.message) {
          msg = error.message;
        } else if (error && error.data && error.data.msg) {
          msg = error.data.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  /**
   * 编辑机器人信息
   * @param {*} data
   * @param {*} config
   */
  updateRobot(data, config = {}) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(`${$apipath.chatPath}/robot_info/update_robot_info`, data, config)
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          Vue.prototype.$message.success("修改成功");
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        let msg = "保存失败";
        if (error && error.message) {
          msg = error.message;
        } else if (error && error.data && error.data.msg) {
          msg = error.data.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  /**
   * 获取机器人详情
   */
  getRobotInfo(data = {}, config = {}) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .get(`${$apipath.chatPath}/robot_info/get_robot_info`, {
        params: data,
        ...config
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        let msg = "获取详情失败";
        if (error && error.message) {
          msg = error.message;
        } else if (error && error.data && error.data.msg) {
          msg = error.data.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  /**
   * 移除机器人
   * @param {string} chatAccountId 机器人id
   * @param {string} chatGroupID 群id
   */
  removeRobot(data = {}, config = {}) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(
        `${$apipath.chatPath}/robot_info/del_robot_from_group`,
        data,
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        let msg = "群助手移除失败";
        if (error && error.message) {
          msg = error.message;
        } else if (error && error.data && error.data.msg) {
          msg = error.data.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  /**
   * 提交信息到服务端，用于@机器人 时告知服务器
   * @param {*} data
   * @param {*} config
   */
  putMessageRobot(data = {}, config = {}) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(`${$apipath.chatPath}/robot_message/notify_robot`, data, config)
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  /**
   * 提交信息到服务端，用于@机器人 时告知服务器
   * @param {*} data
   * @param {*} config
   */
  putMessagepersonalAssistant(data = {}, config = {}) {
    const { $http, $apipath } = Vue.prototype;

    return $http
      .post(
        `${$apipath.chatPath}/robot_message/notify_personal_assistant`,
        data,
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject({ message: response.data.msg });
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
