import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';

const logger = createLogger('UserInfoForm');

class UserInfoForm extends HTMLElement{
    static TAG_NAME = 'user-info-form';

    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        this._promiseOfContent = Promise.allSettled([
            fetchHtmlElements(['/components/UserInfoForm/form.partial.html']).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements(['/components/UserInfoForm/main.css']).then(elems => this.shadowRoot.append(...elems))
        ])
            .then(()=>{
                this._registerEventListeners();
            })
            .finally(()=>{
                this.dispatchEvent(new CustomEvent('dynamic-content-loaded', {bubbles: true}));
                logger.debug('UserInfoForm created');
            });
    }

    _registerEventListeners() {
        const dialogWindow = this.shadowRoot.querySelector('.dialog-window'),
            closeButton = dialogWindow.querySelector('button.close'),
            form = dialogWindow.querySelector('form.create-user-form');

        this._addMoveWithMouseListeners(dialogWindow);
        closeButton.addEventListener('click', ()=>{
            this.classList.add('hidden');
            dialogWindow.querySelectorAll('input').forEach(elem=>{
                if(elem.value !== 'Submit') elem.value = '';
            });
            this.dispatchEvent(new CustomEvent('dialog-closed', {bubbles: true, detail: {}}));
        });

        form.addEventListener('submit', event => {
            event.preventDefault();
            let data = {};
            for(var pair of (new FormData(form)).entries()) {
                data[pair[0]] = pair[1];
            }
            fetch(form.action, {
                method:  form.method,
                cache:   'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect:       'follow',
                referrerPolicy: 'no-referrer',
                body:           JSON.stringify(data)
            })
                .then(response=>response.json())
                .then((responseData)=>{
                    this.dispatchEvent(new CustomEvent('dialog-form-result', {bubbles: true, detail: responseData}));
                })
                .then(()=>{
                    closeButton.click();
                })
                .catch(e=>{
                    //TODO: Show error.
                    logger.error(e);
                });

            return false;
        });

        this.addEventListener('dialog-open', ()=>{
            this.classList.remove('hidden');
            this.shadowRoot.querySelector('.user-name').focus();
        });
    }

    _addMoveWithMouseListeners(elmnt) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        elmnt.querySelector('.title-bar').addEventListener('mousedown', (e)=> {
            e = e || window.event;
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;

            document.addEventListener('mouseup', removeListeners);
            document.addEventListener('mousemove', onMove);

            function removeListeners() {
                document.removeEventListener('mouseup', removeListeners);
                document.removeEventListener('mousemove', onMove);
            }
            function onMove(e) {
                e = e || window.event;
                e.preventDefault();
                // calculate the new cursor position:
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;
                // set the element's new position:
                elmnt.style.top = (elmnt.offsetTop - pos2) + 'px';
                elmnt.style.left = (elmnt.offsetLeft - pos1) + 'px';
            }
        });
    }

    static __registerElement() {
        customElements.define(UserInfoForm.TAG_NAME, UserInfoForm);
    }
}

UserInfoForm.__registerElement();
export default UserInfoForm;
