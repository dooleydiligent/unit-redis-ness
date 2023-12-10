import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "lset-command test",
    () => {
        let respServer: RespServer;
        const client: net.Socket = new net.Socket();
        let response: any;
        const testkey: string = `testkey-${new Date().getTime()}`;
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
            "should fail when a key does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "lset",
                        "no-key",
                        "negative one thousand",
                        "test"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR no such key");
            }
        );
        it(
            "should replace a valid index",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        testkey,
                        "a",
                        "b",
                        "c"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "lset",
                        testkey,
                        "-1",
                        "z"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        testkey,
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "a",
                    "b",
                    "z"
                ]);
            }
        );
        it(
            "should recognize invalid indexes",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "lset",
                        testkey,
                        "invalid",
                        "3"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR value is not an integer or out of range");
            }
        );
    }
);
