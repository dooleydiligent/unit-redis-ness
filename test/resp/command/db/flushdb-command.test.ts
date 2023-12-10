import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "flushdb-command test",
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
            "should remove all keys from only the currently selected databases",
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
                    expect(response).to.equal(1);
                }
                for (let db = 0; db < 16; db++) {
                    if (db !== 14) {
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
                            ["flushdb"]
                        );
                        expect(response).to.equal("OK");
                        response = await sendCommand(
                            client,
                            [
                                "exists",
                                "dbid"
                            ]
                        );
                        expect(response).to.equal(0);
                        response = await sendCommand(
                            client,
                            ["dbsize"]
                        );
                        expect(response).to.equal(0);
                    }
                }
                response = await sendCommand(
                    client,
                    [
                        "select",
                        "14"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "get",
                        "dbid"
                    ]
                );
                expect(response).to.equal("14");
                response = await sendCommand(
                    client,
                    ["dbsize"]
                );
                expect(response).to.equal(1);
            }
        );
    }
);
