import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';

const logger = createLogger('UserInfoForm');

class UserInfoForm extends HTMLElement{
    static TAG_NAME = 'user-info-form';

    static get observedAttributes() { return ['data-refresh-rate']; }

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

    attributeChangedCallback(name, oldValue, newValue) {
        switch(name) {
            case 'data-refresh-rate':
                this.refreshRate =  (parseInt(newValue) || 0) * 1000;
                this._startRefresh();
                break;
        }
    }

    _registerEventListeners() {
        const dialogWindow = this.shadowRoot.querySelector('.dialog-window'),
            closeButton = dialogWindow.querySelector('button.close'),
            form = dialogWindow.querySelector('form.create-user-form');

        this._addMoveWithMouseListeners(dialogWindow);
        closeButton.addEventListener('click', ()=>{
            this.classList.add('hidden');
            dialogWindow.querySelectorAll('input').forEach(elem=>{
                elem.value = '';
            });
        });

        form.addEventListener('submit', function(event) {
            event.preventDefault();
            let data = {};
            for(var pair of (new FormData(form)).entries()) {
                data[pair[0]] = pair[1];
            }
            fetch('/api/user', {
                method:  'POST',
                cache:   'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect:       'follow',
                referrerPolicy: 'no-referrer',
                body:           JSON.stringify(data)
            }).catch(e=>{
                logger.error(e);
            });

            return false;
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
