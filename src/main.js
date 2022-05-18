import {DatabaseModule} from "./data/DatabaseModule.js";
import {WebSocketServerModule} from "./infrastructure/WebSocketServerModule.js";
import {SessionRepositoryModule} from "./data/repository/SessionRepositoryModule.js";
import {SessionUseCaseModule} from "./usecase/session/SessionUseCaseModule.js";
import {ConfigModule} from "./config/ConfigModule.js";
import {MessageType} from "./infrastructure/MessageType.js"

const configModule = ConfigModule();
const webSocketModule = WebSocketServerModule(configModule.WebSocket);
const databaseModule = DatabaseModule(configModule.MongoDB);

(async (config, webSocket, database) => {

    const sessionCollection = database.createCollection(config.MongoDB.COLLECTION_SESSION);
    const sessionRepository = SessionRepositoryModule(sessionCollection);
    const sessionUseCase = SessionUseCaseModule(sessionRepository);

    await database.connect().then(sessionRepository.clearSessions);

    const SessionType = {
        CONNECTING: "CONNECTING",
        CONNECTED: "CONNECTED",
        DISCONNECTED: "DISCONNECTED"
    }

    const notify = (server, ws, session, type) => {
        if (type === SessionType.CONNECTED) {
            session?.members.forEach(member => {
                server.sendMessage(member, SessionType.CONNECTED, {
                    sessionId: session._id,
                    clientId: member,
                    strangerId: session.members.filter(m => m !== member)[0],
                    isLastConnected: session.members[1] === member
                });
            });
        } else {
            session?.members.forEach(member => {
                server.sendMessage(member, type);
            });
        }
    };

    await webSocket.connect(async _ => {

    }, async ws => {
        sessionUseCase.leaveSession(webSocket.getId(ws)).then(session => {
            notify(webSocket, ws, session, SessionType.DISCONNECTED);
        });
    }, (ws, type, body) => {

        console.log("Got message with type: %s", type);
        if (type !== "candidate") {
            console.log(body);
        }

        switch (type.toUpperCase()) {

            case (MessageType.REQUEST): {
                sessionUseCase.randomSession().then(session => {
                    if (session !== null) {
                        sessionUseCase.joinSession(session._id, webSocket.getId(ws)).then(res => {
                            notify(webSocket, ws, res, SessionType.CONNECTED);
                        });
                    } else {
                        sessionUseCase.createSession().then(id => {
                            sessionUseCase.joinSession(id, webSocket.getId(ws)).then(res => {
                                notify(webSocket, ws, res, SessionType.CONNECTING);
                            });
                        });
                    }
                });
                break;
            }
            case (MessageType.LEAVE): {
                sessionUseCase.leaveSession(webSocket.getId(ws)).then(session => {
                    notify(webSocket, ws, session, SessionType.DISCONNECTED);
                });
                break;
            }
            case (MessageType.CANDIDATE): {
                webSocket.sendMessage(body.id, type, body);
                break;
            }
            case (MessageType.OFFER): {
                console.log('offer from %s', webSocket.getId(ws))
                webSocket.sendMessage(body.id, type, {
                    id: webSocket.getId(ws),
                    sdp: body.sdp
                });
                break;
            }
            case (MessageType.ANSWER): {
                console.log('answer from %s', webSocket.getId(ws))
                webSocket.sendMessage(body.id, type, {
                    sdp: body.sdp
                });
                break;
            }
            default: {
                webSocket.broadcast(type, body);
                break;
            }
        }
    });

})(configModule, webSocketModule, databaseModule).catch(e => {
    console.error(e);
    webSocketModule.disconnect().then(databaseModule.close);
})