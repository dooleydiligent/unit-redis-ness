import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "zrange-command test",
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
         * Functional testing of the zrange command
         */
        it(
            "should reproduce the redis documentation examples",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zset",
                        "1",
                        "one"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zset",
                        "2",
                        "two"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zset",
                        "3",
                        "three"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        "zset",
                        "0",
                        "-1"
                    ]
                );
                expect(response).to.eql([
                    "one",
                    "two",
                    "three"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        "zset",
                        "2",
                        "3"
                    ]
                );
                expect(response).to.eql(["three"]);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        "zset",
                        "-2",
                        "-1"
                    ]
                );
                expect(response).to.eql([
                    "two",
                    "three"
                ]);
            }
        );
        it(
            "should also reproduce the second documented example",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        "zset",
                        "0",
                        "1",
                        "withscores"
                    ]
                );
                expect(response).to.eql([
                    "one",
                    "1",
                    "two",
                    "2"
                ]);
            }
        );
    }
);
