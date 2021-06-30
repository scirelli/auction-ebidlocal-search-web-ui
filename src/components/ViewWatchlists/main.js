import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../../modules/extras-location.js';
import '../../modules/String.js';

const logger = createLogger('ViewWatchlists');

/*
 * Create User Watchlist
 *     POST /api/user/{userID}/watchlist
 *
 * Get User Wathclist
 *     GET /api/user/{userID}/watchlist/{listID}
 *
 * Create User
 *     POST /api/user
 *     --data '{"name": "Steve C.", "email": "scirelli+ebidlocal@gmail.com"}' \
 *
 * Get user data
 *     GET /api/user/{userID}/data.json
 *
 * Get static files
 *     GET /api/user/{userID}/
 *
 * Get watch list
 *     GET /api/watchlist
 */
class ViewWatchlists extends HTMLElement{
    static TAG_NAME = 'view-watchlists';
    static ONE_SECOND_DELAY = 3000;
    static MESSAGE_CLOSE_DEPLAY = 3000;

    static get observedAttributes() { return ['data-watchlist-url']; }

    constructor() {
        super();
        logger.debug('Creating view watch list element');

        this.userId = '';
        this._loaded = false;
        this._setUserId(window.location.searchObj.id);
        this.attachShadow({mode: 'open'});
        this._promiseOfContent = this._loadContent(
            ['/components/ViewWatchlists/list.partial.html'],
            ['/components/ViewWatchlists/main.css']
        ).then(()=>{
            this._init(this.shadowRoot);
            this._loaded = true;
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
            case 'data-watchlist-url':
                this._loadWarchlistFromUrl(newValue);
                break;
        }
    }

    _loadContent(html, css) {
        return Promise.allSettled([
            fetchHtmlElements(html).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements(css).then(elems => this.shadowRoot.append(...elems))
        ]).finally(()=>{
            this.dispatchEvent(new CustomEvent('dynamic-content-loaded', {bubbles: true}));
            logger.debug(ViewWatchlists.TAG_NAME + ' created');
        });
    }

    _init(rootElem) {
        this.watchlist = rootElem.querySelector('#watchlist');
        this.listItemTemplate = rootElem.querySelector('#li-template');
        this._attachEventListeners();
    }

    _setUserId(id) {
        this.userId = id || '';
        return this;
    }

    _attachEventListeners() {
        this.addEventListener('add-list-item', (e)=>{
            let elem = this.addListItem(e.detail.link, e.detail.listName),
                detail = elem instanceof Error ? {error: elem, link: e.detail.link, listName: e.detail.listName} : {elem: elem};
            this.dispatchEvent(new CustomEvent('list-item-added', {bubbles: true, detail: detail}));
        });
        this.addEventListener('remove-list-item', (e)=>{
            let elems = this.removeListItem(e.detail.link),
                detail = elems.length ? {elem: elems} : {error: new Error('Not found'), link: e.detail.link};
            this.dispatchEvent(new CustomEvent('list-item-removed', {bubbles: true, detail: detail}));
        });
        this.addEventListener('load-list', (e)=>{
            this._loadWarchlistFromUrl(e.detail.url);
        });
    }

    /*
     * Expected Response:
     *   {
     *      "watchlists": {
     *        "wine list":"9XcsXa1ZWvItsdXtK2gmFpgkbcY=",
     *        "wine list4":"9XcsXa1ZWvItsdXtK2gmFpgkbcY="
     *       }
     *    }
    */
    _requestWatchlist(url) {
        return fetch(url, {
            method:   'GET',
            redirect: 'follow'
        }).then(response=>response.json())
            .then(data=>data.watchlists);
    }

    _loadWatchlist(watchlists) {
        let elems = [];
        for(let list in watchlists) {
            elems.push(this.addListItem(`/api/user/${this.userId}/watchlist/${watchlists[list]}`, list));
        }
        return elems;
    }

    _loadWarchlistFromUrl(url) {
        return this._requestWatchlist(url)
            .then(this._loadWatchlist.bind(this))
            .then((elems)=>{
                let detail = elems.length ? {elem: elems} : {error: new Error('Failed to load'), url: url};
                this.dispatchEvent(new CustomEvent('watchlist-loaded', {bubbles: true, detail: detail}));
            });
    }

    _createListItem(link, listName) {
        let docFrag = this.listItemTemplate.content.cloneNode(true),
            anchor = docFrag.querySelector('a');
        anchor.innerText = listName;
        anchor.href = link;
        return docFrag;
    }

    addListItem(link, listName) {
        if(!link || !listName) return new Error('Name and link are required.');
        let elem = this._createListItem(link, listName);
        this.watchlist.appendChild(elem);
        return elem;
    }

    removeListItem(link) {
        let removed = [];
        Array.prototype.slice.call(this.watchlist.querySelectorAll(`a[href="${link}"]`)).map(e=> {
            while(e.tagName !== 'li') e = e.parent;
            if(e.tagName === 'li') {
                removed.push(e);
                e.remove();
            }
        });
        return removed;
    }

    static __registerElement() {
        customElements.define(ViewWatchlists.TAG_NAME, ViewWatchlists);
    }
}

ViewWatchlists.__registerElement();
export default ViewWatchlists;
