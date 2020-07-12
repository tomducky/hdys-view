import Vue from 'vue'
import Router from 'vue-router'
//导入路由
import HelloWorld from '@/components/HelloWorld'

Vue.use(Router)
let router = new Router({
  //路由不带#号
  mode: "history",
  base: process.env.BASE_URL,
  routes: [{
    path: '/',
    name: 'HelloWorld',
    component: HelloWorld
  }]


})

//路由前置守卫，监听登录等操作
router.beforeEach((to, from, next) => {
  //获取token,此token由登录后放到缓存里
  const isLogin = sessionStorage.getItem("token");
  if (isLogin) {
    next();
  } else {
    if (to.name === "Login") {
      next("/login");
    } else {
      next();
    }
  }

});

export default router;