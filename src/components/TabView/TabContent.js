import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../../modules/extras-location.js';
import '../../modules/String.js';
const logger = createLogger('PageFragment');

const TAG_NAME = 'page-fragment';

/*
 */
customElements.define(TAG_NAME, class PageFragment extends HTMLElement{
    static TAG_NAME = TAG_NAME;

    static get observedAttributes() { return ['data-url', 'data-loaded']; }

    constructor() {
        super();
        logger.debug(`Creating ${TAG_NAME}`);
        this._loaded = false;
        this.attachShadow({mode: 'open'});
        this._initDom();
        this._attachEventListeners();
    }

    _initDom() {
        let div = this.shadowRoot.createElement('div');
        div.innerHTML = this.html;
        this.shadowRoot.appendChild(div.querySelector('div'));
    }

    _attachEventListeners() {
    }

    static __registerElement() {
        customElements.define(PageFragment.TAG_NAME, PageFragment);
    }

    static html = `
        <div>
            <slot name="page">Empty tab</slot>
        </div>
    `
});

export default customElements.get(TAG_NAME);

