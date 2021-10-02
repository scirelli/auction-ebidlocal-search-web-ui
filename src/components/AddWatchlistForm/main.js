import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../UserInfoForm/main.js';
import '../../modules/extras-location.js';
import '../../modules/extras-css.js';
import '../../modules/String.js';
import '../../modules/Function.js';
import {requestUserWatchlists, requestWatchlist} from '../../modules/apiUtils.js';

const logger = createLogger('WatchlistForm');

/*
 * Create User Watchlist ???? <---- Look into this one
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
class WatchlistForm extends HTMLElement{
    static TAG_NAME = 'add-watchlist-form';
    static ONE_SECOND_DELAY = 3000;
    static MESSAGE_CLOSE_DEPLAY = 3000;

    static get observedAttributes() { return ['data-edit', 'edit', 'user-id', 'data-user-id', 'data-hide-user-form', 'hide-user-form']; }

    constructor() {
        super();
        logger.debug('Creating watch list element');

        this.attachShadow({mode: 'open'});
        this._loaded = false;
        this._editing = null;
        this._promiseOfContent = Promise.allSettled([
            fetchHtmlElements(['/components/AddWatchlistForm/form.partial.html']).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements(['/components/AddWatchlistForm/main.css']).then(elems => this.shadowRoot.append(...elems))
        ])
            .then(()=>{
                this.init(this.shadowRoot);
                this._loaded = true;
            })
            .finally(()=>{
                this.dispatchEvent(new CustomEvent('dynamic-content-loaded', {bubbles: true}));
                logger.debug('WatchlistForm created');
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
            case 'data-edit':
            case 'edit':
                this._editing = this._editWatchlist(newValue);
                break;
            case 'data-user-id':
            case 'user-id':
                this._setUserId(newValue);
                break;
            case 'data-hide-user-form':
            case 'hide-user-form':
                if(this.hasAttribute('data-hide-user-form') || this.hasAttribute('hide-user-form')) {
                    this.userFormElem.classList.add('hidden');
                }else{
                    this.userFormElem.classList.remove('hidden');
                }
                break;
        }
    }

    init(rootElem) {
        this.userElem = rootElem.querySelector('#user');
        this.createUserElem = rootElem.querySelector('#createUser');
        this.userErrorElem = rootElem.querySelector('span.user.error');
        this.userDialog = rootElem.querySelector('user-info-form');
        this.formElem = rootElem.querySelector('#createWatchlistForm');
        this.watchlistElem = rootElem.querySelector('#watchlistList');
        this.watchlistNameElem = rootElem.querySelector('#watchlistName');
        this.watchlistNameErrorElem = rootElem.querySelector('span.watchlist.error');
        this.addKeywordElem = rootElem.querySelector('#addKeyword');
        this.keywordElem = rootElem.querySelector('#keyword');
        this.keywordErrorElem = rootElem.querySelector('span.keyword.error');
        this.keywordListErrorElem = rootElem.querySelector('span.keywordlist.error');
        this.submitElem = rootElem.querySelector('input[type="submit"]');
        this.submitErrorElem = rootElem.querySelector('span.submit.error');
        this.submitSuccessTemplate = rootElem.querySelector('#watchlistCreatedTemplate');
        this.editSuccessTemplate = rootElem.querySelector('#watchlistEditedTemplate');
        this.createdWatchlists = rootElem.querySelector('#createdWatchlists');
        this.clearElem = rootElem.querySelector('#clear');
        this.userFormElem = rootElem.querySelector('.user-form');

        this._attachEventListeners();
    }

    _attachEventListeners() {
        this.addKeywordElem.addEventListener('click', (evt)=> {
            evt.preventDefault();
            let keyword = this.keywordElem.value.trim();
            if(!this.isValidKeyword(keyword)) {
                return this.displayInvalidKeywordError(keyword);
            }

            this.addKeywordElem.disabled = true;
            this.keywordElem.disabled = true;

            this._addKeyWord(keyword);
            this._sortKeywords();

            this.addKeywordElem.disabled = false;
            this.keywordElem.disabled = false;
            this.keywordElem.value = '';
            this.keywordElem.focus();
        });

        this.keywordElem.addEventListener('keyup', (evt)=> {
            if(evt.keyCode === 13) {
                evt.preventDefault();
                this.addKeywordElem.click();
            }
        });

        this.formElem.addEventListener('submit', (evt)=> {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        });

        this.formElem.addEventListener('keypress', (evt)=> {
            if(evt.keyCode === 13) {
                evt.preventDefault();
                evt.stopPropagation();
            }
            return false;
        });

        this.submitElem.addEventListener('click', (evt)=> {
            evt.preventDefault();
            let watchlist = Array.prototype.map.call(this.watchlistElem.querySelectorAll('li'), (li)=> {
                    return li.innerText.trim();
                }),
                watchlistName = this.watchlistNameElem.value,
                userId = this._getUserId(),
                valid = true;

            if(!watchlistName) {
                this.displayInvalidWatchlistName(watchlistName);
                valid = false;
            }
            if(!watchlist.length) {
                this.displayInvalidWatchlist(watchlist);
                valid = false;
            }

            if(!userId) {
                this.displayRequestUserInfo();
                valid = false;
            }

            if(valid) {
                this._submitForm();
            }

            return false;
        });


        this.clearElem.addEventListener('click', (e)=> {
            e.preventDefault();
            this._clearForm();
            return false;
        });

        this.createUserElem.addEventListener('click', (e)=> {
            e.preventDefault();
            this._openCreateUserDialog();
            return false;
        });
    }

    _setUserId(id) {
        this.userElem.value = id || '';
        return this;
    }

    _getUserId() {
        return this.userElem.value;
    }

    _submitForm() {
        let data = {},
            form = this.formElem;

        for(var pair of (new FormData(form)).entries()) {
            data[pair[0]] = pair[1];
        }
        data.list = Array.prototype.slice.call(this.watchlistElem.querySelectorAll('button')).map(e=>e.value.trim());
        fetch(decodeURI(form.action).mustache(data), {
            method:  form.method,
            cache:   'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect:       'follow',
            referrerPolicy: 'no-referrer',
            body:           JSON.stringify(data)
        })
            .then(response=>{
                if(!response.ok) throw new Error('Request Failed', {cause: response});
                return response;
            })
            .then(response=>response.json())
            .then((responseData)=>{
                if(this._editing) {
                    this._displayEditedWatchlist(data.name, responseData.watchlistID);
                    this._editing.then(wl=> {
                        this.dispatchEvent(new CustomEvent('watchlist-change', {bubbles: true, detail: {name: data.name, id: responseData.watchlistID, oldWatchlistName: wl.name, oldWatchlistId: wl.id, type: 'edit'}}));
                    }).then(()=>{
                        this._editing = null;
                    });
                    this.setAttribute('data-edit', data.name);
                }else{
                    this._displayNewWatchlist(data.name, responseData.watchlistID);
                    this.dispatchEvent(new CustomEvent('watchlist-change', {bubbles: true, detail: {name: data.name, id: responseData.watchlistID, type: 'new'}}));
                }
            })
            .catch(e=>{
                logger.error(e);
                this._displayErrorMessage(this.submitErrorElem);
            });
    }

    isValidKeyword(keyword) {
        if(!keyword) return false;
        let reg = /\W/g;

        return !reg.test(keyword);
    }

    displayInvalidKeywordError(/*keyword*/) {
        this.keywordErrorElem.classList.remove('hidden');
        this.keywordElem.classList.add('invalid');
        setTimeout(()=> {
            this.keywordErrorElem.classList.add('hidden');
            this.keywordElem.classList.remove('invalid');
        }, WatchlistForm.MESSAGE_CLOSE_DEPLAY);
    }

    displayInvalidWatchlistName(/*watchlistName*/) {
        this.watchlistNameErrorElem.classList.remove('hidden');
        this.watchlistNameElem.classList.add('invalid');
        setTimeout(()=> {
            this.watchlistNameErrorElem.classList.add('hidden');
            this.watchlistNameElem.classList.remove('invalid');
        }, WatchlistForm.MESSAGE_CLOSE_DEPLAY);
    }

    displayInvalidWatchlist(/*watchlist*/) {
        this._displayErrorMessage(this.keywordListErrorElem);
    }

    displayRequestUserInfo() {
        this.userErrorElem.classList.remove('hidden');
        this.userElem.classList.add('invalid');
        this._openCreateUserDialog();
    }

    _openCreateUserDialog() {
        this.userDialog.dispatchEvent(new CustomEvent('dialog-open'));

        let self = this;
        this.userDialog.addEventListener('dialog-closed', function hideErrors() {
            self.userErrorElem.classList.add('hidden');
            self.userElem.classList.remove('invalid');
            self.userDialog.removeEventListener('dialog-closed', hideErrors);
        });
        this.userDialog.addEventListener('dialog-form-result', function onFormData(e) {
            self._setUserId(e.detail.id);
            window.location.removeSearch('id');
            window.location.pushSearch('id', e.detail.id);
            self.userDialog.removeEventListener('dialog-form-result', onFormData);
        });
    }

    _displayNewWatchlist(name, id) {
        let userId = window.encodeURIComponent(this._getUserId());
        id = window.encodeURIComponent(id);
        return this._displaySubmitSuccess(this.submitSuccessTemplate, {url: `viewwatchlists.html?id=${userId}#${id}`, watchlistName: name});
    }

    _displayEditedWatchlist(name, id) {
        let userId = window.encodeURIComponent(this._getUserId());
        id = id.escapeForCSS();
        return this._displaySubmitSuccess(this.editSuccessTemplate, {url: `viewwatchlists.html?id=${userId}#${id}`, watchlistName: name});
    }

    _displaySubmitSuccess(template, data) {
        let docFrag = template.content.cloneNode(true);
        Array.prototype.slice.call(docFrag.children).forEach(e=>{
            e.innerHTML = e.innerHTML.mustache(data);
        });
        this.createdWatchlists.appendChild(docFrag);
    }

    _displayErrorMessage(elem) {
        elem.classList.remove('hidden');
        setTimeout(()=>{
            elem.classList.add('hidden');
        }, WatchlistForm.MESSAGE_CLOSE_DEPLAY);
    }

    _editWatchlist(listId) {
        return this._requestWatchlist(listId).then(list=> {
            logger.info(list);
            this._clearForm();
            this.watchlistNameElem.value = list.name;
            list.items.sort().forEach(this._addKeyWord.bind(this));
            return list;
        }).catch(e=>{
            logger.error(e);
        });
    }

    _requestWatchlist(listId) {
        return requestUserWatchlists(this._getUserId()).then(watchlists=>{
            let name = '';

            if(watchlists[listId]) {
                name = listId;
                listId = watchlists[name];
            }else{
                for(let n in watchlists) {
                    if(listId === watchlists[n]) {
                        name = n;
                        break;
                    }
                }
            }

            if(!name) throw new Error('Could not find watch list', listId);

            return {
                name:  name,
                id:    listId,
                items: []
            };
        }).then(wl=> {
            return requestWatchlist(wl.id).then(items=>{
                wl.items = items;
                return wl;
            });
        });
    }

    _clearForm() {
        this.watchlistNameElem.value = '';
        this.keywordElem.value = '';
        Array.prototype.forEach.call(this.watchlistElem.querySelectorAll('button'), e=>{
            e.click();
        });
        this.watchlistNameElem.focus();
    }

    _addKeyWord(keyword) {
        let templateFrag = this.shadowRoot.querySelector('#keyword-template').content.cloneNode(true),
            li = templateFrag.firstElementChild,
            deleteButton, keywordButton;

        li.innerHTML = li.innerHTML.mustache({
            '.Keyword': keyword
        });
        deleteButton = li.querySelector('button.delete'),
        keywordButton = li.querySelector('button.keyword');

        deleteButton.addEventListener('click', ()=>{
            li.remove();
            this.dispatchEvent(new CustomEvent('keyword-removed', {bubbles: true, detail: {keyword: keyword}}));
        });
        keywordButton.addEventListener('click', ()=>{
            window.location.hash = '#' + keywordButton.value;
        });

        this.watchlistElem.appendChild(li);
        this.dispatchEvent(new CustomEvent('keyword-added', {bubbles: true, detail: {keyword: keyword}}));
    }

    _sortKeywords() {
        Array.prototype.slice.call(this.watchlistElem.querySelectorAll('.list-item'), 0).sort((li1, li2) => {
            let v1 = li1.querySelector('button').value,
                v2 = li2.querySelector('button').value;
            if(v1 > v2) return 1;
            if(v1 < v2) return -1;
            if(v1 === v2) return 0;
        }).forEach(li=>{
            this.watchlistElem.appendChild(li);
        });
    }

    static __registerElement() {
        customElements.define(WatchlistForm.TAG_NAME, WatchlistForm);
    }
}

WatchlistForm.__registerElement();
export default WatchlistForm;
