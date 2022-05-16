export const ConfigModule = (debug = true, secure = false) => (() => {

    const testTag = '-test'
    const createValue = value => ((tag, debug) => debug ? value + tag : value)(testTag, debug)

    return {
        WebSocket: {
            HOST: '192.168.1.67',
            PORT: '8080',
            SECURE: secure
        },
        MongoDB: {
            URI: createValue('mongodb://localhost:27017/web-rtc-example'),
            NAME: createValue('web-rtc-example'),
            COLLECTION_SESSION: createValue('session')
        }
    };

})(ConfigModule || {})