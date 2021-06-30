import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../UserInfoForm/main.js';
import '../../modules/extras-location.js';
import '../../modules/String.js';

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

    constructor() {
        super();
        logger.debug('Creating watch list element');

        this.attachShadow({mode: 'open'});
        this._loaded = false;
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
        this.createdWatchlists = rootElem.querySelector('#createdWatchlists');
        this.clearElem = rootElem.querySelector('#clear');

        this._setUserId(window.location.searchObj.id);

        this._attachEventListeners();
    }

    _attachEventListeners() {
        this.addKeywordElem.addEventListener('click', (evt)=> {
            evt.preventDefault();
            let keyword = this.keywordElem.value;
            if(!this.isValidKeyword(keyword)) {
                return this.displayInvalidKeywordError(keyword);
            }

            this.addKeywordElem.disabled = true;
            this.keywordElem.disabled = true;

            let li = document.createElement('li');
            li.innerText = keyword;
            this.watchlistElem.appendChild(li);

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
                userId = this.userElem.value,
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
            this.watchlistNameElem.value = '';
            this.keywordElem.value = '';
            this.watchlistElem.innerHTML = '';
            this.watchlistNameElem.focus();
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

    _submitForm() {
        let data = {},
            form = this.formElem;

        for(var pair of (new FormData(form)).entries()) {
            data[pair[0]] = pair[1];
        }
        data.list = Array.prototype.slice.call(this.watchlistElem.children).map(e=>e.textContent.trim());
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
            .then(response=>response.json())
            .then((responseData)=>{
                this.displayNewWatchlist(data.name, responseData.watchlistID);
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
        }, this.MESSAGE_CLOSE_DEPLAY);
    }

    displayInvalidWatchlistName(/*watchlistName*/) {
        this.watchlistNameErrorElem.classList.remove('hidden');
        this.watchlistNameElem.classList.add('invalid');
        setTimeout(()=> {
            this.watchlistNameErrorElem.classList.add('hidden');
            this.watchlistNameElem.classList.remove('invalid');
        }, this.MESSAGE_CLOSE_DEPLAY);
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

    displayNewWatchlist(name, id) {
        let docFrag = this.submitSuccessTemplate.content.cloneNode(true);
        Array.prototype.slice.call(docFrag.children).forEach(e=>{
            e.innerHTML = e.innerHTML.mustache({url: `/api/watchlist/${id}`, watchlistName: name});
        });
        this.createdWatchlists.appendChild(docFrag);
    }

    _displayErrorMessage(elem) {
        elem.classList.remove('hidden');
        setTimeout(()=>{
            elem.classList.add('hidden');
        }, WatchlistForm.MESSAGE_CLOSE_DEPLAY);
    }

    static __registerElement() {
        customElements.define(WatchlistForm.TAG_NAME, WatchlistForm);
    }
}

WatchlistForm.__registerElement();
export default WatchlistForm;
