<template>
  <div class="statistics-info-container">
    <div class="statistics-title">
      <span class="title">组织统计</span>
      <span class="explain" @click="showTip">统计说明</span>
    </div>
    <div class="statistics-total">
      <div class="statistics-total-title">我的全部企业：{{totalCompany}}家</div>
      <div class="statistics-total-content">
        <div v-for="item in totalInfo" :key="item.name" class="statistics-total-block">
          <div class="statistics-total-block-left">
            <img :src="item.image" alt="">
          </div>
          <div class="statistics-total-block-right">
            <div class="label">{{item.name}}</div>
            <div class="value" :style="{color: item.color}">{{item.value}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="statistics-company">
      <org-company-info v-for="item in companyList" :key="item.corpName" :companyInfo="item"></org-company-info>
    </div>
    <el-dialog
      title="统计说明"
      :visible.sync="showTipDialog"
      custom-class="tipDialog"
    >
      <div class="dialog-content">
        <div class="tip-item" v-for="item in tipList" :key="item.name">
          <div class="title">{{item.name}}</div>
          <div class="value">{{item.value}}</div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="closeDialog">取 消</el-button>
        <el-button @click="closeDialog">确 定</el-button
        >
      </span>
    </el-dialog>
  </div>
</template>
<script>
import { mapGetters } from "vuex";
import OrgCompanyInfo from "@/components/contacts/org-company-info";
export default {
  name: "OrgStatisticsDetail",
  components: {
    OrgCompanyInfo
  },
  data() {
    return {
      totalCompany: 10,
      totalInfo: [
        {
          name: "实际全部成员",
          key: "totalMemberNum",
          color: "#528FFF",
          image: require("@/assets/image/statistics/icon-really-people.png"),
          value: "1000"
        },
        {
          name: "我可见的全部成员",
          key: "canSeeMemberTotalNum",
          color: "#04D486",
          image: require("@/assets/image/statistics/icon-my-see.png"),
          value: "900"
        },
        // {
        //   name: "我不可见得全部成员",
        //   color: "#8F959E",
        //   image: require("@/assets/image/statistics/icon-not-see.png"),
        //   value: "100"
        // }
      ],
      companyList: [],
      showTipDialog: false, // 展示统计说明
      tipList: [
        { name: "组织统计说明:", value: "可查看所在企业/组织的相关组织架构实际统计数据。" },
        { name: "实际全部成员数:", value: "指当前用户入职的企业/加入的组织的「实际成员数」之和。统计包括设置隐藏/开启隐私的成员，入职多部门的成员，按1计算。" },
        { name: "我不可见的全部成员数:", value: "指当前用户入职的企业/加入的组织的「我不可见的成员数」之和。" },
        { name: "我可见的全部成员数:", value: "指当前用户入职的企业/加入的组织的「我可见的成员数」之和。" },
        { name: "实际成员数:", value: "指当前登录用户可见企业内的全部成员数量，统计包括设置部门]隐藏/开启隐私模式的成员。" },
        { name: "我不可见的成员数:", value: "指按公司管理要求，设置了某些部门及其成员隐藏或指定可见范围后，导致当前用户不可见的成员数量统计。" },
        { name: "我可见的成员数:", value: "指当前登录用户可见的「通讯录成员数」，取决于部门设置项。" },
        { name: "事业部数量:", value: "指在部门编辑中，勾选了[事业部]标识的部门总数量，包括隐藏的事业部、空事业部(无成员)。" },
        { name: "各级别部门数量:", value: "统计不同级别的部]数量，包括空部门、对当前用户隐藏的部门数量。" },
        { name: "关联企业数量:", value: "统计与当前企业建立关联关系的企业数量。包括上线即、上下游、协会会员等。" }
      ]
    };
  },
  created() {},
  mounted() {
    this.init();
  },
  computed: {
    ...mapGetters({
      GetCompany: "GetCompany",
    }),
  },
  watch: {
  },
  methods: {
    showTip() {
      this.showTipDialog = true;
    },
    closeDialog() {
      this.showTipDialog = false;
    },
    async init() {
      try {
        const response = await this.$service.getCorpStatistics({accountId: this.GetCompany.accountId});
        this.companyList = response.corpStatisticList || [];
        this.totalCompany = response.corpNum || 0;
        this.totalInfo = this.totalInfo.map(item => {
          return {
            ...item,
            value: response[item.key] || '0'
          }
        })
      } catch (error) {
        this.companyList = [];
        this.totalCompany = 0;
        this.totalInfo = this.totalInfo.map(item => {
          return {
            ...item,
            value: '0'
          }
        })
      }
    }
  }
};
</script>
<style lang="scss" scoped>
.statistics-info-container {
  background: #F6F6F6;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  .statistics-title {
    width: 100%;
    height: 40px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    font-size: 14px;
    padding: 0 20px;
    background: #ffffff;
    flex-shrink: 0;
    .title {
      color: #1F2329;
    }
    .explain {
      cursor: pointer;
      color: #4498F0;
    }
  }
  .statistics-total {
    background: #ffffff;
    margin: 10px;
    box-shadow: 0px 0px 14px 0px rgba(147, 157, 176, 0.2);
    border-radius: 4px;
    flex-shrink: 0;
    &-title {
      height: 40px;
      display: flex;
      align-items: center;
      padding-left: 20px;
      font-size: 14px;
      font-family: PingFangSC-Medium, PingFang SC;
      font-weight: bold;
      color: #1F2329;
      border-bottom: 1px dashed #E7E7E7;
    }
    &-content {
      height: calc(100% - 40px);
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      padding-left: 20px;
      padding-top: 20px;
      > div {
        display: flex;
        align-items: center;
        margin: 0 70px 20px 0;
        .statistics-total-block-left {
          margin-right: 8px;
          img {
            width: 46px;
            height: 46px;
          }
        }
        .statistics-total-block-right {
          line-height: 1;
          .label {
            font-size: 14px;
            font-family: PingFangSC-Regular, PingFang SC;
            font-weight: 400;
            color: #5D616B;
            flex-shrink: 0;
            margin-bottom: 4px;
          }
          .value {
            font-size: 30px;
            font-family: DINCondensedC;
          }
        }
      }
    }
  }
  .statistics-company {
    flex: 1;
    overflow-y: auto;
    display: flex;
    align-content: flex-start;
    flex-wrap: wrap;
  }
  ::v-deep .tipDialog {
    width: 60%;
    max-height: 80%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    .el-dialog__header {
      height: 46px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #EDF1F5;
      font-size: 18px;
      font-family: MicrosoftYaHei;
      color: #333333;
      flex-shrink: 0;
      button {
        top: 12px;
        right: 27px;
        i {
          color: #333;
        }
      }
    }
    .el-dialog__body {
      padding: 10px 40px;
      flex: 1;
      box-sizing: border-box;
      overflow-y: auto;
      .dialog-content{
        .tip-item {
          margin-bottom: 10px;
          font-size: 14px;
          .title {
            color: #1F2329;
          }
          .value {
            color: #8F959E;
          }
        }
      }
    }
    .el-dialog__footer{
      padding: 0;
      .dialog-footer {
        margin-top: auto;
        border-top: 1px solid #E7E7E7;
        height: 54px;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        > button {
          height: 34px;
          width: 58px;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-right: 15px;
          &:nth-last-child(1) {
            background-color: #4498F0;
            color: #fff;
          }
        }
      }
    }
  }
}
</style>
