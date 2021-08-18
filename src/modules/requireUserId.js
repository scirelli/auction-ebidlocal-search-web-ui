import {default as createLogger} from './logFactory.js';
import {getUserId} from './extras-cookies.js';

const userId = getUserId(),
    logger = createLogger('requireUserId.js');

if(!userId) {
    logger.debug(`No user id found redirecting to create user. ${userId}`);
    window.location.href = '/createUser.html';
}

export default {userId};
