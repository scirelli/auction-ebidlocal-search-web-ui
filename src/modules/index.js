import {default as createLogger} from './logFactory.js';
import './extras-location.js';

(()=> {
    const userId = window.location.searchObj.id;

    if(userId)
        Array.prototype.slice.call(document.querySelectorAll('li a')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
})();
