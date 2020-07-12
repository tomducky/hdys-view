import Vue from 'vue'
import Vuex from 'vuex'
import util from '../utils/util.js';
import user from './user';
import levelOneMenu from './levelOneMenu';

Vue.use(Vuex);
const storeKey = 'store_state_key';
let lastState = window.toExtra;//util.localStorage(storeKey);

let storeOptions={
    ...util.combineStore([user,levelOneMenu]),//需要手动添加自定义模块 ！！
    ...{
        state: lastState
    }
};
let store = new Vuex.Store(storeOptions);
//消息订阅，自动保存到localStorage.要求所有保留的数据，应该都是可以Json序列化的。
store.subscribe(() => {
    util.localStorage(storeKey, store.state);
});
if (util.isDev())
    window.store = store;
export default store;