import '../components/AddWatchlistForm/main.js';
import './extras-location.js';
import {getUserId} from './extras-cookies.js';
import './requireUserId.js';

(()=> {
    const userId = getUserId(),
        watchlistId = window.location.searchObj.watchlistId;

    if(userId) {
        Array.prototype.slice.call(document.querySelectorAll('a.home')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
        document.body.querySelector('add-watchlist-form').setAttribute('data-user-id', userId);
    }

    if(watchlistId) {
        document.body.querySelector('add-watchlist-form').setAttribute('data-edit', decodeURIComponent(watchlistId));
    }
})();
