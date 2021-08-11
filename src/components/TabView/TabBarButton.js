import {default as createLogger} from '../../modules/logFactory.js';

const logger = createLogger('TabBarButton');

const TAG_NAME = 'tab-bar-button';

/*
 * The idea here is each item will be a link. if the href contains a url, that url will be dynamically loaded (once) as a page. The page will be given an id after load, and id will be appended as fragment to the href.
 *
 * If it contains a #hash (URI fragment) the page with the matching id will be shown.
 *
 * When there's no JS the page should just render as a stacked list of page fragments, where the fragment identifier causes the page to scroll that fragment into view. Obviously dynamic content will not load and clicking the link will take the user to that page instead.
 */
customElements.define(TAG_NAME, class TabBarButton extends HTMLButtonElement{
    static TAG_NAME = TAG_NAME;

    static get observedAttributes() { return ['aria-selected']; }

    constructor() {
        super();
        logger.debug(`Creating ${TAG_NAME}`);
        this._attachEventListeners();
    }

    _attachEventListeners() {
        this.addEventListener('click', (e)=>{
            e.preventDefault();
            e.stopPropagation();
            this.dispatchEvent(new CustomEvent('tab-item-click', {bubbles: true, detail: {parentEvent: e, panelId: e.target.getAttribute('aria-controls')}}));
        });
    }

    static __registerElement() {
        customElements.define(TabBarButton.TAG_NAME, TabBarButton, {extends: 'button'});
    }
}, {extends: 'button'});

export default customElements.get(TAG_NAME);

