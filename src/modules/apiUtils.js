/*
 * Expected Response:
 *   {
 *      "watchlists": {
 *        "wine list":"9XcsXa1ZWvItsdXtK2gmFpgkbcY=",
 *        "wine list4":"9XcsXa1ZWvItsdXtK2gmFpgkbcY="
 *       }
 *    }
*/
function requestUserWatchlists(userId) {
    return fetch(`/api/user/${userId}/data.json`, {
        method:   'GET',
        redirect: 'follow'
    }).then(response=>response.json())
        .then(data=>data.watchlists);
}

function requestWatchlist(listId) {
    return fetch(`api/watchlist/${listId}/data.json`, {
        method:   'GET',
        redirect: 'follow'
    }).then(response=>response.json());
}

export { requestUserWatchlists, requestWatchlist };
