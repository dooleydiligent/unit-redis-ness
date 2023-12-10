import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "zscore-command test",
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
         * Functional testing of the zscore command
         */
        it(
            "should return the score of a zset member",
            async() => {
                response = await sendCommand(
                    client,
                    ["flushall"]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zset",
                        "10",
                        "one"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "zscore",
                        "zset",
                        "one"
                    ]
                );
                expect(response).to.equal("10");
            }
        );
        it(
            "should return null when the key or member does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zscore",
                        "dontexist",
                        "two"
                    ]
                );
                expect(response).to.equal(null);
                response = await sendCommand(
                    client,
                    [
                        "zscore",
                        "zset",
                        "two"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
    }
);
