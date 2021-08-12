function escapeForCSS(s) {
    let ss = s.replace(/[^a-zA-Z0-9-_]/g, '').replace(/^[-0-9]+/, '');
    if(!ss) throw new Error(`Selector can not be an empty string '${s}'`);
    return ss;
}

if(!String.prototype.escapeForCSS) {
    String.prototype.escapeForCSS = function() {
        return escapeForCSS(this);
    };
}

export {escapeForCSS};
