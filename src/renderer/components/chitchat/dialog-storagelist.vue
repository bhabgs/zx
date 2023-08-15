<template>
  <div v-loading="loading" class="dialog-list" :class="dialogType">
    <ul class="dialog-container">
      <template v-for="(row, index) in ConversationSort">
        <!-- 收纳组的逻辑 -->
        <li
          v-if="row.conversationType === IMConversationEnum.GATHER"
          :class="[
            {
              'menu-color':
                currentMenu == row.conversationType + row.id &&
                dialogType === 'organization',
              'menu-color-outsource':
                currentMenu == row.conversationType + row.id &&
                dialogType === 'outsource'
            },
            'dialog-item',
            dialogType === 'organization'
              ? 'dialog-item-organization'
              : 'dialog-item-outsource'
          ]"
          style="height: 100% !important"
          :title="row.name"
          :key="`${row.conversationType}_${row.id}`"
          :id="`id_${row.conversationType}_${row.id}`"
          @contextmenu.prevent="contextmenuHandle($event, row)"
        >
          <el-collapse
            :value="openStorageList.includes(`${row.id}`) ? [row.id] : []"
            @change="val => handleChange(val, row)"
          >
            <el-collapse-item :name="row.id" class="collapse-storage">
              <template slot="title">
                <div v-if="row.isTop == 1" class="top-sign"></div>
                <div class="storage-title-left">
                  <img src="@/assets/image/approval/pack-group-icon.png" alt />
                  <!-- <img
                    v-else
                    src="@/assets/image/approval/wx-pack-group-icon.png"
                    alt
                  /> -->
                </div>
                <div class="storage-title-right">
                  <div class="storage-title-right-top">
                    【<span
                      class="name"
                      v-html="getHTMLByText(storageNameFormat(row.name))"
                    ></span
                    >】
                    <span class="num-info">[{{ row.children.length }}]</span>
                    <img
                      v-if="!openStorageList.includes(`${row.id}`)"
                      class="snImg"
                      src="@/assets/image/approval/pack.png"
                      alt
                    />

                    <img
                      v-else
                      class="snImg"
                      src="@/assets/image/approval/unfold.png"
                      alt
                    />
                  </div>
                  <div
                    class="storage-title-right-bottom"
                    v-if="
                      row.children &&
                        row.children.length &&
                        !openStorageList.includes(`${row.id}`)
                    "
                  >
                    <p
                      class="show-draft"
                      v-if="
                        GetDraftListMap.get(row.id) && row.id !== OpenDialog.id
                      "
                    >
                      <span>[草稿]</span>{{ GetDraftListMap.get(row.id) }}
                    </p>
                    <message-info
                      class="conversation-message"
                      :showGroupName="true"
                      :key="
                        `${row.message.conversationType}_${row.id}_${row.message.messageTime}`
                      "
                      v-else-if="row.message"
                      :info="row"
                    ></message-info>
                    <p
                      class="conversation-time item-time item-time-color"
                      :class="{
                        current: $myUtils.isCurrentDay(row.lastConversationTime)
                      }"
                      v-if="row.message && row.lastConversationTime"
                    >
                      {{
                        $myUtils.formatDateFilter(row.lastConversationTime, 2)
                      }}
                    </p>
                  </div>
                </div>
                <div class="hint-badge-container-s">
                  <Badge
                    v-if="row.reminderNumber"
                    class="hint-sign"
                    :class="{
                      scale: !row.isHint,
                      'low-color': getHintType(row.reminderNumber) == 1,
                      'mid-color': getHintType(row.reminderNumber) == 2,
                      'hot-color': getHintType(row.reminderNumber) == 3
                    }"
                    :count="row.reminderNumber"
                    :dot="row.isHint"
                  ></Badge>
                </div>
              </template>
              <ul class="dialog-container">
                <template v-for="(subRow, subIndex) in row.children">
                  <li
                    v-if="subRow"
                    class="dialog-item-bottom"
                    :key="`${subRow.conversationType}_${subRow.id}`"
                    :id="`id_${subRow.conversationType}_${subRow.id}`"
                    :title="subRow.name"
                    @click="selectDialog(subRow, subIndex)"
                    @contextmenu.stop="contextmenuHandle($event, subRow)"
                    :class="[
                      {
                        'is-selected':
                          subRow.id === OpenDialog.id &&
                          subRow.conversationType ===
                            OpenDialog.conversationType,
                        'is-top': subRow.istop,
                        'menu-color':
                          currentMenu == subRow.conversationType + subRow.id &&
                          dialogType === 'organization',
                        'menu-color-outsource':
                          currentMenu == subRow.conversationType + subRow.id &&
                          dialogType === 'outsource'
                      },
                      'dialog-item',
                      dialogType === 'organization'
                        ? 'dialog-item-organization'
                        : 'dialog-item-outsource'
                    ]"
                  >
                    <div v-if="subRow.istop" class="top-sign"></div>
                    <user-photo
                      class="avatar-box"
                      :user="subRow"
                      v-if="
                        subRow.conversationType === IMConversationEnum.PRIVATE
                      "
                    ></user-photo>
                    <group-photo
                      class="avatar-box"
                      :group="subRow"
                      v-if="
                        subRow.conversationType === IMConversationEnum.GROUP
                      "
                    ></group-photo>
                    <div class="msg-container">
                      <div class="msg-container-left">
                        <p class="item-name only-line">{{ subRow.name }}</p>
                        <group-sign
                          v-if="
                            subRow.conversationType === IMConversationEnum.GROUP
                          "
                          :type="subRow.groupType"
                        ></group-sign>
                        <p
                          class="item-time only-line"
                          :class="{
                            current: $myUtils.isCurrentDay(
                              subRow.message.messageTime
                            )
                          }"
                          v-if="subRow.message && subRow.message.content"
                        >
                          {{
                            $myUtils.formatDateFilter(
                              subRow.message.messageTime,
                              2
                            )
                          }}
                        </p>
                      </div>
                      <div class="msg-container-right">
                        <div class="msg-info-wrapper">
                          <p
                            class="show-draft"
                            v-if="
                              GetDraftListMap.get(subRow.id) &&
                                subRow.id != OpenDialog.id
                            "
                          >
                            <span>[草稿]</span
                            >{{ GetDraftListMap.get(subRow.id) }}
                          </p>
                          <message-info
                            :key="
                              `${subRow.conversationType}_${subRow.id}_${subRow.message.messageTime}`
                            "
                            v-else-if="subRow.message"
                            :info="subRow"
                          ></message-info>
                        </div>
                        <div
                          v-if="subRow.isStar || subRow.isHint"
                          class="set-top-sign"
                        >
                          <i
                            v-if="subRow.isStar"
                            class="star-sign iconfont icon-xingbiao"
                          ></i>
                          <i
                            v-if="subRow.isHint"
                            class="iconfont icon-xiaoximiandarao"
                          ></i>
                        </div>
                      </div>
                    </div>
                    <div class="hint-badge-container hint-badge-container-left">
                      <Badge
                        v-if="subRow.reminderNumber"
                        class="hint-sign"
                        :class="{
                          scale:
                            subRow.conversationType ===
                              IMConversationEnum.PRIVATE ||
                            !subRow.isHint ||
                            subRow.isAtMe,
                          'low-color': getHintType(subRow.reminderNumber) == 1,
                          'mid-color': getHintType(subRow.reminderNumber) == 2,
                          'hot-color': getHintType(subRow.reminderNumber) == 3
                        }"
                        :count="subRow.reminderNumber"
                        :dot="subRow.isHint && !subRow.isAtMe"
                      ></Badge>
                    </div>
                  </li>
                </template>
                <template v-if="row.children && row.children.length === 0">
                  <div class="storage__div--withoutsession">
                    <el-button type="text" disabled>暂无会话</el-button>
                    <el-button type="text" @click="openJoinStorageHandle(row)"
                      >立即添加</el-button
                    >
                  </div>
                </template>
              </ul>
            </el-collapse-item>
          </el-collapse>
        </li>
        <!-- 原来会话的逻辑 -->
        <li
          v-if="row.conversationType !== IMConversationEnum.GATHER"
          class="dialog-item-left"
          :key="`${row.conversationType}_${row.id}`"
          :id="`id_${row.conversationType}_${row.id}`"
          :title="row.name"
          @click="selectDialog(row, index)"
          @contextmenu.prevent="contextmenuHandle($event, row)"
          :class="[
            {
              'is-selected':
                row.id === OpenDialog.id &&
                row.conversationType === OpenDialog.conversationType,
              'is-top': row.istop,
              'menu-color':
                currentMenu == row.conversationType + row.id &&
                dialogType === 'organization',
              'menu-color-outsource':
                currentMenu == row.conversationType + row.id &&
                dialogType === 'outsource'
            },
            'dialog-item',
            dialogType === 'organization'
              ? 'dialog-item-organization'
              : 'dialog-item-outsource'
          ]"
        >
          <div v-if="row.istop" class="top-sign"></div>
          <user-photo
            class="avatar-box"
            :user="row"
            v-if="row.conversationType === IMConversationEnum.PRIVATE"
          ></user-photo>
          <group-photo
            class="avatar-box"
            :group="row"
            v-if="row.conversationType === IMConversationEnum.GROUP"
          ></group-photo>
          <div class="msg-container">
            <div class="msg-container-left">
              <p class="item-name only-line">{{ row.name }}</p>
              <group-sign
                v-if="row.conversationType === IMConversationEnum.GROUP"
                :type="row.groupType"
              ></group-sign>
              <p
                class="item-time only-line"
                :class="{
                  current: $myUtils.isCurrentDay(row.message.messageTime)
                }"
                v-if="row.message && row.message.content"
              >
                {{ $myUtils.formatDateFilter(row.message.messageTime, 2) }}
              </p>
            </div>
            <div class="msg-container-right">
              <div class="msg-info-wrapper">
                <p
                  class="show-draft"
                  v-if="GetDraftListMap.get(row.id) && row.id != OpenDialog.id"
                >
                  <span>[草稿]</span>{{ GetDraftListMap.get(row.id) }}
                </p>
                <message-info
                  :key="
                    `${row.conversationType}_${row.id}_${row.message.messageTime}`
                  "
                  v-else-if="row.message"
                  :info="row"
                ></message-info>
              </div>
              <div v-if="row.isStar || row.isHint" class="set-top-sign">
                <i
                  v-if="row.isStar"
                  class="star-sign iconfont icon-xingbiao"
                ></i>
                <i v-if="row.isHint" class="iconfont icon-xiaoximiandarao"></i>
              </div>
            </div>
          </div>
          <div class="hint-badge-container">
            <Badge
              v-if="row.reminderNumber"
              class="hint-sign"
              :class="{
                scale:
                  row.conversationType === IMConversationEnum.PRIVATE ||
                  !row.isHint ||
                  row.isAtMe,
                'low-color': getHintType(row.reminderNumber) == 1,
                'mid-color': getHintType(row.reminderNumber) == 2,
                'hot-color': getHintType(row.reminderNumber) == 3
              }"
              :count="row.reminderNumber"
              :dot="row.isHint && !row.isAtMe"
            ></Badge>
          </div>
        </li>
      </template>
    </ul>
    <transition name="fade" mode="out-in">
      <ul
        class="menu-box"
        ref="dialogMenu"
        :style="
          `top: ${top}px; left: ${left}px;visibility: ${
            IsShow ? 'visible' : 'hidden'
          }`
        "
      >
        <template
          v-if="
            !contextMenuData.storageId &&
              contextMenuData.id &&
              contextMenuData.id.includes('robot')
          "
        >
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 1, data: contextMenuData })"
          >
            <button>
              <img
                v-if="contextMenuData.istop"
                src="@/assets/image/approval/cancel.png"
                alt
              />
              <img v-else src="@/assets/image/approval/top.png" alt />
              <span>{{ contextMenuData.istop ? "取消置顶" : "置顶会话" }}</span>
            </button>
          </li>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 3, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/delete.png" alt />
              <span>删除会话</span>
            </button>
          </li>
        </template>
        <template
          v-else-if="
            contextMenuData.conversationType !== IMConversationEnum.GATHER
          "
        >
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 1, data: contextMenuData })"
          >
            <button>
              <img
                v-if="contextMenuData.istop"
                src="@/assets/image/approval/cancel.png"
                alt
              />
              <img v-else src="@/assets/image/approval/top.png" alt />
              <span>{{ contextMenuData.istop ? "取消置顶" : "置顶会话" }}</span>
            </button>
          </li>
          <el-divider class="menu-divider"></el-divider>
          <li
            class="menu-item menu-item-normal"
            v-if="contextMenuData.conversationType === IMConversationEnum.GROUP"
            @click.stop="selectMenuHandle({ type: 2, data: contextMenuData })"
          >
            <button>
              <img
                v-if="contextMenuData.isHint"
                src="@/assets/image/approval/no-disturbing.png"
                alt
              />
              <img v-else src="@/assets/image/approval/disturbing.png" alt />
              <span>{{
                contextMenuData.isHint ? "取消免打扰" : "免打扰"
              }}</span>
            </button>
          </li>
          <el-divider
            v-if="contextMenuData.conversationType === IMConversationEnum.GROUP"
            class="menu-divider"
          ></el-divider>
          <li
            v-if="false && contextMenuData.isgroup"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 2, data: contextMenuData })"
          >
            <button>
              <span>群设置</span>
            </button>
          </li>
          <li
            v-if="!contextMenuData.storageId"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 3, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/delete.png" alt />
              <span>删除会话</span>
            </button>
          </li>
          <li
            v-if="false"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 4, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/delete.png" alt />
              <span>添加新成员</span>
            </button>
          </li>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 5, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/empty.png" alt />
              <span>清空聊天记录</span>
            </button>
          </li>
          <el-divider class="menu-divider"></el-divider>
          <li
            v-if="!contextMenuData.storageId"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 6, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/shift-out.png" alt />
              <span>创建收纳组</span>
            </button>
          </li>
          <li
            v-if="!contextMenuData.storageId"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 7, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/add.png" alt />
              <span>加入已有收纳组</span>
            </button>
          </li>
          <li
            v-if="contextMenuData.storageId"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 8, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/shift-out.png" alt />
              <span>移出收纳组</span>
            </button>
          </li>
          <li
            v-if="contextMenuData.storageId"
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 9, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/move.png" alt />
              <span>移动至</span>
            </button>
          </li>
        </template>
        <template v-else>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 10, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/rename.png" alt />
              <span>重命名</span>
            </button>
          </li>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 11, data: contextMenuData })"
          >
            <button>
              <img
                v-if="contextMenuData.isTop == 1"
                src="@/assets/image/approval/cancel.png"
                alt
              />
              <img v-else src="@/assets/image/approval/top.png" alt />
              <span>{{
                contextMenuData.isTop == 1 ? "取消置顶" : "置顶"
              }}</span>
            </button>
          </li>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 12, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/dissolve.png" alt />
              <span>解散收纳组</span>
            </button>
          </li>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 13, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/move.png" alt />
              <span>批量移动</span>
            </button>
          </li>
          <li
            class="menu-item menu-item-normal"
            @click.stop="selectMenuHandle({ type: 14, data: contextMenuData })"
          >
            <button>
              <img src="@/assets/image/approval/folder-add.png" alt />
              <span>添加会话</span>
            </button>
          </li>
        </template>
      </ul>
    </transition>

    <!-- 重命名收纳组弹窗 -->
    <rename-storage
      v-if="renameStorageVisible"
      :menuData="selectMenuData"
      :visible="renameStorageVisible"
      @closeHandle="closeRenameStorageHandle"
    ></rename-storage>

    <!-- 解散收纳组二次确认框 -->
    <delete-storage
      v-if="deleteStorageVisible"
      :menuData="selectMenuData"
      :visible="deleteStorageVisible"
      @closeHandle="closeDeleteStorageHandle"
    ></delete-storage>

    <!-- 收纳组批量移动框 -->
    <batch-operate-storage
      v-if="batchOperateStorageVisible"
      :menuData="selectMenuData"
      :visible="batchOperateStorageVisible"
      @closeHandle="closeBatchOperateStorageHandle"
    ></batch-operate-storage>

    <!-- 收纳组创建窗 -->
    <create-storage
      v-if="createStorageVisible"
      :menuData="selectMenuData"
      :type="createStorageType"
      :visible="createStorageVisible"
      @closeHandle="closeCreateStorageHandle"
    ></create-storage>

    <!-- 加入移动至弹框 -->
    <receiveSetOf
      @handleClose="handleClose"
      :type="groupType"
      v-if="dialogVisible"
      :dialogVisible="dialogVisible"
      :contextMenuData="selectMenuData"
    ></receiveSetOf>

    <!-- 引导页弹框 -->
    <guidePage
      :dialogVisible="guidePageVisible"
      @closeGuidePage="closeGuidePage"
    ></guidePage>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";

import { mapGetters, mapActions } from "vuex";
import { MessageModel, ConversationModel, IMSDKServer } from "../../WebIM";
import globalConfig from "@/global.config";
import messageInfo from "./dialog/message-info";
import receiveSetOf from "./dialog/receive-set-of.vue";
import guidePage from "./dialog/guide-page.vue";

import batchOperateStorage from "./storage/batch-operate-storage.vue";
import createStorage from "./storage/create-storage.vue";
import deleteStorage from "./storage/delete-storage.vue";
import renameStorage from "./storage/rename-storage.vue";
import { sendStorageMessage } from "@/components/chitchat/utils";
import { getHTMLByText } from "@/components/chitchat/storage/storage-name/useStorageName";

const robot = globalConfig.robot;

export default {
  name: "DialogStorageList",
  components: {
    messageInfo,
    receiveSetOf,
    guidePage,
    batchOperateStorage,
    createStorage,
    deleteStorage,
    renameStorage
  },
  data() {
    return {
      currentMenu: "",
      guidePageVisible: false,
      MessageModel,
      ConversationModel,
      IMConversationEnum: ConversationModel.IMConversationEnum,
      MessageType: MessageModel.MessageType,
      contextMenuData: {},
      top: 0,
      left: 0,
      IsShow: false,
      dialogMenuHeight: 259,
      isLoadingNextDialog: false, // 是否正在加载下一页
      batchOperateStorageVisible: false,
      createStorageVisible: false,
      deleteStorageVisible: false,
      renameStorageVisible: false,
      selectMenuData: {},
      dialogVisible: false,
      moveVisible: false,
      groupType: 1,
      createStorageType: 1, //1表示新建，2表示加入会话
      openStorageList: [], // 打开的收纳组ID集合
      loading: false,
      cornerMarker: {
        id: null,
        conversationType: null
      } //搜索到的当前节点对象
    };
  },
  mounted() {
    // 把变量存到localstorage中，当不存在或为空时，要有引导，如果取出来是时间则不处理
    this.guidePageVisible = !localStorage.getItem("storage-guide");
    window.addEventListener("click", this.closeContextMenu);
    window.addEventListener("resize", this.closeContextMenu);
    window.eventHub.$on("open-dialog", this.openConverHandle);
    let watchConver = this.$watch("ConversationSort", () => {
      this.$nextTick(() => {
        if (this.ConversationSort.length) {
          setTimeout(() => {
            this.selectDialog(this.ConversationSort[0], 0);
          }, 300);
        }
      });
    });
    watchConver();
    window.eventHub.$on("send-hander", this.scrollCurrentDialogHandler);
    // window.eventHub.$on("send-hander", this.changeConversationScrollView);
    window.eventHub.$on(
      "scroll-current-dialog-handler",
      this.scrollCurrentDialogHandler
    );
    window.eventHub.$on(
      "scroll-corner-marker-handler",
      this.scrollCornerMarkerHandler
    );
    const openStorageList = localStorage.getItem("openStorageList") || "[]";
    if (!!openStorageList) {
      // 存在脏数据，统一转化为字符串、去重、去空格，兼容以往脏数据
      this.openStorageList = [
        ...new Set(
          JSON.parse(openStorageList)
            .map(item => (item + "").trim())
            .filter(item => item)
        )
      ];
    }
  },
  activated() {
    this.changeConversationScrollView();
  },
  beforeDestroy() {
    window.eventHub.$off("open-dialog", this.openConverHandle);
    window.removeEventListener("click", this.closeContextMenu);
    window.removeEventListener("resize", this.closeContextMenu);
    window.eventHub.$off("send-hander", this.scrollCurrentDialogHandler);
    window.eventHub.$off(
      "scroll-current-dialog-handler",
      this.scrollCurrentDialogHandler
    );
    window.eventHub.$off(
      "scroll-corner-marker-handler",
      this.scrollCornerMarkerHandler
    );
  },
  computed: {
    ...mapGetters({
      TopMap: "GetTopMap",
      AtMsgMap: "GetAtMsgMap",
      GetCompany: "GetCompany",
      AllUserMap: "GetAllUserMap",
      GetConversationSort: "GetConversationSort",
      GetStorageListSort: "GetStorageListSort",
      dialogType: "GetChitchatType",
      OpenDialog: "GetOpenDialog",
      getStorageIdByConversationId: "getStorageIdByConversationId",
      GetDraftListMap: "GetDraftListMap",
      RobotList: "GetRobotList"
    }),
    ConversationSort() {
      let result = [];
      if (this.dialogType === "organization") {
        result = this.GetStorageListSort.organizationList || [];
      } else {
        result = this.GetStorageListSort.outsourceList || [];
      }
      return [...result];
    },
    gatherName() {
      return storageId => {
        const tlist = this.ConversationSort.filter(item => {
          return item.id === storageId;
        });
        return tlist.length > 0 ? tlist[0] : {};
      };
    },
    AtMeMsgMap() {
      let result = {};
      for (const key in this.AtMsgMap) {
        const item = this.AtMsgMap[key];
        if (item.includes(this.GetCompany.accountId)) {
          result[key] = true;
        }
      }
      return result;
    }
  },
  watch: {
    ConversationSort: {
      deep: false,
      handler(val, old) {
        if (val.length !== old.length) {
          this.changeConversationScrollView();
        }
      }
    },
    IsShow: {
      handler(val, oib) {
        if (!val) {
          this.currentMenu = "";
        }
      }
    },
    OpenDialog: {
      deep: true,
      handler(val, old) {
        if (val.id !== old.id) {
          this.changeConversationScrollView();
          const storageId = this.getStorageIdByConversationId(
            val.id,
            val.conversationType
          );
          if (storageId && !this.openStorageList.includes(`${storageId}`)) {
            this.openStorageList.push(`${storageId}`);
          }
        }
      }
    },
    openStorageList: {
      deep: true,
      handler() {
        localStorage.setItem(
          "openStorageList",
          JSON.stringify(this.openStorageList)
        );
      }
    }
  },
  methods: {
    ...mapActions([
      "SetOpenDialog",
      "DeleteDialog",
      "ClearDialogMessage",
      "ChangeNoMoreMsg"
    ]),
    getHTMLByText,
    storageNameFormat(name) {
      const showStorageName = `${(name || "")
        .replace(/^【{1,}/g, "")
        .replace(/】{1,}$/g, "")}`;
      return name ? showStorageName : "";
    },
    closeGuidePage() {
      this.guidePageVisible = false;
    },
    getHintType(num) {
      return this.$myUtils.getHintType(num);
    },
    handleChange(val, row) {
      const storageId = `${row.id}`;
      const index = this.openStorageList.findIndex(item => item === storageId);
      if (val.length) {
        if (index < 0 && storageId) {
          this.openStorageList.push(storageId);
        }
      } else {
        if (index > -1) {
          this.openStorageList.splice(index, 1);
        }
      }
      const idSelector = `#id_${row.conversationType}_${row.id}`;
      const dom = document.querySelector(idSelector);
      if (dom && dom.getBoundingClientRect().top < 89) {
        this.scrollPositionToSelector(idSelector);
      }
    },
    openConverHandle({ id }) {
      for (let i = 0; i < this.ConversationSort.length; i++) {
        let conver = this.ConversationSort[i];
        if (conver.id === id) {
          this.selectDialog(conver, i);
          break;
        }
      }
    },
    //关闭已有收纳组弹框
    handleClose() {
      this.dialogVisible = false;
      this.moveVisible = false;
    },
    // 移出收纳组
    deleteReceiveASetOf() {
      this.loading = true;
      let obj = this.gatherName(this.selectMenuData.storageId);

      let data = {
        fromStorageId: this.selectMenuData.storageId,
        toStorageId: "",
        sessionList: [
          {
            beId: this.selectMenuData.id,
            objectType: this.selectMenuData.conversationType == 1 ? 2 : 1
          }
        ]
      };
      this.$service
        .quitStorage(data)
        .then(response => {
          this.$Message.success("移出成功");
          this.loading = false;
          let sendData = {
            operateType: 4,
            gatherId: obj.id,
            gatherName: obj.name,
            topStatus: obj.isTop == 1 ? 1 : 2, //是否置顶
            belongSubgroup: obj.belongSubgroup, //所属组别，0表示组织会话，1表示外联会话
            moveToGatherId: "", //移动到哪个收纳组
            childInfo: [
              {
                conversationId: this.selectMenuData.id,
                conversationType:
                  this.selectMenuData.conversationType ===
                  this.IMConversationEnum.PRIVATE
                    ? "private"
                    : "group"
              }
            ], //操作收纳组子项
            time: response.ctime,
            extra: "",
            doNotDisturd: obj.isDisturb,
            finalRealChildList: obj.children
              .filter(item => {
                return (
                  item.id !== this.selectMenuData.id ||
                  item.conversationType !== this.selectMenuData.conversationType
                );
              })
              .map(item => {
                return {
                  conversationId: item.id,
                  conversationType:
                    item.conversationType === this.IMConversationEnum.PRIVATE
                      ? "private"
                      : "group"
                };
              })
          };
          sendStorageMessage(sendData);
        })
        .catch(() => {
          this.$Message.error("移出失败");
          this.loading = false;
        });
    },
    selectDialog(item, index) {
      if (
        item.id !== this.OpenDialog.id ||
        item.conversationType !== this.OpenDialog.conversationType
      ) {
        const data = {
          ...item,
          groupType: this.dialogType === "outsource" ? 10 : 0
        };
        this.SetOpenDialog({
          ...data
        });
        try {
          IMSDKServer.clearConversitionUnreadCount(
            data.conversationType,
            data.id
          );
        } catch (error) {}
      }
    },
    async selectMenuHandle({ type, data }) {
      let onOff = null;
      this.selectMenuData = data;
      switch (type) {
        case 1:
          // 置顶设置
          if (data.istop) {
            onOff = 2; // 取消
          } else {
            onOff = 1; // 添加
          }
          this.setDialogAtte(data, 1, onOff);
          data.id === this.OpenDialog.id && this.changeConversationScrollView();
          break;
        case 2:
          // 免打扰设置
          if (data.isHint) {
            onOff = 2; // 取消
          } else {
            onOff = 1; // 添加
          }
          this.setDialogAtte(data, 2, onOff);
          break;
        case 3:
          if (data.id.includes("robot_")) {
            // 删除机器人会话时更新数据库
            const robot = this.RobotList.find(
              item => item.accountId === data.id
            );
            if (robot) {
              ipcRenderer.invoke("sqlite-url", {
                key: "saveIncreaseRobot",
                data: { data: [{ ...robot, isDelinConversation: 1 }] }
              });
            }
          }
          // 删除会话
          this.deleteDialog(data);
          this.ChangeNoMoreMsg({
            data: data.id,
            action: "del",
            conversationType: data.conversationType
          });
          break;
        case 4:
          break;
        case 5: // 清空聊天记录
          this.ClearDialogMessage({ ...data, clearLatest: true });
          this.ChangeNoMoreMsg({
            data: data.id,
            action: "del",
            conversationType: data.conversationType
          });
          data.id === this.OpenDialog.id && this.changeConversationScrollView();
          break;
        case 6: //创建收纳组
          this.openCreateStorageHandle();
          break;
        case 7:
          //加入已有收纳租
          this.dialogVisible = true;
          this.groupType = 1;
          break;
        case 8:
          //移出收纳组
          this.deleteReceiveASetOf();
          break;
        case 9:
          //移动至
          this.dialogVisible = true;
          this.groupType = 2;

          break;
        case 10:
          //重命名
          this.openRenameStorageHandle();
          break;
        case 11:
          //置顶(收纳组)
          this.setStorageTop();
          break;
        case 12:
          // 解散收纳组
          this.openDeleteStorageHandle();
          break;
        case 13:
          //批量移动
          this.openBatchOperateStorageHandle();
          break;
        case 14:
          //加入会话
          this.openJoinStorageHandle(data);
          break;
        default:
          break;
      }
      this.closeContextMenu();
      window.eventHub.$emit("native-click");
    },
    setDialogAtte(data, operateType, onOff) {
      this.$service.setGroupAttribute.call(this, {
        beId: data.id,
        conversationType: data.conversationType,
        operateType,
        topStatus: data.istop ? 1 : 2,
        doNotDisturb: data.isHint ? 1 : 2,
        onOff
      });
    },
    async setStorageTop() {
      this.loading = true;
      const data = this.selectMenuData;
      this.$service
        .setStorageTop({
          storageId: data.id,
          isTop: data.isTop == 1 ? 2 : 1
        })
        .then(({ ctime }) => {
          this.$Message.success(
            `${data.isTop == 1 ? "取消置顶收纳组成功" : "置顶收纳组成功"}`
          );
          this.loading = false;
          sendStorageMessage({
            operateType: 2,
            gatherId: data.id,
            gatherName: data.name,
            topStatus: data.isTop == 1 ? 2 : 1,
            belongSubgroup: data.belongSubgroup,
            moveToGatherId: "",
            childInfo: [],
            time: ctime,
            extra: "",
            doNotDisturb: data.isDisturb,
            finalRealChildList: data.children.map(item => {
              return {
                conversationId: item.id,
                conversationType:
                  item.conversationType === this.IMConversationEnum.PRIVATE
                    ? "private"
                    : "group"
              };
            })
          });
        })
        .catch(error => {
          this.$Message.error(
            `${data.isTop == 1 ? "取消置顶收纳组成功" : "置顶收纳组成功"}`
          );
          this.loading = false;
        });
    },
    deleteDialog(data) {
      this.DeleteDialog({ data });
    },
    contextmenuHandle(e, data) {
      this.IsShow = false;
      this.currentMenu = data.conversationType + data.id;
      this.contextMenuData = data;
      setTimeout(() => {
        if (this.$refs.dialogMenu) {
          this.dialogMenuHeight =
            this.$refs.dialogMenu.clientHeight || this.dialogMenuHeight;
        }
        const xEvent = e.clientX;
        const yEvent = e.clientY;
        const winY = window.innerHeight;
        this.top = yEvent;
        this.left = xEvent;
        if (yEvent + this.dialogMenuHeight > winY) {
          this.top = yEvent - this.dialogMenuHeight;
        }
        this.IsShow = true;
      }, 200);
    },
    closeContextMenu() {
      this.IsShow = false;
      this.contextMenuData = {};
    },
    changeConversationScrollView() {
      this.$nextTick(() => {
        const activeDom = document.querySelector(".is-selected");
        activeDom && activeDom.scrollIntoViewIfNeeded(false);
      });
    },
    openCreateStorageHandle() {
      this.createStorageType = 1; //默认是1表示创建，2表示加入会话
      this.createStorageVisible = true;
    },
    openJoinStorageHandle(data) {
      this.createStorageType = 2;
      this.selectMenuData = data;
      this.createStorageVisible = true;
    },
    closeCreateStorageHandle() {
      this.createStorageVisible = false;
    },
    openRenameStorageHandle() {
      this.renameStorageVisible = true;
    },
    closeRenameStorageHandle() {
      this.renameStorageVisible = false;
    },
    openDeleteStorageHandle() {
      this.deleteStorageVisible = true;
    },
    closeDeleteStorageHandle() {
      this.deleteStorageVisible = false;
    },
    openBatchOperateStorageHandle() {
      if (
        this.selectMenuData.children &&
        this.selectMenuData.children.length > 0
      ) {
        this.batchOperateStorageVisible = true;
      } else {
        this.$Message.warning("暂无可移动会话");
      }
    },
    closeBatchOperateStorageHandle() {
      this.batchOperateStorageVisible = false;
    },
    // 监听到发送至消息，需要滑动到当前会话的位置，如果在收纳组里则需要打开
    scrollCurrentDialogHandler(dialog) {
      if (!dialog.id || !dialog.conversationType) {
        console.error("传递的参数有误，错误参数为：", dialog);
        return;
      }
      console.error("传递的参数：", dialog);
      const storageId = this.getStorageIdByConversationId(
        dialog.id,
        dialog.conversationType
      );
      if (storageId && !this.openStorageList.includes(`${storageId}`)) {
        this.openStorageList.push(`${storageId}`);
      }
      const top = this.getAutoLocation();
      this.convertCornerMarkerToSelector(dialog, { top });
    },
    getAutoLocation(initPersent) {
      // 动态计算当前角标前面空几个收纳组或会话合理
      // ps:该算法只是粗略估计并不精准
      let result = 0;
      try {
        const totalHeight = document.body.clientHeight; //总高度
        const headHeight = 88; //顶部标题+组织外联的高度占88个像素
        const percent = initPersent || 0.4; //与产品沟通暂定40%的靠上高度；
        result = -Math.round((totalHeight - headHeight) * percent);
      } catch (err) {
        console.error(err);
        result = 0;
      } finally {
        return result;
      }
    },
    // 将cornerMarker对象转化为id选择器，并跳转到指定对象上
    convertCornerMarkerToSelector(cornerMarker, option) {
      console.log("滚动", ...option);

      if (typeof cornerMarker == "string") {
        const selector = cornerMarker;
        this.scrollPositionToSelector(selector, option);
      } else {
        if (cornerMarker && cornerMarker.id && cornerMarker.conversationType) {
          const idSelector = `#id_${cornerMarker.conversationType}_${cornerMarker.id}`; //加id_前缀是因为开发环境的浏览器不支持数字开头的id选择器；但属性值选择器无此限制
          console.log("滚动", idSelector);
          this.scrollPositionToSelector(idSelector, option);
        } else {
          console.error("查找的位置有误，错误位置信息为：", cornerMarker);
        }
      }
    },
    // 滚动到指定的选择器上
    scrollPositionToSelector(selector, option) {
      this.$nextTick(() => {
        try {
          let activeDom = this.getVisibleElement(
            document.querySelector(`${selector}`)
          );
          activeDom && activeDom.scrollIntoView(true);
          if (option && option.top) {
            const dom = document.querySelector(`.dialog-list`);
            if (dom && dom.getBoundingClientRect()) {
              const belowScroll = Math.round(
                dom.scrollHeight - dom.scrollTop - dom.clientHeight
              );
              const isScrollToEnd = belowScroll > 0;
              const bottomDistance = Math.round(
                dom.getBoundingClientRect().bottom -
                  activeDom.getBoundingClientRect().bottom
              );
              const topDistance = Math.round(
                activeDom.getBoundingClientRect().top -
                  dom.getBoundingClientRect().top
              );
              let top = 0;
              if (isScrollToEnd) {
                top = option.top;
              } else if (bottomDistance + option.top > 0) {
                top = topDistance + option.top;
              } else {
                top = -belowScroll;
              }
              dom.scrollBy({
                top: top
              });
            }
          }
        } catch (err) {
          console.error(err);
        }
      });
    },
    // 监听到双击对话的消息，查找定位即将滑动到的会话或收纳组id，如果没有则滑动到当前选中的位置
    scrollCornerMarkerHandler() {
      const cornerMarker = this.getNextCornerMarker() || ".is-selected";
      const top = this.isBelongOpenGather(cornerMarker) ? -60 : 0;
      this.convertCornerMarkerToSelector(cornerMarker, {
        top
      });
    },
    // 查找下一个位置
    getNextCornerMarker() {
      try {
        const reOrderlist = this.changeOrderList(this.ConversationSort);
        const numberCondition = item =>
          item.reminderNumber &&
          item.reminderNumber > 0 &&
          (!item.isHint || item.isAtMe);
        const dotCondition = item =>
          item.reminderNumber &&
          item.reminderNumber > 0 &&
          item.isHint &&
          !item.isAtMe;
        let result = this.findOneByCondition(reOrderlist, numberCondition);
        if (!result) {
          result = this.findOneByCondition(reOrderlist, dotCondition);
        }
        if (result) {
          this.cornerMarker = result;
        }
        return result;
      } catch (err) {
        return null;
      }
    },
    changeOrderList(rawlist) {
      const { id, conversationType } = this.cornerMarker;
      // 如果长度小于2，不用调整顺序
      if (rawlist.length < 2) {
        return rawlist;
      }
      // 如果没有当前值，不用调整顺序
      if (!id || !conversationType) {
        return rawlist;
      }
      let list = [...rawlist];
      let ind = list.length; //外层数组的下表
      let subInd = 0; //收纳组中children的下标
      // 查找当前节点在列表中对应的下标
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.conversationType == this.IMConversationEnum.GATHER) {
          if (item.id == id && item.conversationType == conversationType) {
            ind = i;
            subInd = 0;
            break;
          } else {
            let findit = false;
            for (let j = 0; j < item.children.length; j++) {
              const subItem = item.children[j];
              if (
                subItem.id == id &&
                subItem.conversationType == conversationType
              ) {
                ind = i;
                subInd = j;
                findit = true;
                break;
              }
            }
            if (findit) {
              break;
            }
          }
        } else {
          if (item.id == id && item.conversationType == conversationType) {
            ind = i;
            break;
          }
        }
      }
      // 如果没有找到，不要调整顺序
      if (ind == list.length) {
        return rawlist;
      }
      let current = { ...list[ind] };
      const isGatherAndOpen = this.isGatherAndOpen(current);
      if (isGatherAndOpen) {
        current.children = current.children.slice(subInd + 1);
        current.reminderNumber = current.children.reduce((total, current) => {
          total += current.isHint ? 0 : current.reminderNumber || 0;
          return total;
        }, 0);
        list = [current, ...list.slice(ind + 1), ...list.slice(0, ind + 1)];
      } else {
        list = [...list.slice(ind + 1), ...list.slice(0, ind + 1)];
      }
      return list;
    },
    isGatherAndOpen(cornerMarker) {
      const isGather =
        cornerMarker.conversationType == this.IMConversationEnum.GATHER;
      const isOpen = this.openStorageList.includes(cornerMarker.id);
      return isGather && isOpen;
    },
    isBelongOpenGather(cornerMarker) {
      try {
        let storageId;
        if (typeof cornerMarker == "string") {
          const dom = document.querySelector(cornerMarker);
          if (dom && dom.id) {
            const id = dom.id.split("_")[2];
            const conversationType = parseInt(dom.id.split("_")[1]);
            storageId = this.getStorageIdByConversationId(id, conversationType);
          } else {
            return false;
          }
        } else {
          storageId = this.getStorageIdByConversationId(
            cornerMarker.id,
            cornerMarker.conversationType
          );
        }
        return this.openStorageList.includes(storageId);
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    getVisibleElement(dom) {
      try {
        let tdom = dom;
        while (tdom && tdom.getBoundingClientRect().height == 0) {
          tdom = tdom.parentElement;
        }
        return tdom;
      } catch (err) {
        console.error(err);
        return dom;
      }
    },
    findOneByCondition(rawlist, fn) {
      let result = null;
      const obj = rawlist.find(fn);
      if (obj && obj.id && obj.conversationType) {
        const isGatherAndOpen = this.isGatherAndOpen(obj);
        if (isGatherAndOpen) {
          const subObj = obj.children.find(fn);
          if (subObj && subObj.id && subObj.conversationType) {
            result = {
              id: subObj.id,
              conversationType: subObj.conversationType
            };
          }
        } else {
          result = {
            id: obj.id,
            conversationType: obj.conversationType
          };
        }
      }
      return result;
    }
  }
};
</script>

<style lang="scss" scoped>
.dialog-list {
  .dialog-container {
    .dialog-item {
      .el-collapse {
        .collapse-storage {
          ::v-deep {
            div[role="tab"] {
              position: sticky;
              top: 0px;
              z-index: 2;
            }
          }
        }
      }
      .el-collapse-item__header {
        .hint-badge-container-s {
          .hint-sign {
            ::v-deep .ivu-badge-dot {
              top: -3px;
              right: -16px;
            }
          }
        }
      }
      &.is-selected {
        // .msg-info-box {
        //   ::v-deep * {
        //     color: #fff !important;
        //   }
        // }
      }
      .msg-container {
        .msg-container-right {
          .hint-sign {
            .hint-sign {
              ::v-deep .ivu-badge-dot {
                top: 2px;
                right: -18px;
              }
            }
          }
        }
      }
      .hint-badge-container {
        .hint-sign {
          ::v-deep .ivu-badge-dot {
            top: 2px;
            right: -18px;
          }
        }
      }
    }
    .menu-color-outsource {
      .hint-badge-container-left {
        .hint-sign {
          ::v-deep .ivu-badge-dot {
            top: 2px;
            right: -16px;
          }
        }
      }
    }
  }
  ::v-deep .at-user {
    color: #f74c31;
  }
}
</style>
<style lang="scss">
@import "~@/assets/styles/constant";

.dialog-list {
  width: 100%;
  height: 100%;
  overflow: hidden auto;
  user-select: none;
  .dialog-container {
    width: 100%;
    .menu-color {
      background-color: rgba(240, 245, 255, 1) !important;
      .el-collapse-item__header {
        background-color: rgba(240, 245, 255, 1) !important;
      }
    }
    .menu-color-outsource {
      background-color: rgba(240, 255, 250, 1) !important;
      .el-collapse-item__header {
        background-color: rgba(240, 255, 250, 1) !important;
      }
    }

    .dialog-item {
      position: relative;
      display: flex;
      align-items: center;
      box-shadow: 0px -1px 0px 0px #f4f6f8;
      width: 100%;
      height: 60px;
      background-color: #fff;
      transition: 0.1s linear;
      .el-collapse {
        border-top: 0px solid #ebeef5;
        border-bottom: 0px solid #ebeef5;
        position: relative;
        .el-collapse-item__arrow {
          display: none;
        }
      }
      .el-collapse-item__wrap {
        background-color: #f4f6f8;
      }
      .el-collapse-item__content {
        padding-bottom: 0px;
      }
      .el-collapse-item__header {
        display: flex;
        align-items: flex-start;
        padding: 0px 16px;
        padding-bottom: 10px;
        overflow: hidden;
        box-sizing: border-box;
        height: fit-content;
        max-height: 85px;
        .storage-title-left {
          flex-shrink: 0;
          > img {
            width: 40px;
            height: 40px;
            margin-right: 13px;
            margin-top: 5px;
          }
        }
        .storage-title-right {
          flex: 1;
          overflow: hidden;
          .storage-title-right-top {
            padding-top: 15px;
            display: flex;
            line-height: 1;
            align-items: center;
            color: #1f2329;
            .name {
              font-size: 16px;
              line-height: 22px;
              font-family: PingFangSC-Medium, PingFang SC;
              font-weight: 500;
              color: #1f2329;
              max-width: calc(100% - 60px);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;

              img {
                width: 18px;
                vertical-align: sub;
              }
            }
            .num-info {
              flex-shrink: 0;
              font-size: 12px;
              font-family: PingFangSC-Regular, PingFang SC;
              font-weight: 400;
              color: #8f959e;
            }
            .snImg {
              flex-shrink: 0;
              width: 14px;
              height: 14px;
              margin-top: 2px;
              margin-left: auto;
            }
          }
          .storage-title-right-bottom {
            margin-top: 8px;
            line-height: 1;
            flex-shrink: 0;
            display: flex;

            .item-time-color {
              color: #bbb;
              font-size: 12px;
              padding-top: 2px;
            }
            .conversation-message {
              flex: 1;
              .conversation-name {
                font-size: 12px;
                font-family: PingFangSC-Medium, PingFang SC;
                font-weight: 500;
                color: #1f2329;
                flex-shrink: 0;
              }
              .msg-info {
                white-space: normal;
                height: auto;
                text-overflow: -o-ellipsis-lastline;
                overflow: hidden;
                text-overflow: ellipsis;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                line-clamp: 2;
                -webkit-box-orient: vertical;
              }
            }
          }
        }
        .hint-badge-container-s {
          top: -13px !important;
          position: absolute;
          left: 41px;

          font-size: 0;
          .ivu-badge {
            line-height: 0;
            font-size: 0;
          }
        }
      }
      &::after {
        content: "";
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 0;
      }

      &.is-selected {
        // color: #fff;
        // &.is-top {
        //   .top-sign {
        //     display: none;
        //   }
        // }
        // .item-name,
        // .item-time,
        // .msg-info-box {
        //   color: #fff !important;
        // }
        // .show-draft {
        //   color: #fff !important;
        // }
      }
      .el-collapse-item__header,
      &.is-top {
        position: relative;
        .top-sign {
          position: absolute;
          width: 12px;
          height: 12px;
          top: 2px;
          right: 2px;
          // background-image: url("~@/assets/image/top-sign-in.png");
          background-repeat: no-repeat;
          background-size: 100% 100%;
          // > div {
          //   width: 90%;
          //   height: 90%;
          //   border-radius: 11px 0 0;
          //   background: #fff;
          //   position: absolute;
          //   right: 0;
          //   bottom: 0;
          // }
        }
      }
      .el-collapse {
        width: 100%;
        &:hover {
          cursor: pointer !important;
          background-color: $--menu-hover-bgcolor !important;
        }
      }
      .star-sign {
        width: 12px;
        height: 12px;
        font-size: 12px;
        flex: 0 0 12px;
        color: #ffbe00;
      }
      .avatar-box {
        margin: {
          right: 10px;
          left: 5px;
        }
        width: 40px;
        height: 40px;
        flex-basis: 40px;
        flex-shrink: 0;
        border-radius: 100%;
        overflow: hidden;
      }
      .msg-container {
        width: calc(100% - 84px);
        flex: 1 1 calc(100% - 84px);
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        font-size: 14px;
        overflow: hidden;
        line-height: 1;
        .msg-container-left {
          margin-bottom: 9px;
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          .item-name {
            align-items: center;
            color: #000;
            font-size: 14px;
            font-weight: 500;
            height: 16px;
            margin-right: 6px;
          }
          .group-sign {
            margin: 0 6px;
          }
          .item-time {
            margin-left: auto;
            margin-right: 16px;
            flex-shrink: 0;
            height: 15px;
            line-height: 15px;
            max-width: 120px;
            white-space: nowrap;
            font-size: 12px;
            color: #bbb;
          }
        }
        .msg-container-right {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 16px;
          position: relative;

          .msg-info-wrapper {
            flex: 1;
            overflow: hidden;
            .show-draft {
              width: 100%;
              height: 16px;
              display: flex;
              align-items: flex-start;
              justify-content: flex-start;
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              color: #999;
              font-size: 12px;
              > span {
                color: red !important;
                margin-right: 4px;
              }
            }
          }
          .iconfont {
            font-size: 12px;
          }
          .set-top-sign {
            color: #bbb;
            margin-right: 16px;
          }
          .hint-sign {
            position: absolute;
            left: 40px;
            top: 6px;
            font-size: 0;
            .ivu-badge {
              line-height: 0;
              font-size: 0;
            }
          }
        }
      }

      .hint-badge-container {
        position: absolute;
        left: 40px;
        top: 6px;
        font-size: 0;
        .ivu-badge {
          line-height: 0;
          font-size: 0;
        }
      }
      .hint-badge-container-left {
        position: absolute;
        left: 65px;
        top: 6px;
        font-size: 0;
        .ivu-badge {
          line-height: 0;
          font-size: 0;
        }
      }
    }
    .dialog-item-organization {
      &:hover:not(.is-selected) {
        cursor: pointer !important;
        background-color: rgba(240, 245, 255, 1) !important;
      }
      .el-collapse-item__header:hover {
        cursor: pointer !important;
        background-color: rgba(240, 245, 255, 1) !important;
      }
    }
    .dialog-item-outsource {
      &:hover:not(.is-selected) {
        cursor: pointer !important;
        background-color: rgba(240, 255, 250, 1) !important;
      }
      .el-collapse-item__header:hover {
        cursor: pointer !important;
        background-color: rgba(240, 255, 250, 1) !important;
      }
    }
    .dialog-item-bottom {
      padding-left: 30px;
      background: #f7f7f9;
    }
    .dialog-item-left {
      padding-left: 10px;
    }
    .storage__div--withoutsession {
      background: #f7f7f9;
      height: 50px;
      display: flex;
      justify-content: center;
      .el-button.is-disabled {
        color: #bbb;
      }
      .el-button--text {
        color: #3e7eff;
      }
    }
  }

  .menu-box {
    position: fixed;
    z-index: 999;
    width: 150px;
    background: rgba(255, 255, 255, 1);
    border-radius: 4px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    padding: 8px 0;
    > li:not(:last-of-type) {
    }
    .menu-divider {
      margin: 1px 8%;
      padding: 0px;
      width: 84%;
    }
    li.menu-item-normal {
      height: 36px;
      img {
        top: 10px;
      }
      > button {
        height: 36px;
        margin: 0px 0;
        padding: 0;
        &:hover {
          height: 34px;
          padding: 0;
          margin: 1px 0;
        }
      }
    }
    .menu-item {
      width: 100%;
      height: 48px;
      position: relative;
      cursor: pointer;
      img {
        width: 16px;
        height: 16px;
        position: absolute;
        left: 16px;
        top: 16px;
      }
      span {
        float: left;
        padding-left: 40px;
      }
      > button {
        width: 100%;
        height: 48px;
        background-color: transparent;
        transition: background-color 0.15s linear;
        font-size: 14px;
        color: #000;
        &:hover {
          height: 30px;
          padding: 0;
          margin: 9px 0;
          background-color: $--menu-hover-bgcolor;
        }
      }
    }
  }

  &.organization {
    .is-selected {
      // background: linear-gradient(
      //   90deg,
      //   rgba(62, 126, 255, 0.8) 0%,
      //   #3e7eff 100%
      // ) !important;
      background: #E0EAFF;
    }
    .top-sign {
      // background: #3e7eff;
      background-image: url("~@/assets/image/top-sign-in.png");
    }
    .item-time {
      &.current {
        color: #3e7eff !important;
        font-size: 12px;
      }
    }
  }
  &.outsource {
    .is-selected {
      // background: linear-gradient(
      //   270deg,
      //   #36d18e 0%,
      //   rgba(54, 209, 142, 0.8) 100%
      // ) !important;
      background: #DFF7ED;
    }
    .top-sign {
      // background: #36d18e;
      background-image: url("~@/assets/image/top-sign-out.png");
    }
    .item-time {
      &.current {
        color: #36d18e !important;
        font-size: 12px;
      }
    }
  }
}
</style>
