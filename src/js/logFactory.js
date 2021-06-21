/* global debug*/
export default function createLogger(name) {
    return ['assert', 'debug', 'error', 'exception', 'info', 'log', 'trace', 'warn'].reduce((a, m)=>{
        a[m] = debug(`${m.toUpperCase()}:${name}`);
        return a;
    }, {});
}
