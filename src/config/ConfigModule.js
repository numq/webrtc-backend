export const ConfigModule = (debug = false) => (() => {

    const test = {
        WebSocket: {
            HOST: 'localhost',
            PORT: '8080',
            SECURE: false
        },
        MongoDB: {
            URI: 'mongodb://localhost:27017/web-rtc-example' + '-test',
            NAME: 'web-rtc-example' + '-test',
            COLLECTION_SESSION: 'session' + '-test'
        }
    };

    const production = {
        WebSocket: {
            HOST: '192.168.1.64',
            PORT: '8080',
            SECURE: true
        },
        MongoDB: {
            URI: 'mongodb://localhost:27017/web-rtc-example',
            NAME: 'web-rtc-example',
            COLLECTION_SESSION: 'session'
        }
    };

    return debug ? test : production;

})(ConfigModule || {})