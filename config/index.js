const path = require('path')

module.exports = {
  dev: {
    assetsSubDirectory: 'static',
    //静态资源根路径
    assetsPublicPath: '/',
    //代理跨域
    proxyTable: {
      "/local_api": {
        target: "http://124.128.15.184:8096", // 10.20.20.135:8084  http://10.20.21.144:3333" 124.128.15.181:8077
        changeOrigin: true,
        ws: true,
        pathRewrite: {
          '^/local_api': ''//去掉local_api，后台接口没有这个字段
        }
      },
      "/remote_api": {
        target: "http://124.128.15.184:8096", //这里应该填写实际开发api地址
        changeOrigin: true,
        ws: true,
        pathRewrite: {
          '^/remote_api': ''
        }
      },
    },
    host: 'localhost', // can be overwritten by process.env.HOST
    port: 8080, // can be overwritten by process.env.PORT, if port is in use, a free one will be determined
    autoOpenBrowser: false,
    errorOverlay: true,
    notifyOnErrors: true,
    poll: false, // https://webpack.js.org/configuration/dev-server/#devserver-watchoptions-
    useEslint: false,
    showEslintErrorsInOverlay: false,
    devtool: 'cheap-module-eval-source-map',
    cacheBusting: true,
    cssSourceMap: true
  },
  build: {
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    productionSourceMap: true,
    // https://webpack.js.org/configuration/devtool/#production
    devtool: '#source-map',
    productionGzip: false,
    productionGzipExtensions: ['js', 'css'],
    bundleAnalyzerReport: process.env.npm_config_report
  }
}
// const path = require('path');
// module.exports = {
//   publicPath: '/', //可以修改二级路径
//   // 选项...
//   chainWebpack: config => {
//     let isDev = process.env.NODE_ENV === 'development';
//     config.merge({
//         devtool: isDev ? 'cheap-eval-source-map' : false  //cheap-source-map 或者 cheap-eval-source-map
//     });
//     //全局变量别名
//     config.resolve.alias
//       .set('src', path.resolve(__dirname, './src'));
//     config.devServer.port(8080).compress(true);
//     config.devServer.proxy({
//       "/local_api": {
//         target: "http://124.128.15.184:8096", // 10.20.20.135:8084  http://10.20.21.144:3333" 124.128.15.181:8077
//         changeOrigin: true,
//         ws: true,
//         pathRewrite: {
//           '^/local_api': ''
//         }
//       },
//       "/remote_api": {
//         target: "http://124.128.15.184:8096", //这里应该填写实际开发api地址
//         changeOrigin: true,
//         ws: true,
//         pathRewrite: {
//           '^/remote_api': ''
//         }
//       },
//     });
//   },
//   css: {
//     loaderOptions: {
//       // 给 sass-loader 传递选项
//       sass: {
//         // @/ 是 src/ 的别名
//         // 所以这里假设你有 `@/assets/theme.scss` 这个文件
//         data: `@import "@/assets/css/theme.scss";`
//       }
//     }
//   }
// };