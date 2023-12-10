import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "zrank-command test",
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
            "should return NIL when the ZSET does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zrank",
                        "zset",
                        "member"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
        it(
            "should return NIL when the ZSET exists but the key does not",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "zset",
                        "23.3",
                        "member"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "zrank",
                        "zset",
                        "membre"
                    ]
                );
                expect(response).to.equal(null);
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "zset"
                    ]
                );
                expect(response).to.equal(1);
            }
        );
    }
);
