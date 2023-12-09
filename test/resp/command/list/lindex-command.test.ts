import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "lindex-command test",
    () => {
        let respServer: RespServer;
        const client: net.Socket = new net.Socket();
        let response: any;
        before((done) => {
            respServer = new RespServer();
            respServer.on(
                "ready",
                () => {
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
         * Functional testing of the lindex command
         */
        it(
            "should report NIL when lindex called with invalid index on non-existent key",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        "no-key",
                        "negative one thousand"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
        it(
            "should report ERR when attempting to get lindex of non-list key",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "lkey",
                        "test"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        "lkey",
                        "0"
                    ]
                );
                expect(response).to.equal("ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value");
            }
        );
        it(
            "should return the correct key at an index",
            async() => {
                const uniqueKey = `lkey-${new Date().getTime()}`;
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        uniqueKey,
                        "a",
                        "b",
                        "c"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "0"
                    ]
                );
                expect(response).to.equal("a");
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "1"
                    ]
                );
                expect(response).to.equal("b");
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "-1"
                    ]
                );
                expect(response).to.equal("c");
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "-100"
                    ]
                );
                expect(response).to.equal(null);
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "two"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR value is not an integer or out of range");
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        uniqueKey,
                        "a1",
                        "b2",
                        "c3"
                    ]
                );
                expect(response).to.equal(6);
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "-6"
                    ]
                );
                expect(response).to.equal("a");
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "-7"
                    ]
                );
                expect(response).to.equal(null);
                response = await sendCommand(
                    client,
                    [
                        "lindex",
                        uniqueKey,
                        "100"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
    }
);
