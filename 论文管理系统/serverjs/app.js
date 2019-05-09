const Koa = require('koa');
const fs = require('fs');
const Router = require('koa-router');
const session = require("koa-session");
const koaBody = require('koa-body');
const { join } = require('path');
const static = require('koa-static');
const keepLog = require('./keeplog');
const saveFile = require('./savefile');
const readFile = require('./readfile');
const word2pdf = require('word2pdf');
const wm = require('./hummus66');


const app = new Koa();
const route = new Router;
app.keys = ['zhegeshikeyanxunlian'];

const config = {
    key:'Sid',
    maxAge:36e5,
    autoCommit:true,
    overwrite:true,
    httpOnly:true,
    signed:true,
    rolling:true,
    renew:false
};
const main = ctx => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./html/login.html');
    // console.log(ctx.response);
};
const command = ctx => {
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./html/command.html');
    // console.log(ctx.response);
};
const login = async (ctx,next) => {
    //处理登录请求的函数
        let loginList = ctx.request.body,
            acList = await readFile("account.json");
        // console.log(ctx.request.body);///获取post来的账号密码
        for(let i = 0,item;item = acList[i];i++){
            if(item.account === loginList.account){
                if(item.password === loginList.password){
                    console.log("登陆成功");
                    loginSuccess(ctx,item); //设置cookies和session
                    ctx.response.body = "command";
                    await next();
                }
            }
        }
};

const sendList = async (ctx,next) => {
    //处理论文获取请求的函数
    if(ctx.session.admin) {
        //如果你是院管理员
        let docList = await readFile("docList.json"),
            acList = await readFile("account.json"),
            dataSet = {};
        dataSet.docList = [];
        for (let key in acList[ctx.session.uid-1]) {
            dataSet[key] = acList[ctx.session.uid-1][key];
        }
        for (let i = 0, item; item = docList[i]; i++) {
            if (Number(item.local) === Number(ctx.session.admin)&& Number(item.status) !== 0) {
                dataSet.docList.push(item);
            }
        }
        ctx.response.body = dataSet;
        // console.log(dataSet);
    }else if(ctx.session.schAdmin){
        //如果你是校管理员
        let docList = await readFile("docList.json"),
            acList = await readFile("account.json"),
            dataSet = {};
        dataSet.docList = [];
        for (let key in acList[ctx.session.uid-1]) {
            dataSet[key] = acList[ctx.session.uid-1][key];
        }
        for (let i = 0, item; item = docList[i]; i++) {
            if(Number(item.status) !== 0)
                dataSet.docList.push(item);
        }
        ctx.response.body = dataSet;
    }else{
        //如果你是老师
        let docList = await readFile("docList.json"),
            acList = await readFile("account.json"),
            dataSet = {},
            uid = Number(ctx.cookies.get("uid"));
        dataSet.docList = [];
        for (let key in acList[ctx.session.uid-1]) {
            dataSet[key] = acList[ctx.session.uid-1][key];
        }
        for (let i = 0, item; item = docList[i]; i++) {
            if (item.uid === uid) {
                dataSet.docList.push(item);
            }
        }
        ctx.response.body = dataSet;
    }
    // console.log(ctx.response.body);
    await next();
};
function loginSuccess(ctx,item){
    // console.log(item.account);
    ctx.cookies.set("account",item.account,{
        domain:"localhost",
        path:"/",
        maxAge:36e5,
        httpOnly:true, //不让客户端读取这条cookie
        overwrite:false,
        signed:true
    });
    ctx.cookies.set("uid",item.id,{
        domain:"localhost",
        path:"/",
        maxAge:36e5,
        httpOnly:true, //不让客户端读取这条cookie
        overwrite:false,
        signed:true
    });
    // console.log(ctx.cookies.get("account"));
    // console.log(ctx.cookies.get("uid"));
    ctx.session = {
        account:item.account,
        name:item.name,
        uid:item.id,
        admin:item.admin,
        schAdmin:item.schAdmin,
        local:item.local
    };
}
const exit = async(ctx) => {
    ctx.cookies.set("account",0,{
        maxAge:0
    });
    ctx.cookies.set("uid",0,{
        maxAge:0
    });
    ctx.session = null;
    ctx.redirect("/");
};
const submit = async (ctx) =>{
    ctx.response.type = 'html';
    ctx.response.body = fs.createReadStream('./html/submit.html');
};
const detail = async (ctx,next) =>{
    if(ctx.request.query.docid){
        ctx.response.type = 'html';
        ctx.response.body = fs.createReadStream('./html/detail.html');
    }
};
const resDetail = async (ctx) => {
    //处理论文细节获取请求的函数
    let docList = await readFile("docList.json");
    if(ctx.session.admin || ctx.session.schAdmin){
        // console.log();
        // console.log("你是个管理员");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)=== Number(ctx.request.body.docid)){
                console.log("ascas");
                item.isAdmin = "1";
                ctx.response.body = item;
            }
        }
    }else {
        // console.log("你是个老师");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.body.docid))
                if(Number(item.uid) === Number(ctx.session.uid)){
                    ctx.response.body = item;
                }
        }
    }
};

const submitList = async (ctx) => {
    //此功能只给教师使用
    if(!ctx.session.admin&&!ctx.session.schAdmin){
        let obj = ctx.request.body;
        if(!obj.id){
            let docList = await readFile("docList.json");
            obj.id = docList.length+1;
            obj.lastModify=(new Date()).toLocaleString();
            obj.creationTime=(new Date()).toLocaleString();
            obj.status=0;
            obj.uid = ctx.session.uid;
            obj.author = ctx.session.name;
            obj.local = ctx.session.local;
            saveFile("docList.json",obj);
        }else{
            obj.lastModify=(new Date()).toLocaleString();
            saveFile("docList.json",obj);
        }
    }
};

const fileModify = async (ctx) => {
    let docList = await readFile("docList.json");
    // console.log(ctx.request.body.docid);
    for(let i=0,item;item=docList[i];i++){
        if(Number(item.id)===Number(ctx.request.body.docid))
            ctx.response.body = item;
    }
};

const fileDelete = async (ctx) => {
    //用来删除论文的操作，给教师用
    if(ctx.request.query.docid && !ctx.session.admin && !ctx.session.schAdmin){
        let docList = await readFile("docList.json");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.query.docid))
                docList.splice(i,1);
        }
        fs.writeFileSync("./json/docList.json",JSON.stringify(docList));
    }
    ctx.redirect('/command');
};
const fileSubmit = async (ctx) =>{
    //此功能也是教师使用
    if(ctx.request.query.docid && !ctx.session.admin && !ctx.session.schAdmin){
        let docList = await readFile("docList.json");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.query.docid))
                item.status = 1;
        }
        fs.writeFileSync("./json/docList.json",JSON.stringify(docList));
    }
    ctx.redirect('/command');
};

const think = async (ctx) => {
    //管理员审核功能
    console.log(Boolean(ctx.request.query.docid && ctx.session.admin || ctx.session.schAdmin));
    if(ctx.request.query.docid && ctx.session.admin || ctx.session.schAdmin){
        let docList = await readFile("docList.json");
        if(Number(ctx.request.query.status) === 2){
            for(let i=0,item;item=docList[i];i++){
                if(Number(item.id)===Number(ctx.request.query.docid))
                    item.status = 2;
            }
        }else if(Number(ctx.request.query.status) === 3){
            for(let i=0,item;item=docList[i];i++){
                if(Number(item.id)===Number(ctx.request.query.docid))
                    item.status = 3;
            }
        }
        fs.writeFileSync("./json/docList.json",JSON.stringify(docList));
    }
    ctx.redirect('/command');
};

const download = async (ctx) => {
    let link = "";
    if(ctx.request.query.docid && ctx.session.admin || ctx.session.schAdmin){
        let docList = await readFile("docList.json");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.query.docid)) {
                link = item.file;
                ctx.response.type = link.split('.')[2];
                ctx.response.body = fs.createReadStream(link);
            }
        }
    }else{
        let docList = await readFile("docList.json");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.query.docid))
                if(Number(item.uid) === Number(ctx.session.uid)){
                    link = item.file;
                    ctx.response.type = link.split('.')[2];
                    ctx.response.body = fs.createReadStream(link);
                }
        }
    }
};

route.post('/upload', async (ctx) => {
    if(ctx.request.body.docid) {
        const file = ctx.request.files.file; // 获取上传文件
        const reader = fs.createReadStream(file.path); // 创建可读流
        const ext = file.name.split('.').pop(); // 获取上传文件扩展名
        const name = `doc/${Math.random().toString()}.${ext}`;
        let docList = await readFile("docList.json");
        console.log(ctx.request.body.docid);
        for (let i = 0, item; item = docList[i]; i++) {
            if (Number(item.id) === Number(ctx.request.body.docid))
                docList[i].file = name;
        }
        fs.writeFileSync("./json/docList.json", JSON.stringify(docList));
        const upStream = fs.createWriteStream(name); // 创建可写流
        reader.pipe(upStream); // 可读流通过管道写入可写流
        ctx.redirect('back');
    }
});

const downloadPDF = async (ctx) => {
    let link = "";
    if(ctx.request.query.docid && ctx.session.admin || ctx.session.schAdmin){
        let docList = await readFile("docList.json");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.query.docid)){
                link = item.file;
                console.log(link);
                const data = await word2pdf(link);
                let name = link.split('.')[1];
                fs.writeFileSync("./pdf/"+name+".pdf", data);
                wm("./pdf/"+name+".pdf", name+".pdf");
                ctx.response.type = 'pdf';
                ctx.response.body = fs.createReadStream("./pdfw/"+name+".pdf");
            }
        }
    }else{
        let docList = await readFile("docList.json");
        for(let i=0,item;item=docList[i];i++){
            if(Number(item.id)===Number(ctx.request.query.docid))
                if(Number(item.uid) === Number(ctx.session.uid)){
                    link = item.file;
                    const data = await word2pdf(link);
                    let name = link.split('.')[1];
                    fs.writeFileSync("./pdf/"+name+".pdf", data);
                    wm("./pdf/"+name+".pdf", name+".pdf");
                    ctx.response.type = 'pdf';
                    ctx.response.body = fs.createReadStream("./pdfw/"+name+".pdf");
                }
        }
    }
};

route.get('/exit',keepLog,exit);
route.get('/submit',keepLog,submit);
route.get('/detail',keepLog,detail);
route.get('/delete',keepLog,fileDelete);
route.get('/downloadpdf',keepLog,downloadPDF);
route.post('/detail',keepLog,resDetail);
route.post('/submit',keepLog,submitList);
route.post('/fileModify',keepLog,fileModify);
route.post('/command',keepLog,sendList);
route.post('/login',login);
route.get('/download',keepLog,download);
route.get('/', main);
route.get('/command', keepLog ,command);
route.get('/fileSubmit',keepLog,fileSubmit);
route.get('/think',keepLog,think);

//处理静态资源
app.use(static(join(__dirname, "../static")));
//处理post请求体和文件上传
app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 1000*1024*1024    // 设置上传文件大小最大限制，默认10M
    }
}));
//session
app.use(session(config,app));
//注册路由
app.use(route.routes()).use(route.allowedMethods());
app.listen(3000);