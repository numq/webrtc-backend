import WebSocket, {WebSocketServer} from "ws";
import * as fs from "fs";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import {v4 as generateUUID} from "uuid";

export const WebSocketServerModule = config => (() => {

    const options = root => {
        return {
            url: config.HOST,
            key: fs.readFileSync(path.join(root, '', 'cert', 'key.pem')),
            cert: fs.readFileSync(path.join(root, '', 'cert', 'cert.pem'))
        }
    };

    const MessageType = {
        REQUEST: "REQUEST",
        LEAVE: "LEAVE",
        OFFER: "OFFER",
        ANSWER: "ANSWER",
        CANDIDATE: "CANDIDATE"
    }

    const httpServer = http.createServer();
    const httpsServer = https.createServer(options(path.resolve()));

    const preferredServer = config.SECURE ? httpsServer : httpServer;
    const webSocketServer = new WebSocketServer({server: preferredServer});

    const clients = new Map();

    const connect = async (onClientOpen, onClientClose, message) => {

        console.log(`Connected to server: ${config.HOST}:${config.PORT}`);

        await init(webSocketServer, onClientOpen, onClientClose, message).then(_ => httpServer.listen(config.PORT, config.HOST));

    };

    const disconnect = async () => {

        console.log(`Disconnected from server: ${config.HOST}:${config.PORT}`);

        await webSocketServer.close()

    };

    const broadcast = (type, body) => {
        clients.forEach((_, client) => {
            if (client.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({type: type, body: body});
                client.send(message, {isBinary: false});
            }
        });
    };

    const broadcastExcept = (id, type, body) => {
        clients.forEach((clientId, client) => {
            if (id !== clientId && client.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({type: type, body: body});
                client.send(message, {isBinary: false});
            }
        });
    };

    const getId = ws => clients.get(ws);

    const sendMessage = (id, type, body) => {
        try {
            const message = JSON.stringify({type: type, body: body});
            [...clients].find(([_, val]) => val === id)[0].send(message, {isBinary: false});
        } catch (e) {
            console.log(`Unable to send message to id: ${id}, reason: ${e}`);
        }
    };

    const onMessage = async (wss, ws, data, isBinary, bind) => {

        const message = isBinary ? data : data.toString();

        const type = JSON.parse(message).type;
        const body = JSON.parse(message).body;

        await bind(ws, type, body);
    };

    const onOpen = async (wss, ws, bind) => {

        const id = generateUUID().toString();
        clients.set(ws, id);
        console.log(`Client with id ${id} connected!`);

        await bind(ws);

    };

    const onClose = async (wss, ws, bind) => {

        await bind(ws);

        console.log(`Client with id ${clients.get(ws)} disconnected!`);
        clients.delete(ws);

    };

    const init = async (server, open, close, message) => {
        server.on('connection', async ws => {

            await onOpen(server, ws, open);

            ws.on('close', async () => {
                await onClose(server, ws, close);
            });

            ws.on('message', async (data, isBinary) => {
                await onMessage(server, ws, data, isBinary, message);
            });

        });
    };

    return {
        MessageType: MessageType,
        connect: connect,
        disconnect: disconnect,
        getId: getId,
        sendMessage: sendMessage,
        broadcast: broadcast,
        broadcastExcept: broadcastExcept
    }
})(WebSocketServerModule || {})