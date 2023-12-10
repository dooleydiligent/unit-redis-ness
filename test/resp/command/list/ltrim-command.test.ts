import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "ltrim-command test",
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
         * Functional testing of the ltrim command
         */
        it(
            "should report OK when the key does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "ltrim",
                        "no-key",
                        "0",
                        "100"
                    ]
                );
                expect(response).to.equal("OK");
            }
        );
        it(
            "should trim a list to the requested size or less",
            async() => {
                response = await sendCommand(
                    client,
                    ["flushall"]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "RPUSH",
                        "mylist",
                        "hello"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "RPUSH",
                        "mylist",
                        "hello"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "RPUSH",
                        "mylist",
                        "calibrate"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "RPUSH",
                        "mylist",
                        "hello"
                    ]
                );
                expect(response).to.equal(4);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "mylist",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "hello",
                    "hello",
                    "calibrate",
                    "hello"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "llen",
                        "mylist"
                    ]
                );
                expect(response).to.equal(4);
                response = await sendCommand(
                    client,
                    [
                        "ltrim",
                        "mylist",
                        "0",
                        "100"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "llen",
                        "mylist"
                    ]
                );
                expect(response).to.equal(4);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "mylist",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "hello",
                    "hello",
                    "calibrate",
                    "hello"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "ltrim",
                        "mylist",
                        "1",
                        "4"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "mylist",
                        "0",
                        "3"
                    ]
                );
                expect(response).to.eql([
                    "hello",
                    "calibrate",
                    "hello"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "llen",
                        "mylist"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "ltrim",
                        "mylist",
                        "-2",
                        "1"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "llen",
                        "mylist"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "mylist",
                        "0",
                        "1"
                    ]
                );
                expect(response).to.eql(["calibrate"]);
            }
        );
        it(
            "should reject an invalid start index",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "ltrim",
                        "testlist",
                        "wrong",
                        "10"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR value is not an integer or out of range");
            }
        );
    }
);
