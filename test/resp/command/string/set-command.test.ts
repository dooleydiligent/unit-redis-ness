import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "set-command test",
    () => {
        let respServer: RespServer,
            client: net.Socket = new net.Socket(),
            response: any;
        before((done) => {
            respServer = new RespServer();
            respServer.on(
                "ready",
                async() => {
                    await sendCommand(
                        client,
                        ["flushall"]
                    );
                    await sendCommand(
                        client,
                        [
                            "select",
                            "0"
                        ]
                    );
                    await sendCommand(
                        client,
                        [
                            "script",
                            "flush"
                        ]
                    );
                    done();
                }
            );
            respServer.start();
        });
        beforeEach(() => {
            sinon.createSandbox();
        });

        afterEach(() => {
            sinon.restore();
        });

        after(async() => {
            await respServer.stop();
        });

        /**
         * Functional testing of the set command
         */
        it(
            "should allow us to set a several second ttl",
            async() => {
                // During local testing there are 8 milliseconds from put to get
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "TTLtest",
                        "key",
                        "EX",
                        "1"
                    ]
                );
                expect(response).to.equal("OK");
            }
        );

        it(
            "should NOT allow SET to invoke NX after XX",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "test",
                        "key",
                        "XX",
                        "NX"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR syntax error");
            }
        );
        it(
            "should NOT allow SET to invoke XX after NX",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "test",
                        "key",
                        "NX",
                        "XX"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR syntax error");
            }
        );
        it(
            "should return nil when SET invoked with XX on a key that doesn't exist",
            async() => {
                const uniqueKey: string = `TEST${new Date().getTime()}`;
                response = await sendCommand(
                    client,
                    [
                        "set",
                        uniqueKey,
                        "key",
                        "XX"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
        it(
            "should return OK when SET invoked with XX on a key that DOES exist",
            async() => {
                const uniqueKey: string = `TEST${new Date().getTime()}`;
                // Set the key with NX first to validate that functionality
                response = await sendCommand(
                    client,
                    [
                        "set",
                        uniqueKey,
                        "key",
                        "NX"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "set",
                        uniqueKey,
                        "new value",
                        "XX"
                    ]
                );
                expect(response).to.equal("OK");
                // Now validate that the key is what we said last
                response = await sendCommand(
                    client,
                    [
                        "get",
                        uniqueKey
                    ]
                );
                expect(response).to.equal("new value");
            }
        );
        it(
            "should NOT allow SET to invoke EX and PX simultaneously",
            async() => {
                // Note: Our behavior is different from redis.  This error is 'wrong number of args'
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "test",
                        "key",
                        "EX",
                        "100",
                        "PX",
                        "100"
                    ]
                );
                expect(response).to.match(/^ReplyError: ERR syntax error/);
            }
        );
        it(
            "should allow us to set a millisecond ttl",
            async() => {
                // During local teseting there are 8 milliseconds from put to get
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "MILLItest",
                        "key",
                        "PX",
                        "1"
                    ]
                );
                expect(response).to.equal("OK");
            }
        );
        it(
            "should prove that the one second TTL has expired",
            (done) => {
                setTimeout(
                    () => {
                        sendCommand(
                            client,
                            [
                                "get",
                                "TTLtest"
                            ]
                        ).
                            then((responseGet: any) => {
                                expect(responseGet).to.equal(null);
                                done();
                            });
                    },
                    1000
                );
            }
        );
        it(
            "should not accept unknown parameters",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "test",
                        "key",
                        "Q"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR syntax error");
            }
        );
        it(
            "should NOT allow SET to invoke PX after EX",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "test",
                        "key",
                        "EX",
                        "100",
                        "PX"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR syntax error");
            }
        );
        it(
            "should NOT allow SET to invoke EX after PX",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "test",
                        "key",
                        "PX",
                        "100",
                        "EX"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR syntax error");
            }
        );
        it(
            "should not allow a TTL less than 1ms",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "MILLItest",
                        "key",
                        "PX",
                        "0"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR invalid expire time in set");
            }
        );
        it(
            "should prove that the millisecond TTL has expired",
            (done) => {
                setTimeout(
                    () => {
                        sendCommand(
                            client,
                            [
                                "get",
                                "MILLItest"
                            ]
                        ).
                            then((responseGet: any) => {
                                expect(responseGet).to.equal(null);
                                done();
                            });
                    },
                    10
                );
            }
        );
    }
);
