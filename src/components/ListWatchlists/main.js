import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../../modules/extras-location.js';
import '../../modules/extras-css.js';
import '../../modules/String.js';
import {requestUserWatchlists, requestWatchlist} from '../../modules/apiUtils.js';

const logger = createLogger('ListWatchlists');
const TAG_NAME = 'list-watchlists';

customElements.define(TAG_NAME, class ListWatchlists extends HTMLElement{
    static TAG_NAME = TAG_NAME;

    static get observedAttributes() { return ['user-id', 'data-user-id']; }

    constructor() {
        super();
        logger.debug('Creating list watch list element');

        this.attachShadow({mode: 'open'});
        this._loaded = false;
        this.userId = '';
        this.watchlistsContainerElem = null;

        this._promiseOfContent = Promise.allSettled([
            fetchHtmlElements(['/components/ListWatchlists/form.partial.html']).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements([]).then(elems => this.shadowRoot.append(...elems))
        ])
            .then(()=>{
                this._loaded = true;
                this.watchlistsContainerElem = this.shadowRoot.querySelector('#list-watchlists-container');
            })
            .finally(()=>{
                this.dispatchEvent(new CustomEvent('dynamic-content-loaded', {bubbles: true}));
                logger.debug('List Watchlists created');
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
            case 'data-user-id':
            case 'user-id':
                this._setUserId(newValue);
                this.innerHTML = '';
                this.init(this.shadowRoot);
                break;
        }
    }

    init() {
        this._initDom().then(this._attachEventListeners.bind(this));
    }

    _initDom() {
        const rowTemplate = this.shadowRoot.querySelector('#template-row');
        return this._requestWatchlists().then(lists => {
            return lists.reduce((a, l)=>{
                let {name, list, id} = l,
                    row = rowTemplate.content.cloneNode(true),
                    listElem = row.querySelector('.list'),
                    span;

                row.querySelector('tr').setAttribute('id', id.escapeForCSS());
                Array.prototype.forEach.call(row.querySelectorAll('button'), elem => {
                    elem.value = elem.value.mustache({
                        watchlistId:    id,
                        watchlistIdCSS: id.escapeForCSS(),
                        userId:         this._getUserId(),
                        userIdEncoded:  window.encodeURIComponent(this._getUserId()),
                        watchlistName:  name
                    });
                    elem.setAttribute('data-row-id', row.querySelector('tr').id);
                });

                span = document.createElement('span');
                span.innerText = name;
                row.querySelector('.list-name').appendChild(span);

                list.forEach(item => {
                    span = document.createElement('span');
                    span.classList.add('item');
                    span.innerText = item;
                    listElem.appendChild(span);
                });

                a.push(row);
                return a;
            }, []);
        }).then(rows => {
            rows.forEach(row => {
                this.watchlistsContainerElem.querySelector('tbody').appendChild(row);
            });
            return rows;
        }).catch(logger.error);
    }

    _attachEventListeners() {
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('button.view-button'), elem => {
            elem.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = elem.value;
            });
        });
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('button.delete-button'), elem => {
            elem.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                fetch(`/api/user/${this._getUserId()}/watchlist`, {
                    method:  'DELETE',
                    cache:   'no-cache',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    redirect:       'follow',
                    referrerPolicy: 'no-referrer',
                    body:           JSON.stringify({name: e.currentTarget.value})
                }).then(response => {
                    logger.log(response.status);
                    if(response.status === 204) {
                        let row = this.shadowRoot.querySelector(`#${elem.getAttribute('data-row-id')}`);
                        if(row) row.remove();
                    }
                }).catch(logger.error);
            });
        });
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('button.edit-button'), elem => {
            elem.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                window.location.removeSearch('watchlistId');
                window.location.pushSearch('watchlistId', e.currentTarget.value);
                this.dispatchEvent(new CustomEvent('edit-watchlist-click', {bubbles: true, detail: {watchlistId: e.currentTarget.value}}));
            });
        });
    }

    _setUserId(id) {
        this.userId = id;
        return this;
    }

    _getUserId() {
        return this.userId;
    }

    _requestWatchlists() {
        return requestUserWatchlists(this._getUserId())
            .then(userLists => {
                let promises = [];
                for(let listName in userLists) {
                    promises.push(requestWatchlist(userLists[listName]).then(items=>{
                        return {
                            name: listName,
                            list: items,
                            id:   userLists[listName]
                        };
                    }));
                }
                return Promise.allSettled(promises).then(lists => {
                    return lists.filter(l=>l.status).map(l=>l.value);
                });
            });
    }

    static __registerElement() {
        customElements.define(TAG_NAME, ListWatchlists);
    }
});

export default customElements.get(TAG_NAME);
