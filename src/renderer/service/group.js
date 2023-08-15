import Vue from "vue";
import store from "@/store";
import { ipcRenderer } from "electron";
export default {
  // 获取群列表
  groupListApi({
    accountId,
    pageNum,
    type = undefined,
    pageSize,
    isDelete = 1
  }) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/group/getGroupByAccount`, {
        accountId,
        pageNum,
        type,
        pageSize,
        isDelete
      })
      .then(response => {
        if (response.data.code === "M0000") {
          if (pageNum == 1) {
            try {
              Vue.prototype.sqlite_update_time.group =
                response.data.ctime || Date.now();
            } catch (err) {}
          }
          const data = response.data.data;
          return data;
        } else {
          this.$message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 获取群列表增量接口
  groupListApiVo({
    accountId,
    pageNum,
    type = undefined,
    pageSize,
    isDelete = undefined,
    updateTime
  }) {
    return Vue.prototype.$http
      .post(`${Vue.prototype.$apipath.chatPath}/group/getGroupByAccountVo`, {
        accountId,
        pageNum,
        type,
        pageSize,
        isDelete,
        updateTime
      })
      .then(response => {
        if (response.data.code === "M0000") {
          if (pageNum == 1) {
            try {
              Vue.prototype.sqlite_update_time.group =
                response.data.ctime || Date.now();
            } catch (err) {}
          }
          const data = response.data.data;
          return data;
        } else {
          this.$message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 获取群详情
  groupInfoApi({ id }, config = {}) {
    // 获取群组名称
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/group/get`,
        {
          id,
          accountId: store.getters.GetSendUser.id,
          version: "v2"
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          store.dispatch("PushGroup", response.data.data);
          if (response.data.data) {
            ipcRenderer.invoke("sqlite-url", {
              key: "groupInfoApi",
              data: response.data
            });
          }
          return response;
        } else if (response.data.code === "M_U_019") {
          store.dispatch("DeleteGroup", id);
        }
        return Promise.reject(response);
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 获取群成员
  groupMember(id, size) {
    return new Promise((resolve, reject) => {});
  },
  createGroup(
    {
      corpId,
      name,
      deptId = null,
      type,
      userLimit = 3000,
      owner,
      creator,
      groupAdmins = [],
      groupMembers = [],
      comment = "",
      onlyOwnerManage = 1,
      onlyOwnerAtAll = 1,
      onlyOwnerUpdate = 1,
      freshViewHistory = 1,
      corpIdList = []
    },
    config = {}
  ) {
    // 创建群
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/group/create`,
        {
          corpId,
          name,
          deptId,
          type,
          userLimit,
          owner,
          creator,
          groupAdmins,
          groupMembers,
          comment,
          onlyOwnerManage,
          onlyOwnerAtAll,
          onlyOwnerUpdate,
          freshViewHistory,
          corpIdList,
          version: "v2"
        },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          ipcRenderer.invoke("sqlite-url", {
            key: "createGroup",
            data: response.data
          });
          return response;
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        let msg = "创建失败";
        if (error && error.data && error.data.msg) {
          msg = error.data.msg;
        }
        Vue.prototype.$message.error(msg);
        return Promise.reject(error);
      });
  },
  getGroupBySearch({ search, accountId }, config = {}) {
    return Vue.prototype.$http
      .post(
        `${this.$apipath.chatPath}/group/getGroupBySearch`,
        { search, accountId },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  /**
   * 修改群信息
   * @param {*} param0
   * @param {*} config
   */
  updateGroup(groupData, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/group/update`,
        { ...groupData, version: "v2" },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          ipcRenderer.invoke("sqlite-url", {
            key: "updateGroup",
            data: response.data
          });
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  /**
   * 退出、解散群组、群加人
   * @param {*} param0 type: quit,dismiss
   * @param {*} config
   */
  quitGroup(type, postData, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/group/${type}`,
        { ...postData, version: "v2" },
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          ipcRenderer.invoke("sqlite-url", {
            key: "quitGroup",
            data: response.data
          });
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  /**
   * 移交群主
   * @param {*} param0 type: quit,dismiss
   * @param {*} config
   */
  transferGroup(postData, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.chatPath}/group/transferGroup`,
        postData,
        config
      )
      .then(response => {
        if (response.data.code === "M0000") {
          ipcRenderer.invoke("sqlite-url", {
            key: "transferGroup",
            data: response.data
          });
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  /**
   * 获取群聊归属企业，群范围
   * @param {*} data
   * @param {*} config
   */
  getGroupCompanyList({ corpId, groupId }, config) {
    return Vue.prototype.$http
      .get(
        `${Vue.prototype.$apipath.contactPath}/orInv/contactV2/getCreatOrPlusGroupContractAppAndPc`,
        {
          params: { corpId, groupId },
          config
        }
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  /**
   * 获取群组个数
   * @param {*} param0
   * @param {*} config
   * @returns
   */
  getGroupSumByType({ accountId, type }, config) {
    return Vue.prototype.$http
      .get(
        `${Vue.prototype.$apipath.chatPath}/group/getSumGroupIdsByAccountVo`,
        {
          params: { accountId, type },
          config
        }
      )
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data;
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
