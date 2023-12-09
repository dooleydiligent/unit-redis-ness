import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "sunion-command test",
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
         * Functional testing of the sunion command
         */
        it(
            "should return EMPTY SET when the source set does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "sunion",
                        "ary"
                    ]
                );
                expect(response).to.eql([]);
            }
        );
        it(
            "should return the union of a single set",
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
                        "c",
                        "d"
                    ]
                );
                expect(response).to.equal(4);
                response = await sendCommand(
                    client,
                    [
                        "sunion",
                        "key1"
                    ]
                );
                expect(response.sort()).to.eql([
                    "a",
                    "b",
                    "c",
                    "d"
                ]);
            }
        );
        it(
            "should fail when sunion requested againt non-set keys",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "string-key",
                        "value"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "sunion",
                        "key1",
                        "string-key"
                    ]
                );
                expect(response).to.equal("ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value");
            }
        );
        it(
            "should return the union of multiple sets",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "sadd",
                        "key2",
                        "c"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "sadd",
                        "key3",
                        "a",
                        "c",
                        "e"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "sunion",
                        "key1",
                        "key2",
                        "key3"
                    ]
                );
                expect(response.sort()).to.eql([
                    "a",
                    "b",
                    "c",
                    "d",
                    "e"
                ]);
            }
        );
    }
);
