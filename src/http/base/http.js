import axios from 'axios';
import qs from 'qs';
import ElementUI from "element-ui";
class Http {
    constructor() {
        this.successCode = 0;//默认http code 0 且用户返回的 status === 0 为成功
        this.http = axios.create({
            //请求后台超时时间毫秒
            timeout: 30*1000,
            transformRequest: [
                function (data, headers) {
                    // Do whatever you want to transform
                    // the data return a string or an instance of Buffer, ArrayBuffer, FormData or Stream
                    //可以添加统一的头信息。如授权
                    return data;
                }
            ],
            transformResponse: [function (data) {
                // Do whatever you want to transform the data
                return data;
            }],
            //统一添加headers信息
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization':'Bearer '+sessionStorage.getItem('token')
            }
        });

        this.requesting = false;//标识当前是否在 request
        this.requestingCheckDelay = 250;//检测请求状态的延迟 ms。 可以避免过短的请求
        this.loadingRequests = [];
    }

    //统一返回标准数据
    stdRs(code, message, result) {
        return {code, message, result}
    }

    onStart(config) {
        //自动记录loading的request
        if (config.loading === false) {
            return;
        }
        this.loadingRequests.push(config);
        setTimeout(() => {
            this.checkRequesting();
        }, this.requestingCheckDelay);
    }

    checkRequesting() {
        let currRequesting = this.loadingRequests.length > 0;
        if (currRequesting !== this.requesting) {
            this.requesting = currRequesting;
            //当前请求状态变化的监听。
            if (this.onRequestingChange) {
                this.onRequestingChange.call(this, currRequesting);
            }
        }
    }

    resultSuccess(stdRs) {
        return stdRs.code == this.successCode
    }

    onComplete(config, stdRs) {
        //catch后的统一回调。如果配置中添加了 message=false，则不会自动提示信息
        if (!this.resultSuccess(stdRs) && this.onError) {
            this.onError.call(this, stdRs, config);
        }
        // if (this.isDev())
        stdRs.$config = config;
        let index = this.loadingRequests.indexOf(config);
        if (index > -1) {
            this.loadingRequests.splice(index, 1);
            setTimeout(() => {
                this.checkRequesting();
            }, this.requestingCheckDelay / 2);
        }
    }

    //核心请求函数,并做拦截处理。
    // config: {url,method,params,data,timeout,headers,message,loading}
    // resp: {data:{},status:200,statusText:'OK',headers:{},config:{},request:{}}
    request(config) {
        this.onStart(config);
        return this.http.request(config).then((res) => {

            let {data, headers, request, status, statusText} = res;
           
            let stdRs = null;
            //此处如果后台返回的是文件流的形式，则自定义返回内容拼接上response的文件流
            let contentType=headers['content-type'];
            if(contentType=="application/octet-stream"){
                let resultData=data;
                stdRs={"code":0,"msg":"操作成功","result":{ "data":resultData}}
            }else{
                try {
                    stdRs = JSON.parse(data);
                } catch (e) {
                    stdRs = this.stdRs(status + '', statusText, data);
                }
               
            }

            this.onComplete(config, stdRs);
            let flag=this.resultSuccess(stdRs);

            return this.resultSuccess(stdRs) ? Promise.resolve(stdRs) : Promise.reject(stdRs);
        }).catch((err) => {

            if (!err.response && !err.request) {
                return Promise.reject(err);
            }
            let {request, response} = err;
            //请求超时
            if(response==undefined){
                ElementUI.Message({message: '请求数据超时！', type: "error"});
                let stdRs = this.stdRs(1, '请求数据超时！', null);
                this.onComplete(config, stdRs);
                return Promise.reject(stdRs);
             }else{
                let {status, statusText} = response;
                let stdRs = this.stdRs(status + '', statusText, null);
                this.onComplete(config, stdRs);
                return Promise.reject(stdRs);
             }


        });
    }

    // url  params --传递data也可，自动转到params上去  -- get or delete
    get(config) {
        if (config.data) {
            config.params = {...config.params, ...config.data,...{_t: +new Date()}};
           //分解封装的params参数，放到request里，否则后台接收不到
            if(config.data.params != undefined){
                config.params={ ...config.params,...config.data.params}
            }

            delete config.data;
        }
        return this.request(config);
    }

    //导出文件方法
    export(config) {
        if (config.data) {
            config.responseType="blob";
            config.params = {...config.params, ...config.data};
            if(config.data.params != undefined){
                config.params={ ...config.params,...config.data.params}
            }

            delete config.data;
        }
        return this.request(config);
    }


    //表单提交方法
    form(config) {
        if (!config.method)
            config.method = 'post';
        if (config.data && !(config.data instanceof FormData)) {
            config.headers = {...config.headers, ...{'Content-Type': 'application/x-www-form-urlencoded'}};
            config.data = qs.stringify(config.data);
        }
        return this.request(config);
    }

    //上传文件方法
    formData(config) {
        if (!config.method)
            config.method = 'post';
        if (config.data && !(config.data instanceof FormData)) {
            config.headers = {...config.headers, ...{'Content-Type': 'multipart/form-data'}};
            config.data = qs.stringify(config.data);
        }
        return this.request(config);
    }

    //JSON
    json(config) {
        if (!config.method)
            config.method = 'post';
        config.headers = {...config.headers, ...{'Content-Type': 'application/json'}};
        if (config.data) {
            config.data = JSON.stringify(config.data);
        }
        return this.request(config);
    }

}

export default new Http();
