import Vue from "vue";
import store from "@/store";
import { ipcRenderer } from "electron";
import { dbkey } from "../../config";
import { ConversationModel } from "../WebIM";

export default {
  // 获取
  // getUserByAccount({ accountId, corpId }) {
  //   return this.$http
  //     .get(`${this.$apipath.contactPath}/user/get_by_account`, {
  //       params: {
  //         accountId,
  //         corpId
  //       }
  //     })
  //     .then(response => {
  //       if (response.data.code === "M0000") {
  //         store.dispatch("SaveUser", [response.data.data]);
  //         return Promise.resolve(response);
  //       } else {
  //         return Promise.reject(response);
  //       }
  //     })
  //     .catch(error => {
  //       return Promise.reject(error);
  //     });
  // },
  getDeptList(
    {
      corpId,
      pid,
      pageNum = 1,
      pageSize = 1000,
      corpType = 0,
      corpAndCorpRelType = 0
    },
    config = {}
  ) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    const params = {
      corpId,
      pid,
      pageNum,
      pageSize,
      corpType
    };
    if (net_type == "1") {
      // 外网V2添加额外参数
      params.corpAndCorpRelType = corpAndCorpRelType;
    }
    return this.$http
      .get(
        `${this.$apipath.contactPath}/dept/pagelist${
          net_type == "1" ? "V2" : ""
        }`,
        {
          ...config,
          params
        }
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg);
          }
        }
      })
      .catch(error => {
        this.$message.warning("无法获取人员信息");
      });
  },
  getUserAllByDept(postData, config = {}) {
    return Vue.prototype.$http
      .get(
        `${Vue.prototype.$apipath.contactPath}/orInv/contactV2/pagelist_by_dept_cascadeV3`,
        {
          params: {
            ...postData
          },
          ...config
        }
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "无法获取部门员工");
          }
        }
      })
      .catch(error => {
        if (!error.message || error.message.code !== "cancel") {
          this.$message.warning("无法获取部门员工");
        }
      });
  },
  getUserListByDept({
    corpId,
    deptIds,
    corpAndCorpRelType = 0,
    config = {},
    corpType = 0
  }) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    const postData = {
      corpId,
      deptIds,
      corpType,
      corpAndCorpRelType
    };
    let url = "";
    if (net_type == "1") {
      // 外网V2添加额外参数
      url = `${this.$apipath.contactPath}/orInv/contactV2/get_user_by_deptidsV3`;
      postData.corpAndCorpRelType = corpAndCorpRelType;
    } else {
      url = `${this.$apipath.contactPath}/user/get_user_by_deptids`;
    }
    return this.$http
      .post(url, postData, config)
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "无法获取部门员工");
          }
        }
      })
      .catch(error => {
        if (!error.message || error.message.code !== "cancel") {
          this.$message.warning("无法获取部门员工");
        }
      });
  },
  getUserDetailById(corpId, userIds, config = {}) {
    return this.$http
      .post(
        `${this.$apipath.contactPath}/user/gets`,
        {
          corpId,
          ids: userIds
        },
        config
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "无法获取员工信息详情");
          }
        }
      })
      .catch(error => {
        if (!error.message || error.message.code !== "cancel") {
          this.$message.warning("无法获取员工信息详情");
        }
      });
  },
  //个人信息隐藏-组织架构用户详情
  getUserById(userId, config = {}) {
    return this.$http
      .get(`${this.$apipath.contactPath}/user/getUserById`, {
        ...config,
        params: {
          userId
        }
      })
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "无法获取员工信息详情");
          }
        }
      })
      .catch(error => {
        if (!error.message || error.message.code !== "cancel") {
          this.$message.warning("无法获取员工信息详情");
        }
      });
  },
  getSubDeptUserPagelist(
    {
      corpId,
      pid,
      pageNum = 1,
      pageSize = 1000,
      corpType = 0,
      corpAndCorpRelType = 0
    },
    config = {}
  ) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    return this.$http
      .get(
        `${this.$apipath.contactPath}/dept/sub_dept_user_pagelist${
          net_type == "1" ? "V3" : ""
        }`,
        {
          ...config,
          params: {
            corpId,
            pageNum,
            pageSize,
            corpType,
            corpAndCorpRelType,
            pid
          }
        }
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg);
          }
        }
      })
      .catch(error => {
        this.$message.warning("无法获取人员信息");
      });
  },
  getCompanyUsers({ corpId, pageNum = 1, pageSize = 10000, corpType = 0 }) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    const url =
      net_type == "1"
        ? `${this.$apipath.contactPath}/orInv/contactV2/pageListByCorpId`
        : `${this.$apipath.contactPath}/user/pageListByCorpId`;
    return this.$http
      .get(url, {
        params: { corpId, pageNum, pageSize, corpType }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data;
          return data;
        } else {
          this.$message.error(response.data.msg);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  getSearchUserByName({ corpId, name, pageNum = 1, pageSize = 10000 }) {
    return this.$http
      .get(`${this.$apipath.contactPath}/user/search_by_name`, {
        params: {
          corpId,
          name,
          pageNum,
          pageSize
        }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          return data;
        } else {
          this.$message.error(response.data.msg);
          return Promise.reject();
        }
      });
  },
  // getAccountById({ id }) {
  //   return this.$http
  //     .get(`${this.$apipath.contactPath}/account/get`, {
  //       params: {
  //         id
  //       }
  //     })
  //     .then(response => {
  //       if (response.data.code === "M0000") {
  //         const data = response.data.data || {};
  //         if (!data.corpUsers || !data.corpUsers.length) {
  //           store.dispatch("SaveNotCorpUser", data);
  //         } else if (data.corpUsers) {
  //           data.corpUsers.forEach(user => {
  //             store.dispatch("SaveUser", [user, true]);
  //           });
  //         }
  //         return Promise.resolve(data);
  //       } else {
  //         return Promise.reject(response);
  //       }
  //     })
  //     .catch(error => {
  //       console.error(error);
  //       return Promise.reject(error);
  //     });
  // },
  //个人信息隐藏-群组弹窗
  getAccountInformation({ id }) {
    return this.$http
      .get(`${this.$apipath.contactPath}/account/getAccountInformation`, {
        params: {
          id
        }
      })
      .then(response => {
        if (response.data.code === "M0000") {
          const data = response.data.data || {};
          if (!data.corpUsers || !data.corpUsers.length) {
            store.dispatch("SaveNotCorpUser", data);
          }
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  //个人信息(隐藏&企业关系）
  getAccountInformationOrganization({ id, corpId }) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    const url =
      net_type == "1"
        ? `${this.$apipath.contactPath}/orInv/contactV2/getAccountInformationOrganizationV2
`
        : `${this.$apipath.contactPath}/account/getAccountInformationOrganization`;
    return this.$http
      .get(url, {
        params: {
          id,
          corpId
        }
      })
      .then(async response => {
        if (response.data.code === "M0000") {
          const user = response.data.data || {};
          const data = { ...user, type: user.form || user.type };
          // const currentUserDBResult = await ipcRenderer.invoke(
          //   "db-getAll-data",
          //   {
          //     db: "contact-corp",
          //     accountIds: [id]
          //   }
          // );
          // const currentUser = (currentUserDBResult || {}).data || [];
          const currentUser =
            (await ipcRenderer.invoke("sqlite-query", {
              key: "queryContatByAccountId",
              input: { accountIds: [id] }
            })) || [];
          let notExitCorp = [];
          if (!data.corpUsers || !data.corpUsers.length) {
            notExitCorp = currentUser;
            if (data.externalContacts === 0) {
              store.dispatch("SaveNotCorpUser", data);
              store.dispatch("SetNoRelateUser", { user: data, del: true });
            } else {
              store.dispatch("SetNoRelateUser", { user: data });
            }
          } else {
            const exitCorpIds = data.corpUsers.map(item => item.corpId);
            notExitCorp = currentUser.filter(item => {
              const corpId =
                item.corpId ||
                (item.depts && item.depts && item.depts[0].corpId);
              return !exitCorpIds.includes(corpId);
            });
            store.dispatch("SetNoRelateUser", { user: data, del: true });
            // 如果当前用户有公司则添加数据存储
            let newUser = data.corpUsers.map(item => {
              return {
                avatar: data.avatar,
                nickName: data.nickName,
                ...data,
                ...item
              };
            });
            store.dispatch("setAllUser", {
              users: newUser,
              needClear: false
            });
            // 如果当前用户有公司则缓存到数据库
            // let saveUserData = newUser.map(user => {
            //   return {
            //     key: `${user.accountId}#${user.corpId}`,
            //     value: user
            //   };
            // });
            // const saveResult = await ipcRenderer.invoke("db-save-data", {
            //   db: "contact",
            //   data: saveUserData
            // });
          }
          // const delUserkey = notExitCorp.map(user => {
          //   return `${user.accountId}#${user.corpId}`;
          // });
          // const deleteResult = await ipcRenderer.invoke("db-del-data", {
          //   db: "contact",
          //   key: delUserkey
          // });
          // 如果存储中有当前用户但是根据接口当前用户信息为空则清除用户缓存
          if (notExitCorp && notExitCorp.length) {
            store.dispatch("setAllUser", {
              users: notExitCorp,
              needClear: false,
              isDelete: true
            });
          }
          await ipcRenderer.invoke("sqlite-url", {
            key: "getAccountInformationOrganization",
            data: response.data,
            input: { id, corpId }
          });
          return Promise.resolve(data);
        } else {
          return Promise.reject(response);
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  },
  // 根据搜索框（用户名）跨公司模糊查询账号信息
  getAccountSearchUserByName({ search, corpIds = [] }, config = {}) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.contactPath}/account/getAccountBySearch`,
        { search, corpIds },
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
  // 根据搜索框（用户名）跨公司模糊查询账号信息
  getAccountSearchOrganization({ search, corpIds = [] }, config = {}) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    return Vue.prototype.$http
      .post(
        `${
          Vue.prototype.$apipath.contactPath
        }/account/getAccountBySearchOrganization${net_type == "1" ? "V2" : ""}`,
        { search, corpIds },
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
   * 群聊搜索用户
   * @param {*} postData
   * @param {*} config
   */
  getAccountSearchByUserName(postData, config) {
    return Vue.prototype.$http
      .post(
        `${Vue.prototype.$apipath.contactPath}/orInv/contactV2/searchMycontactListByUserNameV3`,
        { ...postData },
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
  async getChangeResultData() {
    const { $http, $apipath } = Vue.prototype;
    const userInfo = store.getters.GetUser;
    const corpIds = userInfo.corpUsers.map(corp => corp.corpId);
    // const keys = corpIds.map(id => dbkey.corpUserTimestamp(id));
    // let timestampResult = await ipcRenderer.invoke("db-getAll-data", {
    //   db: "base",
    //   keys
    // });
    // timestampResult = timestampResult.data || {};

    // timestampResult = corpIds.map(
    //   id => timestampResult[dbkey.corpUserTimestamp(id)] || new Date().getTime()
    // );
    // let timestamp = timestampResult.reduce((total, current) => {
    //   let result = current < total ? current : total;
    //   return result;
    // });
    let sqliteUpdateTime = await ipcRenderer.invoke("sqlite-query", {
      key: "indbTime",
      input: { id: "" }
    });
    let timestamp = sqliteUpdateTime.account;
    try {
      const response = await $http.get(
        `${$apipath.contactPath}/orInv/contactV2/getChangeResultData`,
        {
          params: {
            lastUpdatedTime: timestamp
          }
        }
      );
      if (response.data.code === "M0000") {
        ipcRenderer.invoke("sqlite-url", {
          key: "getChangeResultData",
          data: response.data,
          input: { corpIds: corpIds }
        });
        const userList = response.data.data || [];
        //** 存储当前更新时间 */
        // const saveData = corpIds.map(id => ({
        //   key: dbkey.corpUserTimestamp(id),
        //   value: response.data.ctime || Date.now()
        // }));
        // ipcRenderer.invoke("", {
        //   db: "base",
        //   data: saveData
        // });
        //** 存储当前更新时间 */
        //** 删除所有更新的用户相关数据然后再更新 */
        let delUserkey = [];
        let updateUserList = [];
        for (let index = 0; index < userList.length; index++) {
          const element = userList[index].accountInfomationDTO || {};
          // 因为leveldb不支持模糊匹配所以初始化删除所有增量用户信息然后重新替换
          delUserkey = delUserkey.concat(
            corpIds.map(item => {
              return `${element.id}#${item}`;
            })
          );
          // delUserkey.push(`${element.id}#undefined`);
          // 清除当前用户所有缓存
          store.dispatch("setAllUser", {
            users: corpIds.map(corp => {
              return {
                ...element,
                accountId: userList[index].accountId,
                corpId: corp
              };
            }),
            needClear: false,
            isDelete: true
          });
          // 清除所有用户关系
          corpIds.forEach(item => {
            store.dispatch("SetNoRelateUser", {
              user: {
                accountId: userList[index].accountId,
                corpId: item
              },
              del: true
            });
          });
          if (Array.isArray(element.corpUsers) && element.corpUsers.length) {
            // 如果当前用户有公司则添加数据存储
            let newUser = element.corpUsers.map(item => {
              return {
                avatar: element.avatar,
                nickName: element.nickName,
                accountId: userList[index].accountId,
                ...element,
                ...item,
                form: element.form || element.type, // 选择最外层的type
                type: element.form || element.type // 选择最外层的type
              };
            });
            // 如果当前用户有公司则更新vuex缓存
            store.dispatch("setAllUser", {
              users: newUser,
              needClear: false
            });
            // 如果当前用户有公司则缓存到数据库(每个公司存一份)
            updateUserList = updateUserList.concat(
              newUser.map(user => {
                return {
                  key: `${user.accountId}#${user.corpId}`,
                  value: user
                };
              })
            );
          } else {
            //离职或无公司只存基本信息
            // updateUserList.push(`${user.accountId}#undefined`);
            store.dispatch("SetNoRelateUser", {
              user: { ...element, id: userList[index].accountId }
            });
            if (element.externalContacts == 0) {
              store.dispatch("SaveNotCorpUser", {
                ...element,
                id: userList[index].accountId
              });
            }
            // 当前会话人员离职时删除当前会话
            if (store.getters.GetOpenDialog.id == userList[index].accountId) {
              store.dispatch("SetOpenDialog", {});
            }
          }
        }
        // // 删除用户更新缓存
        // const deleteResult = await ipcRenderer.invoke("db-del-data", {
        //   db: "contact",
        //   key: delUserkey
        // });
        // // 更新用户更新缓存
        // const saveResult = await ipcRenderer.invoke("db-save-data", {
        //   db: "contact",
        //   data: saveUserData
        // });
        // //**  */
      }
    } catch (error) {
      return Promise.reject(error);
    }
  },
  // 获取增量更新用户
  async getListIuUser() {
    const { $http, $apipath } = Vue.prototype;
    const userInfo = store.getters.GetUser;
    const corpIds = userInfo.corpUsers.map(corp => corp.corpId);
    // const keys = corpIds.map(id => dbkey.corpUserTimestamp(id));
    // let timestampResult = await ipcRenderer.invoke("db-getAll-data", {
    //   db: "base",
    //   keys
    // });
    // timestampResult = timestampResult.data || {};

    // timestampResult = corpIds.map(
    //   id => timestampResult[dbkey.corpUserTimestamp(id)] || new Date().getTime()
    // );
    // let timestamp = timestampResult.reduce((total, current) => {
    //   let result = current < total ? current : total;
    //   return result;
    // });
    let sqliteUpdateTime = await ipcRenderer.invoke("sqlite-query", {
      key: "indbTime",
      input: { id: "" }
    });
    let timestamp = sqliteUpdateTime.account;
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    timestamp &&
      $http
        .get(
          `${$apipath.contactPath}/orInv/contactV2/listIuUsersInfo${
            net_type == "1" ? "V3" : ""
          }`,
          {
            params: {
              lastUpdatedTime: timestamp
            }
          }
        )
        .then(async response => {
          if (response.data.code === "M0000") {
            ipcRenderer.invoke("sqlite-url", {
              key: "getListIuUser",
              data: response.data
            });
            const data = response.data.data;
            // const saveData = corpIds.map(id => ({
            //   key: dbkey.corpUserTimestamp(id),
            //   value: data.iuTime
            // }));
            // ipcRenderer.invoke("db-save-data", {
            //   db: "base",
            //   data: saveData
            // });

            let delUserkey = [];
            let userList = [].concat(data.addUsers, data.updUsers);

            let saveUserData = userList.map(user => {
              !corpIds.includes(user.corpId) && corpIds.push(user.corpId);
              store.dispatch("SetNoRelateUser", {
                user: { id: user.accountId },
                del: true
              });
              return {
                key: `${user.accountId}#${user.corpId}`,
                value: user
              };
            });

            delUserkey = data.delUsers.map(user => {
              store.dispatch("SetNoRelateUser", {
                user: { ...user, id: user.userId },
                del: true
              });
              return `${user.accountId}#${user.corpId}`;
            });

            // const saveResult = await ipcRenderer.invoke("db-save-data", {
            //   db: "contact",
            //   data: saveUserData
            // });
            // const deleteResult = await ipcRenderer.invoke("db-del-data", {
            //   db: "contact",
            //   key: delUserkey
            // });
            // console.log("增量更新", saveResult, deleteResult);
            // store.dispatch("setAllUser", userList);
            // let result = await ipcRenderer.invoke("db-getAll-data", {
            //   db: "contact-corp",
            //   corpids: corpIds
            // });
            // let resultData = result.data;
            const resultData =
              (await ipcRenderer.invoke("sqlite-query", {
                key: "queryContatByCorpId",
                input: { corpIds }
              })) || [];
            if (resultData.length) {
              store.dispatch("setAllUser", {
                users: resultData,
                needClear: true
              });
            }
            return Promise.resolve(data);
          } else {
            return Promise.reject(response);
          }
        })
        .catch(error => {
          return Promise.reject(error);
        });
  },
  //获取组织统计信息
  getCorpStatistics({ accountId }) {
    return Vue.prototype.$http
      .get(`${Vue.prototype.$apipath.contactPath}/statistics/corpStatistics`, {
        params: {
          accountId
        }
      })
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
  //更换头像
  changeAvatar(data, config = {}) {
    return this.$http
      .post(`${this.$apipath.contactPath}/account/update`, data, config)
      .then(response => {
        if (response.data.code === "M0000") {
          return response.data;
        } else {
          return Promise.reject();
        }
      })
      .catch(error => {
        this.$message.error("更换头像失败！");
        return Promise.reject(error);
      });
  },
  /**
   * 获取部门下的子部门和用户
   * @param {*} param0
   * @param {*} config
   * @returns
   */
  getDeptUserPagelist(postData, config = {}) {
    const net_type = sessionStorage.getItem("net_type"); // 1外网， 2，内网
    return this.$http
      .get(
        `${this.$apipath.contactPath}/orInv/contactV2/sub_dept_user_pagelist${
          net_type == "1" ? "V3" : ""
        }`,
        {
          ...config,
          params: { ...postData }
        }
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg);
          }
        }
      })
      .catch(error => {
        this.$message.warning("无法获取子部门信息");
      });
  },
  /**
   * 获取名录树
   * @param {*} type:0组织1外联
   * @returns
   */
  getContactTree({ type = 0, isGroup = undefined }, config = {}) {
    const postData = {
      type,
      isGroup
    };
    return this.$http
      .post(
        `${this.$apipath.contactPath}/orInv/contactV2/getContract`,
        postData,
        config
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "拉取名录失败");
            return Promise.reject(error);
          }
        }
      })
      .catch(error => {
        if (!error.message || error.message.code !== "cancel") {
          this.$message.warning("拉取名录失败");
          return Promise.reject(error);
        }
      });
  },
  createCorp(data, config = {}) {
    return this.$http
      .post(
        `${this.$apipath.contactPath}/orInv/contactV2/contactUs/save`,
        {
          ...data
        },
        config
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "创建企业/团队失败");
            return Promise.reject(response);
          }
        }
      })
      .catch(error => {
        // if (!error.message || error.message.code !== "cancel") {
        //   this.$message.warning("创建企业/团队失败");
        // }
        return Promise.reject(error);
      });
  },
  // 查询用户可见的私人助手集合
  getRobotList(data, config = {}) {
    return this.$http
      .post(
        `${this.$apipath.contactPath}/personalAssistant/getListByCorpsAndAccountId`,
        {
          ...data
        },
        config
      )
      .then(response => {
        if (response.status === 200) {
          if (response.data.code === "M0000") {
            const data = response.data;
            return data;
          } else {
            this.$message.error(response.data.msg || "创建企业/团队失败");
            return Promise.reject(response);
          }
        }
      })
      .catch(error => {
        return Promise.reject(error);
      });
  }
};
