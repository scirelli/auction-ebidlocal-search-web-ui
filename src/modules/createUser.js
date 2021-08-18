import Cookies from 'https://cdn.jsdelivr.net/npm/js-cookie@3.0.0/dist/js.cookie.min.mjs';
import '../components/UserInfoForm/main.js';
import './extras-location.js';
import {getUserId} from './extras-cookies.js';

(()=> {
    const userId = getUserId(),
        userDialog = document.body.querySelector('user-info-form'),
        confirmForm = document.body.querySelector('#confirm-form'),
        userIdElem = document.body.querySelector('#user-id'),
        createBtnElem = document.body.querySelector('#create-btn'),
        infoMsgElem = document.body.querySelector('.info-note-msg'),
        submitBtnElem = confirmForm.querySelector('input[type=submit]');

    if(userId) {
        Array.prototype.slice.call(document.querySelectorAll('a.home')).forEach(elem=> {
            elem.href = elem.href + '?id=' + encodeURIComponent(userId);
        });
        insertUserIdIntoForm(userId);
        setUserIdCookie(userId);
        allowRedirect();
    }else{
        createBtnElem.disabled = false;
        createBtnElem.addEventListener('click', e => {
            e.preventDefault();
            openCreateUserDialog();
            return false;
        });
    }

    confirmForm.addEventListener('submit', e => {
        e.preventDefault();
        window.location.href = confirmForm.action + `?id=${encodeURIComponent(userIdElem.value)}`;
        return false;
    });

    userIdElem.addEventListener('keyup', () => {
        submitBtnElem.disabled = !userIdElem.value;
    });

    function openCreateUserDialog() {
        userDialog.dispatchEvent(new CustomEvent('dialog-open'));

        document.body.addEventListener('dialog-closed', function hideErrors() {
            document.body.removeEventListener('dialog-closed', hideErrors);
        });
        document.body.addEventListener('dialog-form-result', function onFormData(e) {
            setUserId(e.detail.id);
            allowRedirect();
            document.body.removeEventListener('dialog-form-result', onFormData);
        });
        return userDialog;
    }

    function allowRedirect() {
        createBtnElem.disabled = true;
        submitBtnElem.disabled = false;
        infoMsgElem.classList.remove('hidden');
    }
    function insertUserIdIntoForm(id) {
        userIdElem.value = id;
        userIdElem.disabled = true;
        return userIdElem;
    }
    function setUserIdUrl(id) {
        window.location.removeSearch('id');
        window.location.pushSearch('id', id);
    }
    function setUserIdCookie(id) {
        return Cookies.set('id', id);
    }

    function setUserId(id) {
        setUserIdUrl(id);
        insertUserIdIntoForm(id);
        setUserIdCookie(id);
    }
})();
