const applyCollection = (repository, collection) => {
    return Object.fromEntries(
        Object.entries(repository)
            .map(([k, v], i) => [k, v(collection), i]));
}

export const SessionRepository = (createSession,
                                  getSession,
                                  randomSession,
                                  joinSession,
                                  leaveSession,
                                  clearSessions) => collection => {
    const repository = {
        createSession: createSession,
        getSession: getSession,
        randomSession: randomSession,
        joinSession: joinSession,
        leaveSession: leaveSession,
        clearSessions: clearSessions
    };
    return applyCollection(repository, collection);
}