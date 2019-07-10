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
        pageUrl = window.btoa(document.location.hostname + document.location.pathname);
        xbc.api.query(xbc.api.getpageparams,{ page: document.location.href }, function(error,response){
            if(response.status === 404){
                console.log('chat inactive on this page.');
            }
            else if(response.status === 200){
                console.log(response);
                xbc.storage.page = xbc.storage.getPage(pageUrl);
                //check if current page views are past page views
                if(xbc.storage.page.views >= response.views){
                    console.log('opening chat');
                    xbc.ui.open();
                }
                else {
                    //put timer to open chat
                    xbc.tmr = setTimeout(xbc.ui.open,response.seconds*1000);
                }
            }
        });
    },
    ui: {
        open: function(){
            console.log('opening chat by ui');
            xbc.dom.inject('/templates/index.html',(error) => {
                if(error){
                    //TODO: error management
                    console.log('err');
                }
                else {
                    xbc.ui.setInviteDialog();
                }
            });
        },
        setInviteDialog: function(){
            document.getElementById('xbitChat').className = 'xbc-invite';
        }
    },
    storage: {
        getPage: function(url){
            page = localStorage.getItem(url);
            if(page === null){
                page = {views: 1, starttime: Date.now()};
                localStorage.setItem(url,JSON.stringify(page));
            }
            else {
                page = JSON.parse(page);
                if((Date.now()-page.starttime) < 3600000){
                    page.views += 1;
                    localStorage.setItem(url,JSON.stringify(page));
                }
                else {
                    //session expired
                    page = {views: 0, starttime: Date.now()};
                    localStorage.setItem(url,JSON.stringify(page));
                }
            }
            return page;
        }
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
        endpoint: 'http://127.0.0.1:8000/api',
        getpageparams: '/getpageparams',
        query: function(url,params,callback){
            try {
                request = new XMLHttpRequest();
                //add endpoint base url
                url = xbc.api.endpoint + url;
                request.open('POST', url, true);
                request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
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
    },
    dom: {
        inject: function(address,callback){
            try {
                request = new XMLHttpRequest();
                request.open('GET', address, true);
                request.responseType = 'text';
                request.onload = function(e) {
                    if (this.status == 200) {
                        document.body.innerHTML += this.response;
                        callback(false);
                    } else {
                        callback(true);
                    }
                }
                request.send();
            }
            catch(e){
                callback(true);
            }
        }
    }
};

xbc.init();

