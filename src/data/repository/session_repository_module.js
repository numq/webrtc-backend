import {DatabaseModule} from "../DatabaseModule.js";
import {SessionRepositoryModule} from "./SessionRepositoryModule.js";
import {ConfigModule} from "../../config/ConfigModule.js";

const config = ConfigModule(true);
const database = DatabaseModule(config.MongoDB);
const sessionCollection = database.createCollection(config.MongoDB.COLLECTION_SESSION);
const sessionRepository = SessionRepositoryModule(sessionCollection);

beforeAll(async () => {
    await database.connect();
    await sessionRepository.clearSessions();
})

afterAll(async () => {
    await database.close();
})

afterEach(async () => {
    await sessionRepository.clearSessions();
})

describe("create session", () => {

    test("return id of created session", async () => {

        const sessionId = await sessionRepository.createSession();

        expect(sessionId).toEqual(expect.any(String));

    })

})

describe("get session by id", () => {

    test("return session if exists", async () => {

        const sessionId = await sessionRepository.createSession();
        const session = await sessionRepository.getSession(sessionId);

        expect(session).toEqual({
            _id: expect.any(String),
            members: []
        });

    })

    test("return null if the session does not exist", async () => {

        const session = await sessionRepository.getSession("");

        expect(session).toEqual(null);

    })

})

describe("get random session", () => {

    test("random session exists", async () => {

        const memberId = "1";
        const sessionId = await sessionRepository.createSession();
        await sessionRepository.joinSession(sessionId, memberId);
        const session = await sessionRepository.randomSession();

        expect(session).toEqual({
            _id: expect.any(String),
            members: [memberId]
        });

    })

    test("random session does not exists", async () => {

        const session = await sessionRepository.randomSession();

        expect(session).toEqual(null);

    })

})

describe("join session", () => {

    test("return updated session when member joins", async () => {

        const memberId = "1";
        const sessionId = await sessionRepository.createSession();
        const updatedSession = await sessionRepository.joinSession(sessionId, memberId);

        expect(updatedSession).toEqual({_id: sessionId, members: [memberId]});

    })

    test("return null if the target session does not exist", async () => {

        const falseSessionId = "";
        const falseMemberId = "";
        const updatedSession = await sessionRepository.joinSession(falseSessionId, falseMemberId);

        expect(updatedSession).toBe(null);

    })

    test("ignore member which is already in session", async () => {

        const memberId = "1";
        const sessionId = await sessionRepository.createSession();
        await sessionRepository.joinSession(sessionId, memberId);
        const updatedSession = await sessionRepository.joinSession(sessionId, memberId);

        expect(updatedSession).toEqual({_id: sessionId, members: [memberId]});

    })

})

describe("leave session", () => {

    test("return updated session when member leaves session", async () => {

        const memberIdFirst = "1";
        const memberIdSecond = "2";
        const sessionId = await sessionRepository.createSession();
        await sessionRepository.joinSession(sessionId, memberIdFirst);
        await sessionRepository.joinSession(sessionId, memberIdSecond);
        const updatedSession = await sessionRepository.leaveSession(memberIdFirst);

        expect(updatedSession).toEqual({_id: sessionId, members: expect.arrayContaining([memberIdSecond])});

    })

    test("return null when last member leaves session", async () => {

        const memberId = "1";
        const sessionId = await sessionRepository.createSession();
        await sessionRepository.joinSession(sessionId, memberId);
        const updatedSession = await sessionRepository.leaveSession(memberId);

        expect(updatedSession).toBe(null);

    })

    test("return null when impossible to leave session", async () => {

        const falseId = "";
        const updatedSession = await sessionRepository.leaveSession(falseId);

        expect(updatedSession).toBe(null);

    })

})

describe("clear sessions", () => {

    test("return true if successfully cleared", async () => {

        const status = await sessionRepository.clearSessions();

        expect(status).toBe(true);

    })

})
