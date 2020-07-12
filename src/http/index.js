import * as apis from './base/api';
import http from './base/http';
export default {
    install(Vue,options){
        // 挂载到了vue实例的$api上面。
        Vue.prototype.$api=apis;
        // http请求工具，挂载$http
        Vue.prototype.$http=http;
    },
    apis,
    http
}