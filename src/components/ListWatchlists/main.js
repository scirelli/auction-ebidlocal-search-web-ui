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
        return this._buildTable();
    }

    _attachEventListeners() {
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('button.view-button'), this._addViewEventListener.bind(this));
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('button.edit-button'), this._addEditEventListener.bind(this));
        Array.prototype.forEach.call(this.shadowRoot.querySelectorAll('button.delete-button'), this._addDeleteEventListener.bind(this));

        document.body.addEventListener('watchlist-change', e => {
            logger.debug(e.detail);
            //There was a change make sure lists match
            return this._requestWatchlists().then(lists => {
                let diff = {add: [], remove: []},
                    tbody = this.shadowRoot.querySelector('#list-watchlists-container table tbody'),
                    currentElems = Array.prototype.reduce.call(this.shadowRoot.querySelectorAll('#list-watchlists-container table tbody tr'), (a, e)=>{
                        a[e.id] = e;
                        return a;
                    }, {}),
                    srcList = {};

                lists.forEach(list => {
                    list.rowId = this._generateWatchlistRowId(list.id, list.name);
                    srcList[list.rowId] = list;

                    if(!currentElems[list.rowId]) {
                        diff.add.push(list);
                    }
                });

                for(let id in currentElems) {
                    if(!srcList[id]) {
                        diff.remove.push(currentElems[id]);
                    }
                }

                diff.add.forEach(watchlistInfo=>{
                    let frag = this._createListRowElem(watchlistInfo);
                    this._addViewEventListener(frag.querySelector('button.view-button'));
                    this._addEditEventListener(frag.querySelector('button.edit-button'));
                    this._addDeleteEventListener(frag.querySelector('button.delete-button'));
                    tbody.appendChild(frag);
                });
                diff.remove.forEach(e => e.remove());
            }).catch(logger.error);
        });
    }

    _addEditEventListener(button) {
        button.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            let watchlistId = button.getAttribute('data-watchlist-id'),
                watchlistName = button.value,
                rowId = this._generateWatchlistRowId(watchlistId, watchlistName);

            this.dispatchEvent(new CustomEvent('edit-watchlist-click', {bubbles: true, detail: {id: watchlistId, name: watchlistName, rowId: rowId}}));
        });
        return button;
    }

    _addViewEventListener(button) {
        button.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            let watchlistId = button.getAttribute('data-watchlist-id'),
                watchlistName = button.value,
                rowId = this._generateWatchlistRowId(watchlistId, watchlistName);

            window.location.href = `/viewwatchlists.html?id=${encodeURIComponent(this._getUserId())}#${rowId}`;
            this.dispatchEvent(new CustomEvent('view-watchlist-click', {bubbles: true, detail: {id: watchlistId, name: watchlistName, rowId: rowId}}));
        });
        return button;
    }

    _addDeleteEventListener(button) {
        button.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();

            let watchlistId = button.getAttribute('data-watchlist-id'),
                watchlistName = button.value,
                rowId = this._generateWatchlistRowId(watchlistId, watchlistName);

            this.dispatchEvent(new CustomEvent('delete-watchlist-click', {bubbles: true, detail: {name: watchlistName, id: watchlistId, rowId: rowId}}));
        });
        return button;
    }

    _buildTable() {
        return this._requestWatchlists().then(lists => {
            const tbody = this.watchlistsContainerElem.querySelector('tbody');
            return lists.forEach(watchlistInfo=>{
                tbody.appendChild(this._createListRowElem(watchlistInfo));
            });
        }).catch(logger.error);
    }

    _createListRowElem(watchlistInfo) {
        const rowTemplate = this.shadowRoot.querySelector('#template-row');
        let {name, list, id} = watchlistInfo,
            row = rowTemplate.content.cloneNode(true),
            rowId = this._generateWatchlistRowId(id, name),
            listElem = row.querySelector('.list'),
            data = {
                watchlistId:      id,
                rowId:            rowId,
                userId:           this._getUserId(),
                userIdURIEncoded: window.encodeURIComponent(this._getUserId()),
                watchlistName:    name
            };

        row.querySelector('tr').setAttribute('id', rowId);
        Array.prototype.forEach.call(row.querySelectorAll('button'), elem => {
            elem.getAttributeNames().forEach(attr => {
                elem.setAttribute(attr, elem.getAttribute(attr).mustache(data));
            });
        });

        row.querySelector('.list-name').appendChild(this._buildListNameElement(name));
        this._buildListItemElements(list).forEach(item => {
            listElem.appendChild(item);
        });
        return row;
    }

    _buildListNameElement(name) {
        let span = document.createElement('span');
        span.innerText = name;
        return span;
    }

    _buildListItemElements(list) {
        return list.map(item => {
            let span = document.createElement('span');
            span.classList.add('item');
            span.innerText = item;
            return span;
        });
    }

    _clearTable() {
        this.shadowRoot.querySelector('#list-watchlists-container table tbody').innerHTML = '';
    }

    _resetContent() {
        this._clearTable();
        this._buildTable();
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

    _generateWatchlistRowId(listId, listName) {
        return `${listName}_${listId}`.escapeForCSS();
    }

    static __registerElement() {
        customElements.define(TAG_NAME, ListWatchlists);
    }
});

export default customElements.get(TAG_NAME);
