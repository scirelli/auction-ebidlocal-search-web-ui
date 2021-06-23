function fetchTextBodies(urls) {
    if(!Array.isArray(urls)) throw new Error('fetchTextBody param 1 must be an array');
    return Promise.allSettled(urls.map(url=>{
        return fetch(url, {
            method:   'GET',
            redirect: 'follow'
        });
    })).then(promises => {
        return promises.filter(p=>p.status === 'fulfilled').map(p=>p.value);
    }).then(responses => {
        return Promise.allSettled(responses.map(r=>r.text()));
    }).then(promises => promises.filter(p=>p.status === 'fulfilled')).then(promises => promises.map(p=>p.value)).then(values=>values.filter(Boolean));
}

function fetchHtmlElements(htmlFragUrls) {
    return fetchTextBodies(htmlFragUrls).then(frags=> {
        return frags.reduce((a, frag) => {
            let template = document.createElement('tempalte');
            template.innerHTML = frag;
            a = a.concat(...Array.prototype.slice.call(template.childNodes).filter(n=>!(n instanceof Text)));
            return a;
        }, []);
    });
}

function fetchStyleElements(styleUrls) {
    return fetchTextBodies(styleUrls).then(styles=>{
        return styles.map(s=>{
            let style = document.createElement('style');
            style.textContent = s;
            return style;
        });
    });
}

export {fetchHtmlElements, fetchStyleElements};
