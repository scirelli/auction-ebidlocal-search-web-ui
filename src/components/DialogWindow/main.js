import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';

const logger = createLogger('UserInfoForm');

class UserInfoForm extends HTMLElement{
    static TAG_NAME = 'user-info-form';

    static get observedAttributes() { return ['data-content-url', 'data-content-style-url', 'data-title']; }

    constructor() {
        super();

        this.attachShadow({mode: 'open'});
        Promise.allSettled([
            fetchHtmlElements(['/components/DialogWindow/dialogWindow.partial.html']).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements(['/components/DialogWindow/main.css']).then(elems => this.shadowRoot.append(...elems))
        ]).then(()=>{
            this._registerEventListeners();
        }).catch(e=>{
            this.dispatchEvent(new CustomEvent('dialog-error', {bubbles: true, detail: {error: e, elem: this.shadowRoot}}));
        }).finally(()=>{
            this.dispatchEvent(new CustomEvent('dialog-window-loaded', {bubbles: true, detail: {elem: this.shadowRoot}}));
            logger.debug('UserInfoForm created');
        });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(oldValue === newValue) return;
        switch(name) {
            case 'data-content-url':
                this._onContentUrlChange(newValue)
                    .then(()=>{
                        this.dispatchEvent(new CustomEvent('dialog-content-loaded', {bubbles: true, detail: {elem: this.shadowRoot.querySelector('.dialog-window .content')}}));
                    })
                    .catch(e=>{
                        this.dispatchEvent(new CustomEvent('dialog-error', {bubbles: true, detail: {error: e, elem: this.shadowRoot}}));
                    });
                break;
            case 'data-content-style-url':
                this._onContentStyleChange(newValue)
                    .then(()=> {
                        this.dispatchEvent(new CustomEvent('dialog-content-style-loaded', {bubbles: true, detail: {elem: this.shadowRoot}}));
                    })
                    .catch(e=>{
                        this.dispatchEvent(new CustomEvent('dialog-error', {bubbles: true, detail: {error: e, elem: this.shadowRoot}}));
                    });
                break;
            case 'data-title':
                this.shadowRoot.querySelector('.title').innerText = newValue;
                break;
        }
    }

    _onContentUrlChange(url) {
        return fetchHtmlElements([url]).then(elems => this.shadowRoot.querySelector('.dialog-window .content').append(...elems));
    }

    _onContentStyleChange(url) {
        return fetchStyleElements([url]).then(elems => this.shadowRoot.append(...elems));
    }

    _registerEventListeners() {
        const dialogWindow = this.shadowRoot.querySelector('.dialog-window'),
            closeButton = dialogWindow.querySelector('button.close');

        this._addMoveWithMouseListeners(dialogWindow);
        closeButton.addEventListener('click', ()=>{
            this.classList.add('hidden');
            dialogWindow.querySelectorAll('input').forEach(elem=>{
                elem.value = '';
            });
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
