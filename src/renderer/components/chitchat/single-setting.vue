<template>
  <div class="single-setting">
    <div class="user-basic-info">
      <user-photo class="user-sign" :user="OpenDialog"></user-photo>
      <div class="user-basic-right">
        <div class="user-basic-right-name">{{ OpenDialog.name }}</div>
        <div class="user-basic-right-position">
          {{
            OpenDialog.id !== GetSendUser.id && currentPrivateUserCompany
              ? currentPrivateUserCompany
              : ""
          }}
        </div>
      </div>
    </div>
    <div class="setting-content">
      <form-item
        type="single"
        v-for="item in getForm"
        v-show="item.show"
        :key="item.key"
        @changeValue="changeValue"
        :option="item"
      ></form-item>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import FormItem from "@/components/chitchat/form/form-item";
export default {
  components: { FormItem },
  props: {
    currentPrivateUserCompany: String
  },
  data() {
    return {
      form: [
        {
          type: "switch",
          label: "置顶聊天",
          hasBottom: true,
          value: false,
          key: "stick",
          show: true
        },
        {
          type: "confirm",
          confirmLabel: "确定要清空此会话的聊天记录？",
          label: "清空聊天记录",
          value: false,
          key: "clear",
          show: true,
          hasBottom: false
        }
      ]
    };
  },
  computed: {
    ...mapGetters({
      OpenDialog: "GetOpenDialog",
      corpUser: "GetCompany",
      GetSendUser: "GetSendUser",
      GetDialog: "GetConversationSort"
    }),
    getForm() {
      let isTop = this.GetDialog.topList
        .map(item => item.id)
        .includes(this.OpenDialog.id);
      let data = this.form.map(item => {
        if (item.key == "stick") {
          item.value = isTop;
        }
        return item;
      });
      return data;
    }
  },
  mounted() {},
  methods: {
    // 修改表单数据
    changeValue(value) {
      let index = this.form.findIndex(item => (item.key = value.key));
      this.form.splice(index, 1, value);
    }
  }
};
</script>

<style lang="scss">
.single-setting {
  flex: 1;
  overflow: hidden;
  padding: 0 20px;
  box-sizing: border-box;
  .user-basic-info {
    display: flex;
    align-items: center;
    padding-bottom: 15px;
    box-sizing: border-box;
    border-bottom: 1px solid #e7e7e7;
    .user-photo {
      margin: 0;
    }
    .user-basic-right {
      line-height: 1;
      margin-left: 15px;
      .user-basic-right-name {
        font-size: 14px;
        color: #000;
        margin-bottom: 4px;
      }
      .user-basic-right-position {
        font-size: 10px;
        color: #999999;
      }
    }
  }
}
</style>
