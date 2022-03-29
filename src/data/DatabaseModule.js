import {MongoClient} from "mongodb";

export const DatabaseModule = config => (() => {

    const client = new MongoClient(config.URI);

    const createCollection = name => client.db(config.NAME).collection(name);

    const connect = async () => {
        await client.connect().then(_ => {
            console.log('Connected to database');
        }).catch(async e => {
            console.error(e);
        })
    };

    const close = async () => {
        await client.close();
        console.log('Disconnected from database');
    };

    return {
        createCollection: createCollection,
        connect: connect,
        close: close
    }
})(DatabaseModule || {})
