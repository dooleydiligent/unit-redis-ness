import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "exists-command test",
    () => {
        let respServer: RespServer;
        before((done) => {
            respServer = new RespServer();
            respServer.on(
                "ready",
                () => {
                    // Set a key with a millisecond TTL to validate exists respects TTL
                    sendCommand(
                        new net.Socket(),
                        [
                            "set",
                            "ttlkey",
                            "value",
                            "PX",
                            "3"
                        ]
                    ).
                        then(() => {
                            done();
                        });
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
         * Functional testing of the exists command
         */
        it(
            "should report ZERO when none of the specified keys exist",
            (done) => {
                sendCommand(
                    new net.Socket(),
                    [
                        "exists",
                        "key1",
                        "key2",
                        "key3"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.be.a("number");
                        expect(response).to.equal(0);
                        done();
                    });
            }
        );
        it(
            "should require at least ONE parameter",
            (done) => {
                sendCommand(
                    new net.Socket(),
                    ["exists"]
                ).
                    then((response: any) => {
                        expect(response).to.equal("ReplyError: ERR wrong number of arguments for 'exists' command");
                        done();
                    });
            }
        );
        it(
            "should report GREATER THAN ZERO when checking for the same existing key multiple times",
            (done) => {
                sendCommand(
                    new net.Socket(),
                    [
                        "set",
                        "key",
                        "value"
                    ]
                ).
                    then(() => {
                        sendCommand(
                            new net.Socket(),
                            [
                                "exists",
                                "key",
                                "key",
                                "unknownkey",
                                "another",
                                "another"
                            ]
                        ).
                            then((response: any) => {
                                expect(response).to.equal(2);
                                done();
                            });
                    });
            }
        );
        it(
            "should respect the TTL value on a key",
            (done) => {
                sendCommand(
                    new net.Socket(),
                    [
                        "exists",
                        "ttlkey"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.equal(0);
                        done();
                    });
            }
        );
    }
);
