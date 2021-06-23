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

        if(!obj[key]) {
            obj[key] = value;
        }else{
            if(Array.isArray(obj[key])) {
                obj[key].push(value);
            }else{
                obj[key] = [obj[key], value];
            }
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

//---------------------------------------------------------
// Desc: Converts the hash portion of the current URL to a obj
//---------------------------------------------------------
function hashVariables() {
    var str = window.location.hash;
    return queryStrToObj(str.substr(1, str.length));
}


//---- Build the query string obj ----
window.location.searchObj =  searchtoObj();
window.location.baseURL   = baseURL();
window.location.hashObj   = hashVariables();
if( !window.location.origin ) window.location.origin = origin();

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
export default { hashVariables, searchtoObj, baseURL, origin, queryStrToObj };
