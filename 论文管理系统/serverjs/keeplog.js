const keepLog = async (ctx,next) => {
    // console.log("检查cookies");
    // console.log(ctx);
    // console.log(ctx.cookies.get("account"));
    if(ctx.cookies.get("account")){
        if(ctx.session.isNew){
            ctx.session = {
                account:ctx.cookies.get("account"),
                uid:ctx.cookies.get("uid")
            };
        }
        await next();
    }else {
        ctx.redirect("/");
        ctx.response.body = "请重新登录";
    }
};

module.exports = keepLog;