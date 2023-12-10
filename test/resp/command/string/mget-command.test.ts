import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "mget-command test",
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
         * Functional testing of the zrank command
         */
        it(
            "should return NIL when the key does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "mget",
                        "zset",
                        "member"
                    ]
                );
                expect(response).to.eql([
                    null,
                    null
                ]);
            }
        );
        it(
            "should return multiple values for string keys as requested",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "mset",
                        "key1",
                        "1",
                        "key2",
                        "2",
                        "key3",
                        "3"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "mget",
                        "key2",
                        "key1",
                        "noneya",
                        "key3"
                    ]
                );
                expect(response).to.eql([
                    "2",
                    "1",
                    null,
                    "3"
                ]);
            }
        );
        it(
            "should return NIL for ZSET, LIST, and HASH types as well",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zset",
                        "1",
                        "member"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "list",
                        "value"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "hset",
                        "hash",
                        "field",
                        "value"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "mget",
                        "key2",
                        "key1",
                        "list",
                        "key3",
                        "hash",
                        "zset"
                    ]
                );
                expect(response).to.eql([
                    "2",
                    "1",
                    null,
                    "3",
                    null,
                    null
                ]);
            }
        );
    }
);
