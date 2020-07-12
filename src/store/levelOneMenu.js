export default {
    state: {
        sideMenu: sessionStorage.getItem("sideMenu") || [],
        menuList: [],
        navList:[],
        showFlag:sessionStorage.getItem("showFlag") || false,
    },
    getters:{
        menuList: state => state.menuList,
        sideMenu:state => state.sideMenu,
        navList:state => state.navList,
        showFlag:state => state.showFlag,
    },
    mutations: {
        SET_NAV_LIST: (state, data) => {
           sessionStorage.setItem('navList', JSON.stringify(data)); //将传递的数据先保存到sessionStorage中
            state.navList = data;
          },
        SET_MENU_LIST: (state, data) => {
            state.menuList = data;
          },
          SET_SIDE_MENU: (state, data) => {
            sessionStorage.setItem('sideMenu', JSON.stringify(data)); //将传递的数据先保存到sessionStorage中
            state.sideMenu = data;
          },
          SET_SHOW_FLAG: (state, data) => {
            sessionStorage.setItem('showFlag', data); //将传递的数据先保存到sessionStorage中
            state.showFlag = data;
          },
    },
    actions: {}
}