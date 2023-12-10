import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "lrange-command test",
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
         * Functional testing of the lrange command
         */
        it(
            "return an empty list when the key does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "no-key",
                        "0",
                        "100"
                    ]
                );
                expect(response).to.eql([]);
            }
        );
        it(
            "should report an error when start or stop index are invalid",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "no-key",
                        "negative one",
                        "-2"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR value is not an integer or out of range");
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "no-key",
                        "0",
                        "negative two"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR value is not an integer or out of range");
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "no-key",
                        "-1",
                        "-100"
                    ]
                );
                expect(response).to.eql([]);
            }
        );
        it(
            "should return predictable results",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "newlist",
                        "hello"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "newlist",
                        "world"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "newlist",
                        "0",
                        "-1"
                    ]
                );
                expect(response).to.eql([
                    "hello",
                    "world"
                ]);
            }
        );
        it(
            "should reproduce the results from the redis documentation",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "doclist",
                        "one"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "doclist",
                        "two"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        "doclist",
                        "three"
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "doclist",
                        "0",
                        "0"
                    ]
                );
                expect(response).to.eql(["one"]);
                response = await sendCommand(
                    client,
                    [
                        "lrange",
                        "doclist",
                        "-3",
                        "2"
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
                        "lrange",
                        "doclist",
                        "-100",
                        "100"
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
                        "lrange",
                        "doclist",
                        "5",
                        "10"
                    ]
                );
                expect(response).to.eql([]);
            }
        );
    }
);
