import {DatabaseModule} from "./data/DatabaseModule.js";
import {WebSocketServerModule} from "./infrastructure/WebSocketServerModule.js";
import {SessionRepositoryModule} from "./data/repository/SessionRepositoryModule.js";
import {SessionUseCaseModule} from "./usecase/session/SessionUseCaseModule.js";
import {ConfigModule} from "./config/ConfigModule.js";

const configModule = ConfigModule();
const webSocketModule = WebSocketServerModule(configModule.WebSocket);
const databaseModule = DatabaseModule(configModule.MongoDB);

(async (config, webSocket, database) => {

    const sessionCollection = database.createCollection(config.MongoDB.COLLECTION_SESSION)
    const sessionRepository = SessionRepositoryModule(sessionCollection);
    const sessionUseCase = SessionUseCaseModule(sessionRepository);

    await database.connect().then(sessionRepository.clearSessions);

    const notify = (server, ws, session) => {
        if (session != null) {
            if (session.members.length > 0) {
                session.members.forEach(member => {
                    server.sendMessage(member, 'notify', {
                        clientId: member,
                        sessionId: session._id,
                        members: session.members.join(';')
                    });
                })
            }
        }
    };

    await webSocket.connect(async _ => {

    }, async ws => {
        sessionUseCase.leaveSession(webSocket.getId(ws)).then(session => {
            notify(webSocket, ws, session);
        })
    }, (ws, type, body) => {

        console.log("Got message with type: %s", type);

        switch (type) {

            case ('request'): {
                sessionUseCase.randomSession().then(session => {
                    if (session !== null) {
                        sessionUseCase.joinSession(session._id, webSocket.getId(ws)).then(res => {
                            notify(webSocket, ws, res);
                        })
                    } else {
                        sessionUseCase.createSession().then(id => {
                            sessionUseCase.joinSession(id, webSocket.getId(ws)).then(res => {
                                notify(webSocket, ws, res);
                            })
                        })
                    }
                })
                break
            }

            case ('leave'): {
                sessionUseCase.leaveSession(webSocket.getId(ws)).then(session => {
                    notify(webSocket, ws, session);
                })
                break
            }

            case ('candidate'): {
                webSocket.sendMessage(body.id, type, body);
                break
            }

            case ('offer'): {
                console.log('offer from %s', webSocket.getId(ws))
                webSocket.sendMessage(body.id, type, {
                    id: webSocket.getId(ws),
                    sdp: body.sdp
                });
                break
            }

            case ('answer'): {
                console.log('answer from %s', webSocket.getId(ws))
                webSocket.sendMessage(body.id, type, {
                    sdp: body.sdp
                });
                break
            }
        }
    });

})(configModule, webSocketModule, databaseModule).catch(e => {
    console.error(e);
    webSocketModule.disconnect().then(databaseModule.close);
})