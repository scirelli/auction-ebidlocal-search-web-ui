import {default as createLogger} from './logFactory.js';
import '../components/UserInfoForm/main.js';

const logger = createLogger('watchlist');

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
export default class Watchlist{
    ONE_SECOND_DELAY = 3000;

    constructor(rootElem) {
        logger.debug('Creating watch list element');
        this.userELem = rootElem.querySelector('#user');
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

        this.init();
    }

    init() {
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
                userId = this.userELem.value;

            if(!watchlistName) {
                this.displayInvalidWatchlistName(watchlistName);
                return false;
            }
            if(!watchlist.length) {
                this.displayInvalidWatchlist(watchlist);
                return false;
            }

            if(!userId) {
                this.displayRequestUserInfo().then((user)=>{
                    fetch('/api/user', {
                        method:  'POST',
                        cache:   'no-cache',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        redirect:       'follow',
                        referrerPolicy: 'no-referrer',
                        body:           JSON.stringify(user)
                    })
                        .then(response => response.json())
                        .then(data => console.log(data)).catch(e=> {
                            logger.error(e);
                        });
                });
            }

            return false;
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
        }, this.ONE_SECOND_DELAY);
    }

    displayInvalidWatchlistName(/*watchlistName*/) {
        this.watchlistNameErrorElem.classList.remove('hidden');
        this.watchlistNameElem.classList.add('invalid');
        setTimeout(()=> {
            this.watchlistNameErrorElem.classList.add('hidden');
            this.watchlistNameElem.classList.remove('invalid');
        }, this.ONE_SECOND_DELAY);
    }

    displayInvalidWatchlist(/*watchlist*/) {
        this.keywordListErrorElem.classList.remove('hidden');
        setTimeout(()=> {
            this.keywordListErrorElem.classList.add('hidden');
        }, this.ONE_SECOND_DELAY);
    }

    displayRequestUserInfo() {
        return new Promise((resolve/*, reject*/)=>{
            resolve(new User());
        });
    }
}

function User(name, email) {
    this.name = name;
    this.email = email;
}
