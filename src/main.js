import Vue from 'vue'
import App from './App'
import router from './router'
import store from "./store/index";
import ElementUI from "element-ui";
import util from "./utils/util.js";
import httpPlugin from "./http/index.js";
// 引入echarts
import echarts from "echarts";

Vue.config.productionTip = false

//配置Vue全局变量
Vue.prototype.$echarts = echarts;
Vue.prototype.$util=util;

//windows全局属性
window.loadPrompt='拼命加载中';
window.tipLock = false;

//请求出错的回调。
httpPlugin.http.onError = (rs, config) => {
  let code = Number(rs.code);
  let errTip = "";
  switch (code) {
    case 401:
      errTip = "登录失效，请重新登录";
      break;
    default:
      errTip = rs.msg;
      break;
  }
  if (errTip) {
    if (!window.tipLock) {
      ElementUI.Message({ message: errTip, type: "error" });
    }
    if (rs.code == 401) {
      router.push({ name: "Login" });
    }
  }

};

//全局进度条--也可以放到App.vue，个性化定制。
httpPlugin.http.onRequestingChange = requesting => {
  if (requesting) {
    httpPlugin.http._loadingHandler = ElementUI.Loading.service({
      text: window.loadPrompt,
      target: ".loadingArea"
      //background: '#fff'
    });
  } else {
    httpPlugin.http._loadingHandler.close();
  }
};

//自动注册components下的组件
util.regiterComponent(
  Vue,
  require.context("./components", true, /[0-9a-zA-Z_]+\.vue$/)
);

//插件注册
Vue.use(httpPlugin);
Vue.use(util);
Vue.use(ElementUI, { size: "small", zIndex: 3000 });


new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app')

// new Vue({
//   el: '#app',
//   template: '<App></App>',
//   components: {
//       App
//   }
// })
