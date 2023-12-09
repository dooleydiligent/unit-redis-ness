import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "rpop-command test",
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
         * Functional testing of the rpop command
         */
        it(
            "should report NIL when rpop called on non-existent key",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpop",
                        "no-key"
                    ]
                );
                expect(response).to.equal(null);
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "no-key"
                    ]
                );
                expect(response).to.equal(0);
            }
        );
    }
);
