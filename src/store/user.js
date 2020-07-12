export default {
    state: {
        user: {},
    },
    getters: {
        isLogined(state) {
            return () => {
                return state.user && state.user.token;
            }
        }
    },
    mutations: {
        userLogin(state, payload) {
            state.user = {...payload};
        },
        userGoLoginPage(state) {//用户跳转到登陆页，清空用户信息
            state.user = {};
        }
    },
    actions: {}
}
