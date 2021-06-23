if(!String.prototype.mustache) {
    String.prototype.mustache = function(o) {
        return this.replace(/{{([^{}]*)}}/g, function(a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r:a;
        });
    };
}

export {};
