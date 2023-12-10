import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "sinterstore-command test",
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
         * Functional testing of the sinterstore command
         */
        it(
            "should require a minimum of two parameters",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "sinterstore",
                        "ary"
                    ]
                );
                expect(response).to.match(/ERR wrong number of arguments for \'sinterstore\' command/i);
            }
        );
        it(
            "should return ZERO when the source set does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "sinterstore",
                        "dest",
                        "src"
                    ]
                );
                expect(response).to.eql(0);
            }
        );
        it(
            "should overwrite the destination and return the number of keys copied",
            async() => {
                response = await sendCommand(
                    client,
                    ["flushall"]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "sadd",
                        "key1",
                        "a",
                        "b",
                        "c"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "sadd",
                        "key2",
                        "c",
                        "d",
                        "e"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "key3",
                        "some text value"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "sinterstore",
                        "key3",
                        "key1",
                        "key2"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "smembers",
                        "key3"
                    ]
                );
                expect(response).to.eql(["c"]);
            }
        );
        it(
            "should fail when one of the keys is not a set",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zkey",
                        "1",
                        "two"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "sinterstore",
                        "key1",
                        "zkey"
                    ]
                );
                expect(response).to.equal("ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value");
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "skey1",
                        "test"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "sinterstore",
                        "key1",
                        "skey1"
                    ]
                );
                expect(response).to.equal("ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value");
            }
        );
    }
);
