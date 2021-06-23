import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';

class IncluderHTMLElement extends HTMLElement{
    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this._promiseOfContent = Promise.allSettled([
            this.__includeHtmlFrags(),
            this.__includeStyles()
        ]);
    }

    __includeHtmlFrags() {
        return fetchHtmlElements(this.getHtmlFragUrls()).then(elems => this.shadowRoot.append(...elems));
    }

    __includeStyles() {
        return fetchStyleElements(this.getStyleUrls()).then(elems => this.shadowRoot.append(...elems));
    }

    getHtmlFragUrls() {
        throw new Error('Not implemented');
    }

    getStyleUrls() {
        throw new Error('Not implemented');
    }
}

export default IncluderHTMLElement;
