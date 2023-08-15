<template>
  <div id="storage-list">
    <el-dialog
      v-loading="loading"
      title="选择移入哪个组"
      :visible="visible"
      custom-class="storage-list-dialog"
      :center="true"
      width="346px"
      :class="isOrganization ? 'organization' : 'outsource'"
      :before-close="closeHandle"
    >
      <div v-if="storageListBeforeFilter.length > 0" class="box">
        <div class="search">
          <el-input v-model="searchText" placeholder="搜索">
            <i slot="prefix" class="el-input__icon el-icon-search"></i>
          </el-input>
        </div>

        <div class="content">
          <div
            @click="summitHandle(item)"
            :class="isOrganization ? 'content-list' : 'wxcontent-list'"
            v-for="item in storageList"
            :key="item.id"
          >
            <div class="content-img">
              <img :src="packGroupIcon" alt="" />
            </div>
            <div class="content-name">
              <!-- 【{{ storageNameFormat(item.name) }}】 -->
              【<span class="stroage-name"  :title="item.name" v-html="getHTMLByText(storageNameFormat(item.name))"></span>】
            </div>
          </div>
        </div>
      </div>
      <div v-else class="box">
        <div class="box-null">
          <img :src="noData" alt="" />
        </div>
        <div class="fontSize">暂无其他收纳组</div>
        <div class="btn">
          <el-button @click="createStorage()" :loading="loading" type="primary"
            >创建收纳组</el-button
          >
        </div>
      </div>
    </el-dialog>

    <create-storage
      v-if="createStorageVisible"
      :menuData="menuData"
      :visible="createStorageVisible"
      @afterCreateStorage="afterCreateStorageHandle"
      @closeHandle="createStorageVisible = false"
    ></create-storage>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import createStorage from "@/components/chitchat/storage/create-storage.vue";
import { getHTMLByText } from  '@/components/chitchat/storage/storage-name/useStorageName';

export default {
  name: "StorageList",
  components: { createStorage },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    menuData: {
      type: Object,
      default: function() {
        return {};
      }
    }
  },
  data() {
    return {
      searchText: "",
      loading: false,
      createStorageVisible: false
    };
  },
  computed: {
    ...mapGetters({
      GetStorageListSort: "GetStorageListSort",
      dialogType: "GetChitchatType"
    }),
    isOrganization() {
      return this.dialogType === "organization";
    },
    storageId() {
      return this.menuData.id;
    },
    storageListBeforeFilter() {
      return this.GetStorageListSort.storageList.filter(item => {
        return (
          item.belongSubgroup == (this.isOrganization ? 0 : 1) &&
          item.id !== this.storageId
        );
      });
    },
    storageList() {
      const searchText = this.searchText;
      return this.storageListBeforeFilter.filter(item => {
        return item.name.includes(searchText);
      });
    },
    packGroupIcon() {
      return require(this.isOrganization
        ? "@/assets/image/approval/pack-group-icon.png"
        : "@/assets/image/approval/wx-pack-group-icon.png");
    },
    noData() {
      return require(this.isOrganization
        ? "@/assets/image/approval/no-data.png"
        : "@/assets/image/approval/wx-no-data.png");
    }
  },
  methods: {
    getHTMLByText,
    storageNameFormat(name) {
      const showStorageName = `${(name || "")
        .replace(/^【{1,}/g, "")
        .replace(/】{1,}$/g, "")}`;
      return name ? showStorageName : "";
    },
    closeHandle() {
      this.$emit("closeHandle");
    },
    summitHandle(currentSession) {
      this.$emit("summitHandle", currentSession);
    },
    createStorage() {
      this.createStorageVisible = true;
    },
    async afterCreateStorageHandle(obj) {
      await this.$emit("summitHandle", obj);
      this.$emit("handleClose");
    }
  }
};
</script>
<style lang="scss">
#storage-list {
  height: 100%;
  .content-name {
    max-width: 88%;
  }
  .stroage-name {
    // display: inline-flex;
    // align-items: center;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    img {
      width: 18px;
      vertical-align: sub;
    }
  }
  .el-dialog--center {
    height: 500px;
  }
  .storage-list-dialog {
    position: fixed !important;
    left: 50% !important;
    top: 50% !important;
    margin: -250px 0 0 -173px !important;
    border-radius: 8px !important;
  }
  .el-dialog__body {
    padding: 25px 0px 30px !important;
  }
  .box {
    .search {
      padding: 0px 20px;
    }
    .box-null {
      text-align: center;
      img {
        width: 40%;
        height: 40%;
      }
    }
    .fontSize {
      text-align: center;
      margin-top: 10px;
      height: 14px;
      font-size: 14px;
      font-family: MicrosoftYaHei;
      color: #999999;
      line-height: 14px;
    }
    .btn {
      text-align: center;
      margin-top: 40%;
    }
  }
  .el-dialog__header {
    height: 50px;
    background: #f3f4f5;
    border-radius: 4px 4px 0px 0px;
    padding: 15px 20px 10px;
    color: #1f2329;

    .el-dialog__title {
      font-size: 14px;
    }
    .el-dialog__headerbtn {
      top: 15px;
      right: 16px;
    }
  }
  .content {
    margin-top: 10px;
    height: 370px;
    overflow: hidden;
    overflow-y: auto;
    .wxcontent-list {
      display: flex;
      align-items: center;
      height: 60px;
      background: #ffffff;
      cursor: pointer !important;
      padding-left: 30px;
      .content-img {
        > img {
          width: 30px;
          height: 30px;
        }
      }

      &:hover {
        background: url("~@/assets/image/approval/wxicon.png") no-repeat 12px
          25px rgba(54, 209, 142, 0.07);
        background-size: 12px 12px;
      }

      .content-pitch {
        img {
          width: 12px;
          height: 12px;
        }
      }
      .content-name {
        display: flex;
        align-items: center;
        padding-left: 16px;
        color: #1f2329;
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
      }
    }
    .content-list {
      display: flex;
      align-items: center;
      height: 60px;
      background: #ffffff;
      cursor: pointer !important;
      padding-left: 30px;
      .content-img {
        > img {
          width: 30px;
          height: 30px;
        }
      }

      &:hover {
        color: #1f2329;
        background: url("~@/assets/image/approval/icon.png") no-repeat 12px 25px
          rgba(62, 126, 255, 0.07);
        background-size: 12px 12px;
      }

      .content-pitch {
        img {
          width: 12px;
          height: 12px;
        }
      }
      .content-name {
        display: flex;
        align-items: center;
        padding-left: 16px;
        color: #1f2329;
        font-size: 14px;
        font-family: MicrosoftYaHei;
        color: #1f2329;
      }
    }
  }
}
</style>
