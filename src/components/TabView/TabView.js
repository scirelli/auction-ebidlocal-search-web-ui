import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../../modules/extras-location.js';
import '../../modules/String.js';
import './TabBarButton.js';
import './TabContent.js';

const logger = createLogger('TabView');

const TAG_NAME = 'tab-view';

//TODO: Add tabs to history.
customElements.define(TAG_NAME, class TabView extends HTMLElement{
    static TAG_NAME = TAG_NAME;

    static get observedAttributes() { return []; }

    constructor() {
        super();
        logger.debug(`Creating ${TAG_NAME}`);

        this._loaded = false;
        this.attachShadow({mode: 'open'});
        this._promiseOfContent = this._loadContent(
            ['/components/TabView/tabView.partial.html'],
            [/*'/components/TabView/main.css'*/]
        ).then(()=>{
            this._initDom(this.shadowRoot);
            this._attachEventListeners();
        }).then(()=> {
            this._activateTabFromLocationHash();
        }).catch(e=>{
            logger.error(e);
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(!this._loaded) {
            this._promiseOfContent.then(()=> {
                this.attributeChangedCallback(name, oldValue, newValue);
            });
            return;
        }
        if(oldValue === newValue) return;
        switch(name) {
            default:
        }
    }

    _loadContent(html, css) {
        return Promise.allSettled([
            fetchHtmlElements(html).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements(css).then(elems => this.shadowRoot.append(...elems))
        ]).finally(()=>{
            this.dispatchEvent(new CustomEvent('dynamic-content-loaded', {bubbles: true}));
            logger.debug(TabView.TAG_NAME + ' created');
        });
    }

    _initDom(/*rootElem*/) {}

    _attachEventListeners() {
        const tabsElem = this.shadowRoot.querySelector('#tab-container');

        this.tabElemObserver = new MutationObserver(this._onNewTabMenuItem.bind(this));
        this.tabElemObserver.observe(tabsElem, {subtree: false, childList: true});

        tabsElem.addEventListener('tab-item-click', this._onTabClick.bind(this));
        this.shadowRoot.addEventListener('slotchange', event => logger.log('Slot Change', event));
        window.addEventListener('popstate', this._onHistoryPopState.bind(this));
    }

    _onTabClick(e) {
        e.preventDefault();
        e.stopPropagation();
        logger.log('Button clicked', e.target, e.detail);
        let tabPanelElem = this.querySelector(`#${e.detail.panelId}`),
            tabElem = e.target;

        if(!tabPanelElem) {
            this.dispatchEvent(new CustomEvent('tab-not-found', {bubbles: true, detail: {error: new Error(`No tab with id '${e.detail.panelId}' found.`)}}));
            logger.error('tab-not-found', e.detail);
            return;
        }

        this._activateTab(tabElem, tabPanelElem);
        this._updateHistoryForTab(e.target);
    }

    _onHistoryPopState(event) {
        logger.info(`location: ${document.location}, state: ${JSON.stringify(event.state)}`);
        this._activateTabFromLocationHash();
    }

    _activateTabFromLocationHash() {
        let tabElem = this.querySelector(`${window.location.hash || '#undefined'}`);
        if(tabElem) {
            this._activateTab(tabElem, this.querySelector(`#${tabElem.getAttribute('aria-controls')}`));
        }
    }

    _activateTab(tabElem, tabPanelElem) {
        if(!tabElem || !tabPanelElem) return;
        this._updateTabList(tabElem);
        this._updatePanels(tabPanelElem);
    }

    _updateTabList(activeTab) {
        Array.prototype.forEach.call(this.querySelectorAll('*[is="tab-bar-button"]'), (elem)=>{
            logger.log(elem);
            elem.tabIndex = -1;
            elem.ariaSelected = false;
        });
        activeTab.ariaSelected = true;
        activeTab.removeAttribute('tabindex');
    }

    _updatePanels(activeTabPanel) {
        Array.prototype.forEach.call(this.querySelectorAll('*[is="tab-panel"]'), (elem)=>{
            logger.log(elem);
            elem.classList.add('hidden');
        });
        activeTabPanel.classList.remove('hidden');
    }

    _updateHistoryForTab(activeTab) {
        window.history.pushState({tabId: activeTab.id, panelId: activeTab.getAttribute('aria-controls')}, activeTab.textContent.trim(), `#${activeTab.id}`);
    }

    _onNewTabMenuItem(mutationRecords) {
        console.log('callback that runs when observer is triggered');
        mutationRecords.forEach( (mutation) => {
            switch(mutation.type) {
                case 'childList':
                    logger.log('One or more children have been added to and/or removed from the tree.  (See mutation.addedNodes and mutation.removedNodes.)');
                    break;
                case 'attributes':
                    logger.log('An attribute value changed on the element in mutation.target.  The attribute name is in mutation.attributeName, and its previous value is in mutation.oldValue.');
                    break;
            }
        });
    }

    _getTabFromId(tabId) {
        return this.querySelector(`#${tabId}`);
    }

    _getTabPanelFromTabId(tabId) {
        return this._getTabFromId(tabId).getAttribute('aria-controls');
    }

    static __registerElement() {
        customElements.define(TabView.TAG_NAME, TabView);
    }
});

export default customElements.get(TAG_NAME);

