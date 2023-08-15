<template>
  <section class="micro-apps-container">
    <div class="appsContent" v-if="appLists.length">
      <template v-for="(appList, index) in appLists">
        <div class="appLists" :key="index" v-if="appList.apps.length > 0">
          <div class="title">{{ appList.name }}</div>
          <div class="apps">
            <div
              class="app"
              v-for="app in appList.apps"
              :key="app.id"
              @click="goToPage(app)"
            >
              <div class="appLogo">
                <img v-if="app.logo" :src="app.logo" />
              </div>
              <div class="appName" :title="app.name">{{ app.name }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </section>
</template>
<script>
export default {
  name: "",
  components: {},
  props: {
    apps: {
      type: Array,
      default: [],
      required: true
    }
  },
  data() {
    return {
      appLists: []
    };
  },
  created() {},
  mounted() {
    this.init(this.apps);
  },
  computed: {},
  watch: {
    apps: {
      handler(newVal, oldVal) {
        this.init(newVal);
      },
      deep: true
    }
  },
  methods: {
    init(newVal) {
      let basicApps = newVal.filter(app => app.openType == 1); //办公
      let factoryApps = newVal.filter(app => app.openType == 2); //iot
      this.appLists = newVal.map(item => {
        !item.sign ? (item.color = "#4498F0") : "";
        item.name = item.typeName;
        return item;
      });
    },
    goToPage(app) {
      this.$emit("showApp", app);
    }
  }
};
</script>
<style lang="scss" scoped>
.micro-apps-container {
  width: 100%;
  overflow: hidden;
  background-color: rgba($color: #d8d8d8, $alpha: 0.2);
  .appsContent {
    height: 100%;
    box-sizing: border-box;
    .appLists {
      width: 100%;
      background-color: rgba($color: #fff, $alpha: 0.6);
      border-radius: 4px;
      margin-top: 8px;
      padding: {
        left: 20px;
      }
      .title {
        position: relative;
        display: flex;
        align-items: center;
        padding: {
          top: 20px;
          bottom: 14px;
        }
        font-size: 14px;
        font-weight: bold;
        line-height: 1;
      }
      .apps {
        display: flex;
        flex-wrap: wrap;
        // padding: 0 10px;
        box-sizing: border-box;
        .app {
          width: 76px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          overflow: hidden;
          margin-bottom: 20px;
          cursor: pointer;
          .appLogo {
            display: flex;
            justify-content: center;
            align-items: center;
            // padding: 10px 0;
            img {
              width: 46px;
              height: 46px;
            }
          }
          .appName {
            margin: {
              top: 6px;
            }
            padding: 0 2px;
            font-size: 12px;
            color: #383838;
            font-weight: 500;
            width: 100%;
            text-align: center;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            line-height: 1;
          }
        }
      }
    }
  }
}
</style>
