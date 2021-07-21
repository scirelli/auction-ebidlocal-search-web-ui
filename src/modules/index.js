import {default as createLogger} from './logFactory.js';
import './extras-location.js';

(()=> {
    const userId = window.location.searchObj.id,
        logger = createLogger('index.js');

    if(userId) {
        logger.debug(`Adding user id ${userId}`);
        Array.prototype.slice.call(document.querySelectorAll('li a')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
    }
})();
