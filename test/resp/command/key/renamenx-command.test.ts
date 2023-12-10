import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "renamenx-command test",
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
         * Functional testing of the renamenx command
         */
        it(
            "should report an error when the key does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "renamenx",
                        "mykey",
                        "my-otherkey"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR no such key");
            }
        );
        it(
            "should return 0 when attempting renamenx with source = destination",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "key",
                        "value"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "renamenx",
                        "key",
                        "key"
                    ]
                );
                expect(response).to.equal(0);
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "key"
                    ]
                );
                expect(response).to.equal(1);
            }
        );
        it(
            "should rename a key when requested",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "renamenx",
                        "key",
                        "newkey"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "key"
                    ]
                );
                expect(response).to.equal(0);
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "newkey"
                    ]
                );
                expect(response).to.equal(1);
            }
        );
    }
);
