import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "mset-command test",
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
         * Functional testing of the flushdb command
         */
        it(
            "should create multiple keys at once",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "mset",
                        "key1",
                        "Hello",
                        "key2",
                        "world"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "get",
                        "key1"
                    ]
                );
                expect(response).to.equal("Hello");
                response = await sendCommand(
                    client,
                    [
                        "get",
                        "key2"
                    ]
                );
                expect(response).to.equal("world");
            }
        );
        it(
            "should only accept an even number of parameters",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "msEt",
                        "wrong",
                        "number",
                        "of"
                    ]
                );
                expect(response).to.match(/ReplyError: ERR wrong number of arguments for MSET/i);
            }
        );
    }
);
