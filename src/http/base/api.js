import http from './http';
import * as  _urls from './urls';

let urls = _urls;
// ############登录相关 START#######################################################
export const login = (data) => http.json({url: urls.login, data});
// ############登录相关 END#######################################################
