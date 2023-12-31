import { ACCOUNT, ACCOUNT_SQL, ACCOUNT_SQL_TEMPLATE } from "./sql_account";
import { GROUP, GROUP_SQL, GROUP_SQL_TEMPLATE } from "./sql_group";
import {
  GROUP_GROUPMEMBERS,
  GROUP_GROUPMEMBERS_SQL,
  GROUP_GROUPMEMBERS_SQL_TEMPLATE
} from "./sql_group_groupmembers";
import {
  GROUP_GROUPROBOTS,
  GROUP_GROUPROBOTS_SQL,
  GROUP_GROUPROBOTS_SQL_TEMPLATE
} from "./sql_group_grouprobots";
import {
  GROUP_ATTRIBUTE,
  GROUP_ATTRIBUTE_SQL,
  GROUP_ATTRIBUTE_SQL_TEMPLATE
} from "./sql_group_attribute";
import { STORAGE, STORAGE_SQL, STORAGE_SQL_TEMPLATE } from "./sql_storage";
import {
  STORAGE_RELLIST,
  STORAGE_RELLIST_SQL,
  STORAGE_RELLIST_SQL_TEMPLATE
} from "./sql_storage_rellist";
import {
  UPDATETIME,
  UPDATETIME_SQL,
  UPDATETIME_SQL_TEMPLATE
} from "./sql_updatetime";
import { MESSAGE, MESSAGE_SQL, MESSAGE_SQL_TEMPLATE } from "./sql_message";
import {
  LOCAL_SEARCH_HISTORY,
  LOCAL_SEARCH_HISTORY_SQL,
  LOCAL_SEARCH_HISTORY_SQL_TEMPLATE
} from "./sql_localSearchHistory";
import { UNION_QUERY_SQL, UNION_QUERY_SQL_TEMPLATE } from "./sql_union_query";

import { ROBOT, ROBOT_SQL, ROBOT_SQL_TEMPLATE } from "./sql_robot";

export const TABLE = {
  [ACCOUNT.name]: ACCOUNT,
  [GROUP.name]: GROUP,
  [GROUP_GROUPMEMBERS.name]: GROUP_GROUPMEMBERS,
  [GROUP_GROUPROBOTS.name]: GROUP_GROUPROBOTS,
  [GROUP_ATTRIBUTE.name]: GROUP_ATTRIBUTE,
  [STORAGE.name]: STORAGE,
  [STORAGE_RELLIST.name]: STORAGE_RELLIST,
  [UPDATETIME.name]: UPDATETIME,
  [MESSAGE.name]: MESSAGE,
  [LOCAL_SEARCH_HISTORY.name]: LOCAL_SEARCH_HISTORY,
  [ROBOT.name]: ROBOT
};

export const TABLENAME = {
  ACCOUNT_NAME: ACCOUNT.name,
  GROUP_NAME: GROUP.name,
  GROUP_GROUPMEMBERS_NAME: GROUP_GROUPMEMBERS.name,
  GROUP_GROUPROBOTS_NAME: GROUP_GROUPROBOTS.name,
  GROUP_ATTRIBUTE_NAME: GROUP_ATTRIBUTE.name,
  STORAGE_NAME: STORAGE.name,
  STORAGE_RELLIST_NAME: STORAGE_RELLIST.name,
  UPDATETIME_NAME: UPDATETIME.name,
  MESSAGE_NAME: MESSAGE.name,
  LOCAL_SEARCH_HISTORY_NAME: LOCAL_SEARCH_HISTORY.name,
  ROBOT_NAME: ROBOT.name
};
export const ALLTABLENAMELIST = Object.keys(TABLE);

export const SQL = {
  ...ACCOUNT_SQL,
  ...GROUP_SQL,
  ...GROUP_GROUPMEMBERS_SQL,
  ...GROUP_GROUPROBOTS_SQL,
  ...GROUP_ATTRIBUTE_SQL,
  ...STORAGE_SQL,
  ...STORAGE_RELLIST_SQL,
  ...UPDATETIME_SQL,
  ...MESSAGE_SQL,
  ...LOCAL_SEARCH_HISTORY_SQL,
  ...UNION_QUERY_SQL,
  ...ROBOT_SQL
};
export const TEMPLATE = {
  ...ACCOUNT_SQL_TEMPLATE,
  ...GROUP_SQL_TEMPLATE,
  ...GROUP_GROUPMEMBERS_SQL_TEMPLATE,
  ...GROUP_GROUPROBOTS_SQL_TEMPLATE,
  ...GROUP_ATTRIBUTE_SQL_TEMPLATE,
  ...STORAGE_SQL_TEMPLATE,
  ...STORAGE_RELLIST_SQL_TEMPLATE,
  ...UPDATETIME_SQL_TEMPLATE,
  ...MESSAGE_SQL_TEMPLATE,
  ...LOCAL_SEARCH_HISTORY_SQL_TEMPLATE,
  ...UNION_QUERY_SQL_TEMPLATE,
  ...ROBOT_SQL_TEMPLATE
};
