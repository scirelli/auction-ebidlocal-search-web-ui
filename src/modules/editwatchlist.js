import {default as createLogger} from '../../modules/logFactory.js';
import '../components/AddWatchlistForm/main.js';
import '../components/ListWatchlists/main.js';
import './extras-location.js';

(()=> {
    const logger = createLogger('WatchlistForm');
    const userId = window.location.searchObj.id,
        watchlistName = window.location.searchObj.watchlistName,
        addWatchlistElem = document.body.querySelector('add-watchlist-form'),
        listWatchlistsElem = document.body.querySelector('list-watchlists');

    if(userId) {
        Array.prototype.slice.call(document.querySelectorAll('a.home')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
    }

    if(addWatchlistElem) {
        if(userId) {
            addWatchlistElem.setAttribute('data-user-id', userId);
        }
        if(watchlistName) {
            addWatchlistElem.setAttribute('data-edit', watchlistName);
        }
    }

    if(listWatchlistsElem) {
        if(userId) {
            listWatchlistsElem.setAttribute('data-user-id', userId);
        }
        listWatchlistsElem.addEventListener('listwatchlist-list-click', (e) => {
            logger.log(e);
        });

        listWatchlistsElem.addEventListener('edit-watchlist-click', function(e) {
            addWatchlistElem.setAttribute('data-edit', e.detail.name);
        }, false);

        listWatchlistsElem.addEventListener('delete-watchlist-click', function(e) {
            fetch(`/api/user/${this._getUserId()}/watchlist`, {
                method:  'DELETE',
                cache:   'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect:       'follow',
                referrerPolicy: 'no-referrer',
                body:           JSON.stringify({name: e.detail.name})
            }).then(response => {
                logger.log(response.status);
                if(response.status === 204) {
                    this.dispatchEvent(new CustomEvent('watchlist-deleted', {bubbles: true, detail: {name: e.detail.name, id: e.detail.id}}));
                    this.dispatchEvent(new CustomEvent('watchlist-change', {bubbles: true, detail: {name: e.detail.name, id: e.detail.id, type: 'delete'}}));
                }
            }).catch(logger.error);
        }, false);
    }

    document.body.addEventListener('watchlist-change', e => {
        window.location.removeSearch('watchlistName');
        window.location.pushSearch('watchlistName', e.detail.name);
    });
})();
