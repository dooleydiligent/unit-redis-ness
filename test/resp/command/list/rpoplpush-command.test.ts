import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "rpoplpush-command test",
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
                    await sendCommand(
                        client,
                        [
                            "select",
                            "0"
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
         * Functional testing of the rpoplpush command
         */
        it(
            "should return NIL when destination does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpoplpush",
                        "src",
                        "dst"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
        it(
            "should rotate a list when src and dst are the same",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "src",
                        "a"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "src",
                        "b"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "src",
                        "c"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "src",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "a",
                    "b",
                    "c"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "rpoplpush",
                        "src",
                        "src"
                    ]
                );
                expect(response).to.equal("c");
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "src",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "c",
                    "a",
                    "b"
                ]);
            }
        );
        it(
            "should create the target list if it does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "dst"
                    ]
                );
                expect(response).to.equal(0);
                response = await sendCommand(
                    client,
                    [
                        "rpoplpush",
                        "src",
                        "dst"
                    ]
                );
                expect(response).to.equal("b");
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "dst"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "src",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "c",
                    "a"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "dst",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql(["b"]);
            }
        );
    }
);
