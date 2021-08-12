import {default as createLogger} from '../../modules/logFactory.js';
import '../components/AddWatchlistForm/main.js';
import '../components/ListWatchlists/main.js';
import './extras-location.js';

(()=> {
    const logger = createLogger('WatchlistForm');
    const userId = window.location.searchObj.id,
        watchlistId = window.location.searchObj.watchlistId,
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
        if(watchlistId) {
            addWatchlistElem.setAttribute('data-edit', decodeURIComponent(watchlistId));
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
            addWatchlistElem.setAttribute('data-edit', e.detail.watchlistId);
        }, false);
    }
})();
