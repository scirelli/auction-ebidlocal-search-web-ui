import {default as createLogger} from '../../modules/logFactory.js';

import '../components/TabView/main.js';
import '../../modules/extras-location.js';
import '../../modules/extras-css.js';
import {requestUserWatchlists} from '../../modules/apiUtils.js';

(()=>{
    const logger = createLogger('watchlists.js'),
        userId = window.location.searchObj.id,
        watchlistElem = document.body.querySelector('tab-view');

    if(userId) {
        logger.debug(`Adding user id ${userId}`);
        Array.prototype.slice.call(document.querySelectorAll('li a')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
        requestUserWatchlists(userId).then(addWatchListToTabView).then((elems)=>{
            let button = elems[0].button,
                tabId = window.location.hash;

            if(tabId) {
                button = document.querySelector(`tab-view ${tabId}`);
            }

            if(button) {
                setTimeout(()=>{
                    button.click();
                }, 10);
            }
        });
    }

    function addWatchListToTabView(watchlists) {
        let elems = [];

        for(let listName in watchlists) {
            let watchlistId = watchlists[listName],
                tabId = _generateWatchlistRowId(watchlistId, listName),
                panelId = 'panel-' + tabId,
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

        return elems;
    }

    function _generateWatchlistRowId(listId, listName) {
        return `${listName}_${listId}`.escapeForCSS();
    }
})();
