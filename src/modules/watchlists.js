import {default as createLogger} from '../../modules/logFactory.js';

import '../components/ViewWatchlists-Depricated/main.js';
import '../components/TabView/main.js';
import '../../modules/extras-location.js';

(()=>{
    const logger = createLogger('watchlists.js'),
        userId = window.location.searchObj.id,
        watchlistElem = document.body.querySelector('tab-view');

    if(userId) {
        logger.debug(`Adding user id ${userId}`);
        requestWatchlist(`/api/user/${userId}/data.json`).then(addWatchListToTabView);
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
    function requestWatchlist(url) {
        return fetch(url, {
            method:   'GET',
            redirect: 'follow'
        }).then(response=>response.json())
            .then(data=>data.watchlists);
    }

    function addWatchListToTabView(watchlists) {
        let elems = [];

        for(let listName in watchlists) {
            let watchlistId = watchlists[listName],
                tabId = watchlistId.replace('=', ''),
                panelId = tabId + '-panel',
                div = document.createElement('div');

            div.innerHTML = `<button slot="tab-bar" is="tab-bar-button" id="${tabId}" role="tab" aria-selected="false" aria-controls="${panelId}">${listName}</button>
                 <section slot="tab-panel" is="tab-panel" id="${panelId}" role="tabpanel" aria-labelledby="${tabId}" tabindex="0" aria-hidden="false" class="hidden">
                    <iframe width="100%" height="100%" src="/api/user/${userId}/watchlist/${watchlistId}/index.html"></iframe>
                </section>`;
            elems.push({
                button:   div.querySelector('button'),
                tabPanel: div.querySelector('section')
            });
        }

        elems.forEach(o => {
            watchlistElem.appendChild(o.button);
            watchlistElem.appendChild(o.tabPanel);
        });

        if(elems.length) elems[0].button.click();

        return elems;
    }
})();
