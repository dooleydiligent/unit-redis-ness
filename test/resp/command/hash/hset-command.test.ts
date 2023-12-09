import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

let lastId = "";
describe(
    "hset command test",
    () => {
        let respServer: RespServer;
        before((done) => {
            respServer = new RespServer();
            respServer.on(
                "ready",
                async() => {
                    await sendCommand(
                        new net.Socket(),
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
         * Functional testing of the hset command
         */
        it(
            "should require a minimum of 3 parameters",
            async() => {
                const uniqueKey = `KEY${new Date().getTime()}`;
                expect(uniqueKey).not.to.equal(lastId);
                lastId = uniqueKey;
                let response = await sendCommand(
                    new net.Socket(),
                    [
                        "hset",
                        uniqueKey
                    ]
                );
                expect(response).to.match(/ReplyError: ERR wrong number of arguments for \'hset\' command/i);
                response = await sendCommand(
                    new net.Socket(),
                    [
                        "hset",
                        uniqueKey,
                        "one"
                    ]
                );
                expect(response).to.match(/ReplyError: ERR wrong number of arguments for \'hm?set\' command/i);
                response = await sendCommand(
                    new net.Socket(),
                    [
                        "hset",
                        uniqueKey,
                        "one",
                        "two"
                    ]
                );
                expect(response).to.equal(1);
            }
        );
        it(
            "should only accept an odd number of parameters",
            async() => {
                const uniqueKey = `newKey${new Date().getTime()}`;
                expect(uniqueKey).not.to.equal(lastId);
                lastId = uniqueKey;
                const response = await sendCommand(
                    new net.Socket(),
                    [
                        "hset",
                        uniqueKey,
                        "one2",
                        "two",
                        "fail"
                    ]
                );
                expect(response).to.match(/ReplyError: ERR wrong number of arguments for hm?set/i);
            }
        );
        it(
            "should only report added fields",
            async() => {
                const uniqueKey = `key3${new Date().getTime()}`;
                expect(uniqueKey).not.to.equal(lastId);
                lastId = uniqueKey;
                let response = await sendCommand(
                    new net.Socket(),
                    [
                        "hset",
                        uniqueKey,
                        "one",
                        "six"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    new net.Socket(),
                    [
                        "hset",
                        uniqueKey,
                        "one",
                        "anothervalue"
                    ]
                );
                expect(response).to.equal(0);
                response = await sendCommand(
                    new net.Socket(),
                    [
                        "hget",
                        uniqueKey,
                        "one"
                    ]
                );
                expect(response).to.equal("anothervalue");
            }
        );
    }
);
