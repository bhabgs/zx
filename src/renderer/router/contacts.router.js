import NotSelectChat from "@/components/common/not-select-chat"; // 未选择聊天
import ContactsMain from "@/views/contacts/contacts-main"; // 名录主体部分
import DeptInfo from "@/views/contacts/dept-info"; // 部门信息
import GroupInfo from "@/views/contacts/group-info"; // 群组信息
import OrgStatisticsInfo from "@/views/contacts/org-statistics-info"; // 组织统计信息

export default {
  path: "contacts/:id",
  name: "Contacts",
  component: ContactsMain,
  redirect: to => {
    return { name: "NotSelectChat" };
  },
  children: [
    {
      path: "null",
      name: "NotSelectChat",
      component: NotSelectChat,
      props: { showTitle: false }
    },
    {
      path: "groupdetail/:groupid",
      name: "GroupDetail",
      component: GroupInfo
    },

    {
      path: "deptdetail",
      name: "DeptDetail",
      component: DeptInfo
    },
    {
      path: "orgstatisticsdetail",
      name: "OrgStatisticsDetail",
      component: OrgStatisticsInfo
    }
  ]
};
