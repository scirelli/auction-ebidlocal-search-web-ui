import '../components/AddWatchlistForm/main.js';
import './extras-location.js';

(()=> {
    const userId = window.location.searchObj.id;

    if(userId)
        Array.prototype.slice.call(document.querySelectorAll('a.home')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
})();
