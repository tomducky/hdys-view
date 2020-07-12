/**
 * 常用工具类。注入到Vue实列的$util对象。
 */
class Utils {
    //保存使用当前类加载的script标签
    loadedScripts = {
        key: {
            state: -1,
            cbs: [],
            script: null
        }
    };
    rootVue = null; //vue根实列
    saveKeyPrefix = "__util__"; //本地存储的key前缀。

    install(Vue, options) {
        this.init(Vue, options);
        Vue.filter("json", function (value) {
            return JSON.stringify(value);
        });
        Vue.prototype.$util = this;
        window.util = this;
    }

    localStorage(key, val) {
        return this.autoSave(localStorage, key, val);
    }

    sessionStorage(key, val) {
        return this.autoSave(sessionStorage, key, val);
    }
   //回车键搜索
    enterToSearch(callback){
        document.onkeydown = function (e) {
            let key = window.event.keyCode;
            if (key == 13) {
                callback();
            }
        }
    }
    autoSave(target, key, val) {
        if (val === undefined) {
            //get val
            let savedVal = target.getItem(this.saveKeyPrefix + key);
            if (savedVal) {
                return JSON.parse(savedVal).val;
            } else {
                return undefined;
            }
        } else {
            target.setItem(this.saveKeyPrefix + key, JSON.stringify({val}));
            return val;
        }
    }

    groupArr(arr, groupSize) {
        let rs = [];
        if (!arr) return rs;
        let tmpArr = [];
        arr.forEach((v, i) => {
            if (tmpArr.length === 0) rs.push(tmpArr);
            if (tmpArr.length < groupSize) {
                tmpArr.push(v);
            }
            if (tmpArr.length >= groupSize) {
                tmpArr = [];
            }
        });
        return rs;
    }

    combineStore(modules) {
        let rs = {};
        if (modules) {
            modules.forEach(m => {
                Object.keys(m).forEach(key => {
                    rs[key] = {...rs[key], ...m[key]};
                });
            });
        }
        return rs;
    }

    combineObjects(modules) {
        let rs = {};
        if (modules) {
            modules.forEach(m => {
                rs = {...rs, ...m};
            });
        }
        return rs;
    }

    init(Vue, options) {
        Array.prototype.last = function () {
            return this.length > 0 ? this[this.length - 1] : null;
        };
        //日期格式化
        Date.prototype.format = function (fmt = "yyyy-MM-dd hh:mm:ss") {
            let o = {
                "M+": this.getMonth() + 1, //月份
                "d+": this.getDate(), //日
                "h+": this.getHours(), //小时
                "H+": this.getHours(), //小时
                "m+": this.getMinutes(), //分
                "s+": this.getSeconds(), //秒
                "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                S: this.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt))
                fmt = fmt.replace(
                    RegExp.$1,
                    (this.getFullYear() + "").substr(4 - RegExp.$1.length)
                );
            for (let k in o)
                if (new RegExp("(" + k + ")").test(fmt))
                    fmt = fmt.replace(
                        RegExp.$1,
                        RegExp.$1.length == 1
                            ? o[k]
                            : ("00" + o[k]).substr(("" + o[k]).length)
                    );
            return fmt;
        };
    }

    //当前是否是开发环境
    isDev() {
        return process.env.NODE_ENV === "development";
    }

    //根据名称查找vue实例
    vm(name) {
        let rs = this.vms(name);
        return rs.length > 0 ? rs[0] : null;
    }

    //根据名称查找vue实例
    vms(name) {
        if (!this.rootVue) {
            console.warn("please call util.rootVue=new Vue(..) first");
            return null;
        }
        let rs = [];
        let find = (targetVue, name) => {
            if (!targetVue) return;
            if (targetVue.$options) {
                if (targetVue.$options.name === name) {
                    rs.push(targetVue);
                }
            }
            if (targetVue.$children) {
                targetVue.$children.forEach(v => {
                    find(v, name);
                });
            }
        };
        find(this.rootVue, name);
        return rs;
    }

    isLowerIE() {
        let type = this.browserType();
        return type.startsWith("IE") && parseFloat(type.split(" ")[1]) < 10;
    }

    //判断浏览器类型 IE 10.0 待扩展
    browserType() {
        if (navigator.userAgent.indexOf("Edge") > -1) {
            let arr = navigator.userAgent.split(" ");
            let last = arr[arr.length - 1];
            return last.replace("/", " "); //Edge 18.17763
        }
        // navigator.appVersion<'5' 版本低于IE9
        if (
            navigator.appName === "Microsoft Internet Explorer" ||
            navigator.userAgent.indexOf(".NET") > -1
        ) {
            if (navigator.userAgent.indexOf("rv:11.0") > -1) {
                return "IE 11.0";
            }
            let matchMsie = navigator.userAgent.match(/MSIE ([\d+\.]+);/i);
            if (matchMsie) {
                return "IE " + matchMsie[1];
            }
            return "IE -1";
        }
        let userAgent = navigator.userAgent;
        let userAgentarr = userAgent.split(" ");
        if (userAgentarr[userAgentarr.length - 2].startsWith("Chrome/")) {
            return "Chrome " + userAgentarr[userAgentarr.length - 2].split("/")[1];
        }
        return "unknown 0";
    }

    //加载多个标签
    loadScripts(srcArr, onload, type) {
        if (!(srcArr instanceof Array))
            srcArr = [srcArr];
        let completeCount = 0;
        let onComplete = () => {
            completeCount++;
            if (completeCount >= srcArr.length && onload)
                onload();
        };
        srcArr.forEach((src) => {
            this.loadScript(src, onComplete, type);
        });
    }

    //加载script标签。
    loadScript(src, onload, type) {
        let info = this.loadedScripts[src];
        if (info) {
            if (info.state === 1) {
                if (onload) onload.bind(info.script)();
                return;
            } else {
                info.cbs.push(onload);
                return;
            }
        }
        if (!type) {
            if (src.endsWith('.js')) {
                type = 'script';
            } else if (src.endsWith('.css')) {
                type = 'link';
            }
        }
        info = {
            state: -1,
            cbs: [onload]
        };
        this.loadedScripts[src] = info;
        let script = document.createElement(type);
        info.script = script;
        script.onload = function () {
            let that = this;
            let args = arguments;
            info.state = 1;
            info.cbs.forEach(function (cb) {
                if (cb) cb.apply(that, args);
            });
            info.cbs = [];
        };
        script.charset = "utf-8";
        if (type === 'script')
            script.setAttribute("src", src);
        if (type === 'link') {
            script.setAttribute("rel", 'stylesheet');
            script.setAttribute("href", src);
        }
        document.querySelector("head").appendChild(script);
    }

    //一个简单的动画计算 this.anim().start(from,to,duration,cb)
    anim() {
        function AnimHelper() {
            let self = this;
            this.stop = function () {
                if (self.timerId) clearInterval(self.timerId);
                self.timerId = null;
                self.isAnim = false;
            };
            this.start = function (from, to, duration, cb) {
                self.isAnim = true;
                self.dx = to - from;
                self.step = (self.dx * 15) / duration;
                self.current = from;
                self.timerId = setInterval(() => {
                    self.current += self.step;
                    let shouldStop = false;

                    if (from > to && self.current <= to) {
                        shouldStop = true;
                    } else if (from < to && self.current >= to) {
                        shouldStop = true;
                    }
                    if (shouldStop) {
                        self.stop();
                        self.current = to;
                    }
                    if (cb) cb(self.current);
                }, 15);
            };
        }

        return new AnimHelper();
    }

    // 自动注册指定目录下的组件。
    //Vue,require.context('./components',true,/[0-9a-zA-Z_]+\.vue$/)
    regiterComponent(Vue, requireComponent) {
        requireComponent.keys().forEach(key => {
            const componentConfig = requireComponent(key);
            let arr = key.split("/");
            let last = arr[arr.length - 1];
            let fileName = last.replace(/^(.*)\.\w+$/g, "$1"); //文件名就是组件名。
            Vue.component(fileName, componentConfig.default || componentConfig);
        });
    }

    /**
     * 千位逗号分隔符
     * 使用方法：在需要调用的地方，util.方法名(n)
     */
    comdify(n) {
        let re = /\d{1,3}(?=(\d{3})+$)/g;
        let n1 = n.replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) {
            return s1.replace(re, "$&,") + s2;
        });
        return n1;
    }

    /**
     * 判断是否是数字
     * 注：并不是判断五大基本类型
     */
    isNumber(value) {
        let patrn = /^[0-9]*[1-9][0-9]*$/;
        if (patrn.exec(value) === null || value === "") {
            return false;
        } else {
            return true;
        }
    }

    //检测是否为固定电话号码
    delSpace(txt) {
        //清除字符串中所有的空白字符
        if (txt == null) {
            return "";
        } else {
            txt = txt.toString();
            txt = txt.replace(/\s{1,}/, "");
            return txt;
        }
    }
    //一维数组变tree形结构 {children} 不会改变原arr的内容
    flap2tree(arr, key = 'id', parentKey = 'pid', rootFilter) {
        let rs = [];
        let mapObj = {};
        let copyArr = [];
        arr.forEach((item) => {
            let newItem = {...item};
            copyArr.push(newItem);
            mapObj[item[key]] = newItem;
        });
        copyArr.forEach((item) => {
            let pid = item[parentKey];
            let parent = null;
            if (pid) {
                parent = mapObj[pid];
                if (parent) {
                    if (!parent.children) {
                        parent.children = [];
                    }
                    parent.children.push(item);
                }
            }
            if (!parent) {
                rs.push(item);
            }
            mapObj[item[key]] = item;
        });
        //如果root需要重新指定过滤，比如有时候，只能是level==1或者parentCode==='0'的才是根级别
        if (rootFilter) {
            rs = rs.filter(rootFilter);
        }
        return rs;
    }

    //检测是否为url
    isURL = function (txt) {
        if (txt == null || txt == "") {
            return false;
        } else {
            var regex = /http(s)?:\/\/([\w-]+\.)+[\w-]+(\/[\w- .\/?%&=]*)?/;
            return regex.test(txt);
        }
    };
    //检测是否为固定电话号码
    isTel = function (txt) {
        if (txt == null || txt == "") {
            return false;
        } else {
            var regex = /[0-9]{1}[0-9]{2,3}-[1-9]{1}[0-9]{5,8}/;
            return regex.test(txt);
        }
    };
    //检测是否为手机号码
    isMobile = function (txt) {
        if (txt == null || txt == "") {
            return false;
        } else {
            var regex = /^0?1[3|4|5|8][0 -9]\d{8}$/;
            return regex.test(txt);
        }
    };
    //检测是否为电话号码(固定电话或手机)
    isPhoneNum = function (txt) {
        return isTel(txt) || isMobile(txt);
    };
    // 是否为整数
    isInteger = function (txt) {
        if (txt == null || txt == "") {
            return false;
        } else {
            txt = delSpace(txt);
            return !isNaN(parseInt(txt));
        }
    };
    //是否为数字
    isNumeric = function (txt) {
        if (txt == null || txt == "") {
            return false;
        } else {
            txt = delSpace(txt);
            return !isNaN(parseFloat(txt));
        }
    };
    //检测15位或18位的身份证号
    isIdCardNum = function (txt) {
        if (txt == null || txt == "") {
            return false;
        }
        var idNo = txt.toString();
        var len = idNo.length;
        var reg;
        var noArr;
        var dateStr = "";
        if (len != 15 && len != 18) {
            return false;
        } else if (len == 15) {
            reg = /(\d{3})(\d{3})(\d{2})(\d{2})(\d{2})(\d{3})/;
            if (reg.test(idNo) == false) {
                return false;
            } else {
                noArr = reg.exec(idNo);
                dateStr = "19" + noArr[3] + "-" + noArr[4] + "-" + noArr[5];
                return isDateFormat(dateStr);
            }
        } else {
            reg = /(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})(\d{1})([0-9xX]{1})/;
            if (reg.test(idNo) == false) {
                return false;
            } else {
                noArr = reg.exec(idNo);
                dateStr =
                    noArr[7] +
                    noArr[8] +
                    noArr[9] +
                    noArr[10] +
                    "/" +
                    noArr[11] +
                    noArr[12] +
                    "/" +
                    noArr[13] +
                    noArr[14];
                if (isNaN(new Date(dateStr)) == false) {
                    var wi = new Array(
                        0,
                        7,
                        9,
                        10,
                        5,
                        8,
                        4,
                        2,
                        1,
                        6,
                        3,
                        7,
                        9,
                        10,
                        5,
                        8,
                        4,
                        2
                    );
                    var amt = 0;
                    var i;
                    var chkNo = new Array(
                        "1",
                        "0",
                        "X",
                        "9",
                        "8",
                        "7",
                        "6",
                        "5",
                        "4",
                        "3",
                        "2"
                    );
                    for (i = 1; i < 18; i++) {
                        amt += noArr[i] * wi[i];
                    }
                    return chkNo[amt % 11] == noArr[18].toUpperCase();
                } else {
                    return false;
                }
            }
        }
    };




    /**
     * 常用的正则验证
     *
     */
     // 手机号验证
     tel_validator = (rule, value, callback) => {
        if(value == '' || value==undefined){
            callback(new Error('手机号不能为空'));
        } else if (!(/^1[3456789]\d{9}$/.test(value))) {
            callback(new Error('请输入正确的手机号'));
        }else {
            callback()
        }
    };
     // 邮箱验证
    mail_validator=(rule, value, callback) => {
        if(value == '' || value==undefined){
            callback(new Error('邮箱不能为空'));
        } else if (!(/^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value))) {
            callback(new Error('请输入正确的邮箱格式'));
        }else {
            callback()
        }
    };
    
/**
 * 获取当前时间
 * 格式YYYY-MM-DD
 */
   getNowFormatDate = function() {
    var date = new Date();
    var seperator1 = "-";
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
       var hour = date.getHours();
       var minute = date.getMinutes();
       var second = date.getSeconds();
    if (month >= 1 && month <= 9) {
      month = "0" + month;
    }
       if (hour >= 1 && hour <= 9) {
           hour = "0" + hour;
       }
       if (minute >= 1 && minute <= 9) {
           minute = "0" + minute;
       }
       if (second >= 1 && second <= 9) {
           second = "0" + second;
       }
    if (strDate >= 0 && strDate <= 9) {
      strDate = "0" + strDate;
    }
    var currentdate = year + seperator1 + month + seperator1 + strDate +' '+hour+':'+minute+':'+second;
    return currentdate;
  };

 getCurrentDay(){
     var date = new Date();
     var seperator1 = "-";
     var year = date.getFullYear();
     var month = date.getMonth() + 1;
     var strDate = date.getDate();
     var hour = date.getHours();
     var minute = date.getMinutes();
     var second = date.getSeconds();
     if (month >= 1 && month <= 9) {
         month = "0" + month;
     }
     if (hour >= 1 && hour <= 9) {
         hour = "0" + hour;
     }
     if (minute >= 1 && minute <= 9) {
         minute = "0" + minute;
     }
     if (second >= 1 && second <= 9) {
         second = "0" + second;
     }
     if (strDate >= 0 && strDate <= 9) {
         strDate = "0" + strDate;
     }
     var currentdate = year + seperator1 + month + seperator1 + strDate  ;
     return currentdate;
 }
  getNowFormatTime() {//获取当前时间
	var date = new Date();
	var seperator1 = "-";
	var seperator2 = ":";
	var month = date.getMonth() + 1<10? "0"+(date.getMonth() + 1):date.getMonth() + 1;
	var strDate = date.getDate()<10? "0" + date.getDate():date.getDate();
	var currentdate = date.getFullYear() + seperator1  + month  + seperator1  + strDate
			+ " "  + date.getHours()  + seperator2  + date.getMinutes()
			+ seperator2 + date.getSeconds();
	return currentdate;
}
getCurrentDay(){
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1<10? "0"+(date.getMonth() + 1):date.getMonth() + 1;
    var strDate = date.getDate()<10? "0" + date.getDate():date.getDate();
    var currentdate = date.getFullYear() + seperator1  + month  + seperator1  + strDate;

    return currentdate;
}
getTomorrow(){
    var day3 = new Date();
      day3.setTime(day3.getTime()+24*60*60*1000);
      var s3 = day3.getFullYear()+"-" + (day3.getMonth()+1<10? "0"+(day3.getMonth() + 1):day3.getMonth() + 1) + "-" + (day3.getDate()<10? "0" + day3.getDate():day3.getDate());
    return s3;
}
getYesterDay(){
    var day3 = new Date();
    day3.setTime(day3.getTime()-24*60*60*1000);
    var hour = day3.getHours();
    var minute = day3.getMinutes();
    var second = day3.getSeconds();
    if (hour >= 1 && hour <= 9) {
        hour = "0" + hour;
    }
    if (minute >= 1 && minute <= 9) {
        minute = "0" + minute;
    }
    if (second >= 1 && second <= 9) {
        second = "0" + second;
    }
    var s3 = day3.getFullYear()+"-" + (day3.getMonth()+1<10? "0"+(day3.getMonth() + 1):day3.getMonth() + 1) + "-" + (day3.getDate()<10? "0" + day3.getDate():day3.getDate()) +' '+hour+':'+minute+':'+second;
    return s3;
}
getNowFormatTimeForReport() {//获取当前时间(运行日报用 2019年07月04日 11时)
	var date = new Date();
	var seperator1 = "年";
	var month = date.getMonth() + 1<10? "0"+(date.getMonth() + 1):date.getMonth() + 1;
	var strDate = date.getDate()<10? "0" + date.getDate():date.getDate();
	var currentdate = date.getFullYear() + seperator1  + month  + "月"  + strDate
			+ "日 "  + date.getHours();
	return currentdate;
}
    getNowFormatTimeHour() {//获取当前时间(运行日报用 2019年07月04日 11时)
        var date = new Date();
        var seperator1 = "年";
        var month = date.getMonth() + 1<10? "0"+(date.getMonth() + 1):date.getMonth() + 1;
        var strDate = date.getDate()<10? "0" + date.getDate():date.getDate();
        var currentdate = date.getFullYear() + seperator1  + month  + "月"  + strDate
            + "日 "  + date.getHours();
        return date.getHours();
    }
      Trim(str,is_global){
        var result;
        if(str==null || str == undefined || str == ''){
            return  ''
        }else {
            str=str+'';
            result = str.replace(/(^\s*)|(\s*$)/g,"").replace(/[^\d.]/g,"");
            if(is_global.toLowerCase()=="g")
            {
                result = result.replace(/\s/g,"");
            }
            return result;
        }

        // if(str !== null && str != undefined && str != '' && str != '0'){//水质填报 不填的时候，返回为0，所以需要加最后一个判断条件
        //     debugger
        //     result = str.replace(/(^\s*)|(\s*$)/g,"").replace(/[^\d.]/g,"");
        //    // result = str.replace(/(^\s*)|(\s*$)/g,"");
        //     if(is_global.toLowerCase()=="g")
        //     {
        //         result = result.replace(/\s/g,"");
        //     }
        //     return result;
        // }else {
        //     return  ''
        // }

    }
    Trim1(str,is_global){
        var result;
        if(str==null || str == undefined || str == ''){
            return  ''
        }else {
            str=str+'';
            result = str.replace(/(^\s*)|(\s*$)/g,"").replace(/[^\d.-]/g,"");
            if(is_global.toLowerCase()=="g")
            {
                result = result.replace(/\s/g,"");
            }
            return result;
        }

    }
    postNumber1(val){
        let newVal= val.replace(/^(\-)*(\d+)\.(\d).*$/, '$1$2.$3');
        return  newVal
    }
    postNumber2(val){
      let newVal= val.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
        return  newVal
    }
    postNumber3(val){
        let newVal= val.replace(/^(\-)*(\d+)\.(\d\d\d).*$/, '$1$2.$3');
        return  newVal
    }
    postNumber4(val){
        let newVal= val.replace(/^(\-)*(\d+)\.(\d\d\d\d).*$/, '$1$2.$3');
        return  newVal
    }
    postNumber5(val){
        let newVal= val.replace(/^(\-)*(\d+)\.(\d\d\d\d\d).*$/, '$1$2.$3');
        return  newVal
    }
    // 小数点前9位 小数点后2位
    UpNumber2(e){
       // 先把非数字的都替换掉，除了数字和.
         e.target.value = e.target.value.replace(/[^\d.]/g,"");
        //必须保证第一个为数字而不是.
         e.target.value = e.target.value.replace(/^\./g, "");
        //  e.target.value = e.target.value.replace(/^(\d{0,6})\.{0,1}(\d{1,4})?$/g, "");
        //小数点后2位
        e.target.value =  e.target.value.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
        // 小数点前  控制输入9位
      e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d\d\d\d\d\d\d\d)\.*$/, '$1');
        //保证.只出现一次，而不能出现两次以上
        e.target.value =  e.target.value.replace(".", "$#$")
           .replace(/\./g, "")
          .replace("$#$", ".");
        // 去掉所有空格
        e.target.value = this.Trim(e.target.value,'g');

        return  e.target.value
    }
    // 小数点前9位 小数点后3位
    UpNumber3(e){
        //先把非数字的都替换掉，除了数字和.
        e.target.value = e.target.value.replace(/[^\d.]/g,"");
        //必须保证第一个为数字而不是.
        e.target.value = e.target.value.replace(/^\./g, "");
        //小数点后5位
        e.target.value =  e.target.value.replace(/^(\-)*(\d+)\.(\d\d\d).*$/, '$1$2.$3');
        // 小数点前  控制输入9位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d\d\d\d\d\d\d\d)\.*$/, '$1');
        //保证.只出现一次，而不能出现两次以上
        e.target.value =  e.target.value.replace(".", "$#$")
            .replace(/\./g, "")
            .replace("$#$", ".");
        return  e.target.value
    }
    // 小数点前9位 小数点后4位
    UpNumber4(e){
        //先把非数字的都替换掉，除了数字和.
        e.target.value = e.target.value.replace(/[^\d.]/g,"");
        //必须保证第一个为数字而不是.
        e.target.value = e.target.value.replace(/^\./g, "");
        //小数点后4位
        e.target.value =  e.target.value.replace(/^(\-)*(\d+)\.(\d\d\d\d).*$/, '$1$2.$3');
        // 小数点前  控制输入9位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d\d\d\d\d\d\d\d)\.*$/, '$1');
        //保证.只出现一次，而不能出现两次以上
        e.target.value =  e.target.value.replace(".", "$#$")
            .replace(/\./g, "")
            .replace("$#$", ".");
        // 去掉所有空格
        e.target.value = this.Trim(e.target.value,'g');
        return  e.target.value
    }
    // 小数点前9位 小数点后5位
    UpNumber5(e){
        //先把非数字的都替换掉，除了数字和.
        e.target.value = e.target.value.replace(/[^\d.]/g,"");
        //必须保证第一个为数字而不是.
        e.target.value = e.target.value.replace(/^\./g, "");
        //小数点后5位
        e.target.value =  e.target.value.replace(/^(\-)*(\d+)\.(\d\d\d\d\d).*$/, '$1$2.$3');
        // 小数点前  控制输入9位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d\d\d\d\d\d\d\d)\.*$/, '$1');
        //保证.只出现一次，而不能出现两次以上
        e.target.value =  e.target.value.replace(".", "$#$")
            .replace(/\./g, "")
            .replace("$#$", ".");
        return  e.target.value
    }
    // 温度  小数点后1位 小数点前  控制输入2位
    belowNumber(e){
        //先把非数字的都替换掉，除了数字和.
        e.target.value = e.target.value.replace(/[^\d.-]/g,"");
        //必须保证第一个为数字而不是.
        e.target.value = e.target.value.replace(/^\./g, "");
        //必须保证除了第一个为-，其他不是.
        e.target.value = e.target.value.replace(/^-?\d*.\d*-/, "");
        //小数点后1位
        e.target.value =  e.target.value.replace(/^(\-)*(\d+)\.(\d).*$/, '$1$2.$3');
        // 小数点前  控制输入9位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d)\.*$/, '$1');
        //保证.只出现一次，而不能出现两次以上
        e.target.value =  e.target.value.replace(".", "$#$")
            .replace(/\./g, "")
            .replace("$#$", ".");
        // 去掉所有空格
     //   e.target.value = this.Trim(e.target.value,'g');
        console.log(e.target.value,'e.target.value')
        return e.target.value
    }
    // 正整数
    toNumber(e) {
        e.target.value = e.target.value.replace(/[^\d]/g, "");
        // 小数点前  控制输入9位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d\d\d\d\d\d\d\d)\.*$/, '$1');
        // 去掉所有空格
        e.target.value = this.Trim(e.target.value,'g');
        return e.target.value
    }
    // 正整数  手机号11位
    toTel(e) {
        e.target.value = e.target.value.replace(/[^\d.]/g, "");
        // 小数点前  控制输入9位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d\d\d\d\d\d\d\d\d\d)\.*$/, '$1');
        // 去掉所有空格
        e.target.value = this.Trim(e.target.value,'g');
        return e.target.value
    }
    // 正数  pH
    toNumberFloat(e) {
        e.target.value = e.target.value.replace(/[^\d.]/g, "");
        //保证.只出现一次，而不能出现两次以上
        e.target.value =  e.target.value.replace(".", "$#$")
            .replace(/\./g, "")
            .replace("$#$", ".");
        //小数点后2位
        e.target.value =  e.target.value.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3');
        // 小数点前  控制输入2位
        e.target.value =  e.target.value.replace(/^(\-)*(\d\d\d)\.*$/, '$1');
        // 去掉所有空格
        e.target.value = this.Trim(e.target.value,'g');
        return e.target.value
    }


    // 将返回值null 改为空字符串  适用于一级obj
    nullToString(obj){


              for (let prop in obj) {
                  if(obj[prop]==undefined || obj[prop]==null ){
                      obj[prop]='';
                  }

      }

        return obj
    }

    //根据对象的某个属性进行排序


     orderNum(property) {
         return function (obj1, obj2) {
             let v1 = Number(obj1[property]);
             let v2 = Number(obj2[property]);
             return v1 - v2
         }
     }

    orderDate(property) {
        return function (obj1, obj2) {
            let v1 = Number(new Date(obj1[property]).getTime());
            let v2= Number(new Date(obj2[property]).getTime());
            return v1 - v2
        }
    }

       // date参数是要进行加减的日期，days参数是要加减的天数，
      // 如果往前算就传入负数，往后算就传入正数，如果是要进行月份的加减，
      // 就调用setMonth()和getMonth（）就可以了，需要注意的是返回的月份是从0开始计算的，
      // 也就是说返回的月份要比实际月份少一个月，因此要相应的加上1。
      addDate(date, days) {
        var d = new Date(date);
        d.setDate(d.getDate() + days);
        var m = d.getMonth() + 1;
        return d.getFullYear() + '-' + m + '-' + d.getDate();
      }

       dateDiff(sDate, eDate) { //sDate和eDate是yyyy-MM-dd格式
        　　var date1 = new Date(sDate);
        　　var date2 = new Date(eDate);
        　　var date3=date2.getTime()-date1.getTime();
        　　var days=Math.floor(date3/(24*3600*1000));
        　　return days;
        }
        /**************************************时间格式化处理************************************/
	   dateFtt(fmt, date) { //author: meizz   
			var o = {
				"M+": date.getMonth() + 1, //月份   
				"d+": date.getDate(), //日   
				"h+": date.getHours(), //小时   
				"m+": date.getMinutes(), //分   
				"s+": date.getSeconds(), //秒   
				"q+": Math.floor((date.getMonth() + 3) / 3), //季度   
				"S": date.getMilliseconds() //毫秒   
			};
			if(/(y+)/.test(fmt))
				fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
			for(var k in o)
				if(new RegExp("(" + k + ")").test(fmt))
					fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
			return fmt;
        }
         /**************************************时间格式化处理************************************/

         //数字处理
         strToFloat(v) {
            return parseFloat(isNaN(parseFloat(v)) ? 0 : v);
          }
    
}

export default new Utils();
