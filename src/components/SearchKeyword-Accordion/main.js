import {default as createLogger} from '../../modules/logFactory.js';
import {fetchHtmlElements, fetchStyleElements} from '../../modules/extras-html.js';
import '../../modules/extras-location.js';
import '../../modules/extras-css.js';
import '../../modules/String.js';
import '../../modules/Function.js';
import {requestKeyword} from '../../modules/apiUtils.js';

const logger = createLogger('SearchKeyword-Accordion');
const TAG_NAME = 'search-keyword-accordion';

customElements.define(TAG_NAME, class SearchKeyword extends HTMLElement{
    static TAG_NAME = TAG_NAME;

    static get observedAttributes() { return ['keywords', 'data-keywords', 'keyword', 'data-keyword']; }

    constructor() {
        super();
        logger.debug('Creating search keyword element');

        this.attachShadow({mode: 'open'});
        this._loaded = false;
        this.resultsContainerElem = null;
        this._keywords = {};

        this._promiseOfContent = Promise.allSettled([
            fetchHtmlElements(['/components/SearchKeyword-Accordion/form.partial.html']).then(elems => this.shadowRoot.append(...elems)),
            fetchStyleElements([]).then(elems => this.shadowRoot.append(...elems))
        ])
            .then(()=>{
                this._loaded = true;
                this.resultsContainerElem = this.shadowRoot;
            })
            .then(()=> {
                this.init(this.shadowRoot);
            })
            .finally(()=>{
                this.dispatchEvent(new CustomEvent('dynamic-content-loaded', {bubbles: true}));
                logger.debug('Search Keyword created');
            });
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if(!this._loaded) {
            this._promiseOfContent.then(()=> {
                this.attributeChangedCallback(name, oldValue, newValue);
            });
            return;
        }
        if(oldValue === newValue) return;
        switch(name) {
            case 'data-keywords':
            case 'keywords':
            case 'data-keyword':
            case 'keyword':
                this._keywordAttributeChanged(newValue.split(',').filter(Boolean).map(s=>s.trim()).map(s=>s.toLowerCase()));
                break;
        }
    }

    async init() {
        return this._initDom().then(this._attachEventListeners.bind(this));
    }

    async _initDom() {
        return Promise.resolve();
    }

    _attachEventListeners() {
    }

    async _keywordAttributeChanged(newValue) {
        let newKeywordsDict = newValue.reduce((a, s)=>{
            a[s] = true;
            return a;
        }, {});

        return Promise.allSettled([
            this._addKeywords(newValue.filter(s=>{
                return !this._keywords[s];
            })),
            this._removeKeywords(Object.keys(this._keywords).filter(s=>{
                return !newKeywordsDict[s];
            }))
        ]);
    }

    async _addKeywords(keywords) {
        return Promise.allSettled(
            keywords.map(kw=>{
                this._keywords[kw] = true;
                return kw;
            }).map(kw=>requestKeyword(kw)
                .then(this._compressModelImages.bind(this))
                .then(models=>{
                    if(!Array.isArray(models)) return;
                    return this._addKeyword(kw, models);
                })
            ));
    }

    async _removeKeywords(keywords) {
        return new Promise((resolve)=>{
            keywords.forEach(kw=>{
                let e = this.shadowRoot.querySelector(`section[data-keyword="${kw}"]`);
                if(e) e.remove();
                delete this._keywords[kw];
            });
            resolve();
        });
    }

    showLoader(keyword) {
        let loaderElems = Array.prototype.slice.call(this.shadowRoot.querySelectorAll(`section[data-keyword="${keyword}"] .loader`) || [], 0);
        loaderElems.forEach(e=>e.classList.remove('hidden'));
    }
    hideLoader(keyword) {
        let loaderElems = Array.prototype.slice.call(this.shadowRoot.querySelectorAll(`section[data-keyword="${keyword}"] .loader`) || [], 0);
        loaderElems.forEach(e=>e.classList.add('hidden'));
    }
    toggleLoader(elem) {
        let loaderElems = Array.prototype.slice.call(elem.querySelectorAll('.loader') || [], 0);
        loaderElems.forEach(e=>e.classList.toggle('hidden'));
    }

    _compressModelImages(models) {
        const fileExtReg = /(\.[^.]+$)/;

        return models.map(generateThumbnailLinks);

        function generateThumbnailLinks(model) {
            model.thumbnailUrls = model.imageUrls.filter(imageUrlObj=>{
                return fileExtReg.test(imageUrlObj.Path);
            }).map(imageUrlObj=>{
                let path = imageUrlObj.Path.replace(fileExtReg, '-350x350' + fileExtReg.exec(imageUrlObj.Path)[1]);
                return new URL(`${imageUrlObj.Scheme}://${imageUrlObj.Host}/${path}?${imageUrlObj.RawQuery}`).toString();
            });

            return model;
        }
    }

    async _addKeyword(keyword, keywordModels) {
        let container = this._createKeywordContainerElem(),
            content = container.firstElementChild,
            panel = null;

        content.setAttribute('data-keyword', keyword);
        content.innerHTML = content.innerHTML.mustache({
            '.Keyword': keyword
        });
        panel = content.querySelector('.panel');

        this.resultsContainerElem.appendChild(container);
        content.querySelector('button.accordion').addEventListener('click', function() {
            this.classList.toggle('active');
            var panel = this.nextElementSibling;
            if(panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + 'px';
            }
        });
        this.toggleLoader(content);

        return ((model)=>{
            let elem = this._createItemElem(model);
            panel.appendChild(elem);
            return elem.imagesPromise;
        }).chain(keywordModels[Symbol.iterator]())
            .finally(()=>{
                this.toggleLoader(content);
            });
    }

    _createKeywordContainerElem() {
        return this.shadowRoot.querySelector('#accordion-template').content.cloneNode(true);
    }

    _createItemElem(model) {
        let itemElem = this.shadowRoot.querySelector('#panel-item').content.cloneNode(true),
            itemUrl = model.itemUrl || [];

        itemElem.firstElementChild.innerHTML = itemElem.firstElementChild.innerHTML.mustache({
            '.ItemURL':          new URL(`${itemUrl.Scheme}://${itemUrl.Host}/${itemUrl.Path}?${itemUrl.RawQuery}`).toString(),
            '.ItemName':         model.itemName,
            '.Id':               model.id,
            '.Description':      model.description || model.extendedDescription || 'No description',
            '.CurrentBidAmount': '$' + (model.currentBidAmount || 0),
            '.Category':         model.category || ''
        });
        let img = itemElem.firstElementChild.querySelector('div.item-image img');
        itemElem.imagesPromise = findUnbrokenImage(img, model.thumbnailUrls, new URL(`${model.imageUrls[0].Scheme}://${model.imageUrls[0].Host}/${model.imageUrls[0].Path}?${model.imageUrls[0].RawQuery}`).toString());

        return itemElem;
    }

    static __registerElement() {
        customElements.define(TAG_NAME, SearchKeyword);
    }
});

async function findUnbrokenImage(imgElem, iter, defaultUrl) {
    return new Promise((resolve, reject)=>{
        if(Array.isArray(iter)) iter = iter[Symbol.iterator]();
        if(!iter.next) return reject(new Error('Not iterable!'));

        let {value, done} = iter.next();

        if(done) {
            imgElem.src = defaultUrl;
            return resolve(defaultUrl);
        }

        imgElem.src = value;
        imgElem.addEventListener('load', ()=>{
            resolve(value);
        });
        imgElem.addEventListener('error', ()=>{
            resolve(findUnbrokenImage(imgElem, iter, defaultUrl));
        });
    });
}

export default customElements.get(TAG_NAME);
