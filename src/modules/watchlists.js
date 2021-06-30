import {default as createLogger} from '../../modules/logFactory.js';

import '../components/ViewWatchlists/main.js';
import '../../modules/extras-location.js';

(()=>{
    const logger = createLogger('watchlists.js');
    const userId = window.location.searchObj.id;

    if(userId) {
        Array.prototype.slice.call(document.querySelectorAll('a.home')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
        document.body.querySelector('view-watchlists').setAttribute('data-watchlist-url', `/api/user/${userId}/data.json`);
    }
})();
