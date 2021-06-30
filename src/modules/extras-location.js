//Author: Stephen Cirelli
//---------------------------------------------------------
// Desc: Converts a string in the form of a URL's query portion (everything after the ?) to an obj
// Example: str = 'var1=hi&var2=bye' output would be {var1:'hi', var2:'bye'}
//---------------------------------------------------------
function queryStrToObj(str) {
    str = str.split('&').filter(Boolean);
    var obj = new Object();
    for(let i=0; i<str.length; i++) {
        let [key, value] = str[i].split('=');
        value = value ? unescape(value) : null;
        key = unescape(key);
        if(key in obj) {
            obj[key] = [].concat(obj[key], value);
        }else{
            obj[key] = value;
        }
    }
    return obj;
}

function baseURL( ) {
    var port = window.location.port ? ':' + window.location.port : '';
    var tmp = window.location.pathname.split('/'),
        path = '';
    for( var i=0; i<tmp.length-1; i++ ) path += tmp[i] + '/';
    return window.location.protocol + '//' + window.location.hostname + port + path;
}

function origin() {
    return window.location.protocol + '//' + window.location.host;
}

//---------------------------------------------------------
// Desc: Converts the query portion of the current URL to a obj
//---------------------------------------------------------
function searchtoObj() {
    var str = window.location.search;
    return queryStrToObj(str.substr(1, str.length));
}

function searchObjToStr(searchObj) {
    let str = [];
    for(let key in searchObj) {
        let value = searchObj[key];
        key = encodeURIComponent(key);
        if(Array.isArray(value)) {
            value = value.map(encodeURIComponent).map((v)=>`${key}${v?'='+v:''}`);
        }else{
            value = `${key}${value?'='+encodeURIComponent(value):''}`;
        }
        str = str.concat(value);
    }
    return str.length ? '?' + str.join('&') : '';
}
//---------------------------------------------------------
// Desc: Converts the hash portion of the current URL to a obj
//---------------------------------------------------------
function hashVariables() {
    var str = window.location.hash;
    return queryStrToObj(str.substr(1, str.length));
}


//---- Build the query string obj ----
window.location.baseURL   = baseURL();
Object.defineProperty(window.location, 'searchObj', {
    get: searchtoObj
});
window.location.addSearch = function(key, value) {
    if(!key) return;
    let searchObj = window.location.searchObj;
    if(key in searchObj) {
        searchObj[key] = [].concat(searchObj[key], value);
    } else{
        searchObj[key] = [].concat(value);
    }
    history.replaceState(null, '', searchObjToStr(searchObj) + window.location.hash);
};
window.location.pushSearch = function(key, value) {
    if(!key) return;
    let searchObj = window.location.searchObj;
    if(key in searchObj) {
        searchObj[key] = [].concat(searchObj[key], value);
    } else{
        searchObj[key] = [].concat(value);
    }
    history.pushState(null, '', searchObjToStr(searchObj) + window.location.hash);
};
window.location.removeSearch = function(key) {
    if(!key) return;
    let searchObj = window.location.searchObj;
    delete searchObj[key];
    history.replaceState(null, '', (searchObjToStr(searchObj) + window.location.hash) || '?');
};

Object.defineProperty(window.location, 'hashObj', {
    get: hashVariables
});
window.location.addHash = function(key, value) {
    var cur = window.location.hashObj,
        hash = [];
    key = encodeURIComponent(key);
    value = encodeURIComponent(value);
    cur[key] = value;
    for(let prop in cur) {
        hash.push(`${prop}=${cur[prop]}`);
    }
    window.location.hash = '#' + hash.join('#');
};
window.location.removeHash = function(key) {
    var cur = window.location.hashObj,
        hash = [];
    key = encodeURIComponent(key);
    delete cur[key];
    for(let prop in cur) {
        hash.push(`${prop}=${cur[prop]}`);
    }
    window.location.hash = '#' + hash.join('#');
};

if(!window.location.origin) window.location.origin = origin();

/*
window.location.prototype.searchObj = function(){
    var str = this.search.substr(1, this.length).split('&');
    var obj = new Object();
    for( var i=0; i<str.length; i++){
        var tmp = str[i].split('=');
        obj[tmp[0]] = tmp[1];
    }
    return obj;
}
*/
export default {hashVariables, searchtoObj, baseURL, origin, queryStrToObj};
