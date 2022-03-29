import {ObjectID} from "bson";
import {Session} from "../../domain/entity.js";
import {SessionRepository} from "../../domain/repository.js";

export const SessionRepositoryModule = collection => (() => {

    const createSession = collection => () => {
        return collection.insertOne(Session(new ObjectID().toHexString(), [])).then(res => {
            if (res) {
                console.log('Successfully created session with id: %s', res.insertedId);
                return res.insertedId;
            } else {
                console.log('Unable to create session.');
            }
            return null;
        }).catch(e => console.error(e))
    };

    const getSession = collection => sessionId => {
        return collection.findOne({_id: sessionId}).then(session => {
            if (session) {
                console.log('Successfully get session: %s', session);
                return session;
            } else {
                console.log('Unable to get session.');
            }
            return null;
        }).catch(e => console.error(e))
    };

    const randomSession = collection => () => {
        return collection.aggregate([
            {$match: {members: {$size: 1}}},
            {$sample: {size: 1}}
        ]).toArray().then(session => {
            if (session.length > 0) {
                console.log("Random session: ", session[0]);
                return session[0];
            }
            return null;
        }).catch(e => console.error(e))
    };

    const joinSession = collection => (sessionId, memberId) => {
        return collection.findOneAndUpdate({_id: sessionId}, {$addToSet: {members: memberId}}, {returnDocument: 'after'}).then(session => {
            if (session.value) {
                console.log(`Member with id ${memberId} joined to session ${session.value._id}.`);
                return session.value
            } else {
                console.log("Something get wrong.");
            }
            return null;
        }).catch(e => console.error(e))
    };

    const leaveSession = collection => memberId => {
        return collection.findOneAndUpdate({members: memberId}, {$pull: {members: memberId}}, {returnDocument: 'after'}).then(session => {
            if (session.value) {
                if (session.value.members.length > 0) {
                    console.log(`Member with id ${memberId} leaved from session ${session.value._id}.`);
                    return session.value;
                }
                collection.deleteOne({_id: session.value._id}).then(res => {
                    if (res) {
                        console.log(`Session ${session.value._id} was closed.`);
                    } else {
                        console.log('Something get wrong.');
                    }
                })
            }
            return null;
        }).catch(e => console.error(e))
    };

    const clearSessions = collection => () => {
        return collection.deleteMany({}).then(res => {
            if (res) {
                console.log('Sessions was successfully cleared.');
                return true;
            } else {
                console.log('Something get wrong.');
                return false;
            }
        }).catch(e => console.error(e))
    };

    return SessionRepository(
        createSession,
        getSession,
        randomSession,
        joinSession,
        leaveSession,
        clearSessions
    )(collection);

})(SessionRepositoryModule || {})