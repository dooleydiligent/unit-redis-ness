import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "flushall-command test",
    () => {
        let respServer: RespServer;
        const client: net.Socket = new net.Socket();
        let response: any;
        before((done) => {
            respServer = new RespServer();
            respServer.on(
                "ready",
                async() => {
                    await sendCommand(
                        client,
                        ["flushall"]
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
         * Functional testing of the flushdb command
         */
        it(
            "should remove all keys from all databases",
            async() => {
                for (let db = 0; db < 16; db++) {
                    response = await sendCommand(
                        client,
                        [
                            "select",
                            `${db}`
                        ]
                    );
                    expect(response).to.equal("OK");
                    response = await sendCommand(
                        client,
                        [
                            "set",
                            "dbid",
                            `${db}`
                        ]
                    );
                    expect(response).to.equal("OK");
                    response = await sendCommand(
                        client,
                        ["dbsize"]
                    );
                    console.log(`DB: ${db}: dbsize: ${response}`);
                    expect(response).to.equal(1);
                }
                response = await sendCommand(
                    client,
                    ["flushall"]
                );
                expect(response).to.equal("OK");
                for (let db = 0; db < 16; db++) {
                    response = await sendCommand(
                        client,
                        [
                            "select",
                            `${db}`
                        ]
                    );
                    expect(response).to.equal("OK");
                    response = await sendCommand(
                        client,
                        ["dbsize"]
                    );
                    expect(response).to.equal(0);
                }
            }
        );
    }
);
