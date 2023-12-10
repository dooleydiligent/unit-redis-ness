import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "lpop-command test",
    () => {
        let respServer: RespServer;
        const client: net.Socket = new net.Socket();
        let response: any;
        const testKey: string = `lpop-key-${new Date().getTime()}`;
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
         * Functional testing of the lpop command
         */
        it(
            "should report NIL when lpop called on non-existent key",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "lpop",
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
        it(
            "should return values from the left side of a list",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "rpush",
                        testKey,
                        "a",
                        "b",
                        "c",
                        "d"
                    ]
                );
                expect(response).to.equal(4);
                response = await sendCommand(
                    client,
                    [
                        "lpop",
                        testKey
                    ]
                );
                expect(response).to.equal("a");
                response = await sendCommand(
                    client,
                    [
                        "lpop",
                        testKey
                    ]
                );
                expect(response).to.equal("b");
                response = await sendCommand(
                    client,
                    [
                        "lpop",
                        testKey
                    ]
                );
                expect(response).to.equal("c");
                response = await sendCommand(
                    client,
                    [
                        "lpop",
                        testKey
                    ]
                );
                expect(response).to.equal("d");
                response = await sendCommand(
                    client,
                    [
                        "lpop",
                        testKey
                    ]
                );
                expect(response).to.equal(null);
                // The list goes away when the last element is removed
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        testKey
                    ]
                );
                expect(response).to.equal(0);
            }
        );
    }
);
