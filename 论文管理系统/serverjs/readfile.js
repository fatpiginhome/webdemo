const fs = require('fs');

const readFile = async (file) => {
    //用来读取数据库的异步
    return new Promise(function (res) {
        let readStream = fs.createReadStream("./json/"+file),
            content = "";
        readStream.setEncoding('utf8');
        readStream.on('data', function(chunk){
            content += chunk;
        });
        readStream.on('end', function(){
            // console.log(JSON.parse(content));
            res(JSON.parse(content));         //读账号文件
        });
    });
};

module.exports = readFile;