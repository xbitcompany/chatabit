window.xbc = {
    init: function(){
        document.addEventListener('DOMContentLoaded', xbc.ready);
    },
    appendHead: function(path) {
        var head = document.getElementsByTagName("head")[0];
        var js = document.createElement("script");
        js.type = "text/javascript";
        js.src = path;
        head.appendChild(js);
    },
    ready: function(){
        console.log('DOM ready');
        //setting default session vars
        xbc.session.obj = { active: false, xid: xbc.session.create(), pagestarted: Date.now() };
        //check session status
        xbc.session.check();
        xbc.api.query(xbc.api.getpageparams,{ page: document.location.href }, function(error,response){

        });
    },
    session: {
        create: function(){
            return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        },
        check: function(){
            xbcdata = xbc.session.get();
            if(xbcdata === null){
                //init localstorage
                xbc.session.set();
            }
            else {
                //try to parse, if not possible reset localstorage
                try {
                    tmpObj = JSON.parse(xbcdata);
                    if(typeof tmpObj.xid === 'string' && typeof tmpObj.active === 'boolean'){
                        xbc.session.obj = tmpObj;
                        console.log('session id '+ tmpObj.xid);
                        //set pagestarted
                        xbc.session.obj.pagestarted = Date.now();
                        xbc.session.set();
                    }
                    else throw new Error('invalid JSON');
                }
                catch(e){
                    xbc.session.set();
                }
            }
        },
        get: function(){
            return localStorage.getItem('xbc');
        },
        set: function(data){
            localStorage.setItem('xbc',JSON.stringify(xbc.session.obj));
        }
    },
    api: {
        endpoint: 'http://127.0.0.1:3000/api',
        getpageparams: '/getpageparams',
        query: function(url,params,callback){
            try {
                request = new XMLHttpRequest();
                //add endpoint base url
                url = xbc.api.endpoint + url;
                request.open('POST', url, true);
                request.setRequestHeader('Content-Type', 'text/json; charset=UTF-8');
                request.responseType = 'json';
                request.onload = function(e) {
                    if (this.status == 200) {
                        //callback the response
                        callback(false,this.response);  
                    }
                };
                request.send(JSON.stringify(params));
            }
            catch(e){
                callback(true);
            }
        }
    }
};

xbc.init();

