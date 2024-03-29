import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../src/server/resp-server";
import {sendCommand} from "../common.test";

describe(
    "lua-bit test",
    () => {
        let respServer: RespServer,
            client: net.Socket = new net.Socket(),
            response: any;
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
                    await sendCommand(
                        client,
                        [
                            "script",
                            "flush"
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
         * Functional testing of lua-bit library
         */
        it(
            "should leverage the LUA bit library for bit AND op",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "eval",
                        "local val = bit.band(5, 1) return val ",
                        "0"
                    ]
                );
                expect(response).to.equal(1);
            }
        );
        it(
            "should leverage the LUA bit library for bit OR op",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "eval",
                        "local val = bit.bor(5, 1) return val ",
                        "0"
                    ]
                );
                expect(response).to.equal(5);
            }
        );
        it(
            "should leverage the LUA bit library for bit XOR op",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "eval",
                        "local val = bit.bxor(5, 1) return val ",
                        "0"
                    ]
                );
                expect(response).to.equal(4);
            }
        );
        it(
            "should leverage the LUA bit library for bit NOT op",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "eval",
                        "local val = bit.bnot(5) return val ",
                        "0"
                    ]
                );
                expect(response).to.equal(-6);
            }
        );
        it(
            "should leverage the LUA bit library for bit LSHIFT op",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "eval",
                        "local val = bit.lshift(5, 1) return val ",
                        "0"
                    ]
                );
                expect(response).to.equal(10);
            }
        );
        it(
            "should leverage the LUA bit library for bit RSHIFT op",
            async() => {
                let response: any = await sendCommand(
                    new net.Socket(),
                    [
                        "info",
                        "server"
                    ]
                );
                // Only run this test if this is unit-redis-ness
                if (!(/redis_version:5/gim).test(response)) {
                    response = await sendCommand(
                        client,
                        [
                            "eval",
                            "local val = bit.rshift(-5, 1) return val ",
                            "0"
                        ]
                    );
                    expect(response).to.equal(-3);
                }
            }
        );
        it(
            "should leverage the LUA bit library for bit ARSHIFT op",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "eval",
                        "local val = bit.arshift(5, 1) return val ",
                        "0"
                    ]
                );
                expect(response).to.equal(2);
            }
        );
    }
);
