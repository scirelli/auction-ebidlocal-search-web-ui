import {default as IncluderHTMLElement} from '../IncluderHTMLElement/main.js';
import {default as createLogger} from '../../modules/logFactory.js';

const logger = createLogger('TestIncludeTag');

class TestIncludeTag extends IncluderHTMLElement{
    static TAG_NAME = 'test-include-tag';

    constructor() {
        super();

        this._promiseOfContent.then(()=> {
            logger.debug('Loaded!');
        });
    }

    getHtmlFragUrls() {
        return [
            '/components/TestIncludeTag/template.html'
        ];
    }

    getStyleUrls() {
        return [
            '/components/TestIncludeTag/main.css'
        ];
    }

    static __registerElement() {
        customElements.define(TestIncludeTag.TAG_NAME, TestIncludeTag);
    }
}

TestIncludeTag.__registerElement();
export default TestIncludeTag;
