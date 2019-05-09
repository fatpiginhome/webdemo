function ajax(obj){
    // 不传method 默认使用get请求
    let method = obj.method || 'get',
        url = obj.url,
        // 不传async 就默认异步
        async = obj.async !== false,
        data = obj.data,
        success = obj.success,
        error = obj.error;
    let str = "";
    // 没有data 则不遍历
    if(data){
        // 处理data数据
        // name=fy&age=18
        for (let key in data) {
            str += key + "=" + data[key] + '&'
        }
    }
    /*
        解决get方式的缓存问题
        post没有缓存问题
    */
    if(method.indexOf('get') > -1){// get方式
        url += '?' + str + 't_=' + Date.now();
    }

    let xhr = new XMLHttpRequest();

    xhr.open(method, url, async);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

    xhr.send(str);
    xhr.onreadystatechange = function(){
        if(xhr.readyState !== 4)return;
        if(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304){
            success && success(xhr.responseText)
        }else{
            error && error(xhr.status);
        }
    }
}