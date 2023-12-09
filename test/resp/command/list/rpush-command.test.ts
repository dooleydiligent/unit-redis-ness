import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "rpush-command test",
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
         * Functional testing of the rpush command
         */
        it(
            "should report ERR when attempting to rpush to a non-list key",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "set",
                        "lkey",
                        "test"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "lkey",
                        "0"
                    ]
                );
                expect(response).to.equal("ReplyError: WRONGTYPE Operation against a key holding the wrong kind of value");
            }
        );
    }
);
