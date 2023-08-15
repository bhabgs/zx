const GETTERS = {
  GetGroups(state) {
    return state.GroupsMap || {};
  },
  GetSelectCompanyList(state) {
    return (
      state.selectCompanyList || {
        organization: [],
        outsource: []
      }
    );
  },
  /**
   * 根据群id机器人id获取机器人信息
   * @param {*} state
   */
  GetRobot(state) {
    return (groupId, robotId) => {
      if (groupId && robotId) {
        const group = state.GroupsMap[groupId] || {};
        const robot = (group.groupRobots || []).find(
          item => item.chatAccountId === robotId
        );

        return robot;
      }
    };
  }
};

export default GETTERS;
