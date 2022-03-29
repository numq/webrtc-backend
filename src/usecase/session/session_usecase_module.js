import {DatabaseModule} from "../../data/DatabaseModule.js";
import {SessionRepositoryModule} from "../../data/repository/SessionRepositoryModule.js";
import {SessionUseCaseModule} from "./SessionUseCaseModule.js";
import {ConfigModule} from "../../config/ConfigModule.js";

const config = ConfigModule(true);
const database = DatabaseModule(config.MongoDB);
const sessionCollection = database.createCollection(config.MongoDB.COLLECTION_SESSION);
const sessionRepository = SessionRepositoryModule(sessionCollection);
const sessionUseCase = SessionUseCaseModule(sessionRepository);

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
    test("returns string", async () => {
        expect(typeof await sessionUseCase.createSession()).toBe("string");
    })
})

describe("get session", () => {
    test("returns object", async () => {
        const sessionId = await sessionUseCase.createSession();
        expect(typeof await sessionUseCase.getSession(sessionId)).toBe("object");
    })
})
describe("get random session", () => {
    test("returns object", async () => {
        const sessionId = await sessionUseCase.createSession();
        const memberId = "1";
        await sessionUseCase.joinSession(sessionId, memberId);
        expect(typeof await sessionUseCase.randomSession()).toBe("object");
    })
})

describe("join session", () => {
    test("returns string", async () => {
        const sessionId = await sessionUseCase.createSession();
        const memberId = "1";
        expect(typeof await sessionUseCase.joinSession(sessionId, memberId)).toBe("object");
    })
})

describe("leave session", () => {
    test("returns object", async () => {
        const sessionId = await sessionUseCase.createSession();
        const memberId = "1";
        await sessionUseCase.joinSession(sessionId, memberId);
        expect(typeof await sessionUseCase.leaveSession(memberId)).toBe("object");
    })
})

describe("clear session", () => {
    test("returns boolean", async () => {
        expect(typeof await sessionUseCase.clearSessions()).toBe("boolean");
    })
})
