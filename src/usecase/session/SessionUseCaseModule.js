export const SessionUseCaseModule = repository => (() => {

    const randomSession = repository => () => repository.randomSession();

    const createSession = repository => () => repository.createSession();

    const getSession = repository => sessionId => repository.getSession(sessionId);

    const joinSession = repository => (sessionId, memberId) => repository.joinSession(sessionId, memberId);

    const leaveSession = repository => memberId => repository.leaveSession(memberId);

    const clearSessions = repository => () => repository.clearSessions();

    return {
        randomSession: randomSession(repository),
        createSession: createSession(repository),
        getSession: getSession(repository),
        joinSession: joinSession(repository),
        leaveSession: leaveSession(repository),
        clearSessions: clearSessions(repository)
    }
})(SessionUseCaseModule || {})