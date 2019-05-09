const fs = require('fs');

const saveFile = (file,obj)=>{
    let readStream = fs.createReadStream("./json/"+file),
        content = "",
        data = null;
    readStream.setEncoding('utf8');
    readStream.on('data', function(chunk){
        content += chunk;
    });
    readStream.on('end', function(){
        // console.log(JSON.parse(content));
        data = JSON.parse(content);    //读账号文件
        for(let i = 0,item;item = data[i];i++){
            if(Number(obj.id) === item.id){
                for(let key in obj){
                    item[key] = obj[key];
                }
            }
        }
        if(obj.id === data.length+1){
            data.push(obj);
        }
        fs.writeFileSync("./json/"+file,JSON.stringify(data));
    });
};

module.exports = saveFile;