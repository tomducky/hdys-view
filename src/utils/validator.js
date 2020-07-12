/**
 * 常用工具类。注入到Vue实列的$util对象。
 */
class Valid {
    required={required: true, message: '不能为空', trigger: 'blur'};
    length = function(n,x){
        let numRange = { min: n, max: x, message: "长度在 "+ n +" 到 "+ x +" 个字符", trigger: "blur" };
        return numRange;
    };
}

export default new Valid();
