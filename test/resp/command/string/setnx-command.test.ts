import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "setnx-command test",
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
         * Functional testing of the setnx command
         */
        it(
            "should return 1 when the key does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "setnx",
                        "test",
                        "key"
                    ]
                );
                expect(response).to.equal(1);
            }
        );
        it(
            "should return 0 when the key already exists",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "setnx",
                        "test",
                        "other"
                    ]
                );
                expect(response).to.equal(0);
                response = await sendCommand(
                    client,
                    [
                        "get",
                        "test"
                    ]
                );
                expect(response).to.equal("key");
            }
        );
    }
);
