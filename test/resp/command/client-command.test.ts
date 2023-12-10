import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import * as util from "util";
import {RespServer} from "../../../src/server/resp-server";
import {sendCommand} from "../../common.test";

describe(
    "client command test",
    () => {
        let respServer: RespServer;
        const DEFAULT_ERROR = "ReplyError: ERR Unknown subcommand or wrong number of arguments for '%s'. Try CLIENT HELP",
            client: net.Socket = new net.Socket();
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
         * Functional testing of the client command.
         */
        it(
            "should not allow more than 3 parameters",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "one",
                        "two",
                        "three",
                        "four"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR Unknown subcommand or wrong number of arguments for 'one'. Try CLIENT HELP");
            }
        );
        it(
            "should fail predictably when an unknown subcommand is passed",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "whatever"
                    ]
                );
                expect(response).to.equal(util.format(
                    DEFAULT_ERROR,
                    "whatever"
                ));
            }
        );
        it(
            "should return a NIL name when called with \"GETNAME\" subcommand",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "getname"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
        it(
            "should fail predictably when \"GETNAME\" is called with too many parameters",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "getname",
                        "extra"
                    ]
                );
                expect(response).to.equal(util.format(
                    DEFAULT_ERROR,
                    "getname"
                ));
            }
        );
        it(
            "should respond with \"OK\" when \"setname\" is called with a valid name",
            async() => {
                let response = await sendCommand(
                    client,
                    [
                        "client",
                        "setname",
                        "whatever"
                    ]
                );
                expect(response).to.equal("OK");
                response = await sendCommand(
                    client,
                    [
                        "client",
                        "getname"
                    ]
                );
                expect(response).to.equal("whatever");
            }
        );
        it(
            "should persist the value for \"setname\" across tests",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "getname"
                    ]
                );
                expect(response).to.equal("whatever");
            }
        );
        it(
            "should respond with a predictable message when \"setname\" called with too many parameters",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "setname",
                        "test",
                        "two"
                    ]
                );
                expect(response).to.equal(util.format(
                    DEFAULT_ERROR,
                    "setname"
                ));
            }
        );
        it(
            "should not allow whitespace in \"setname\" subcommand",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "setname",
                        "te\nst"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR Client names cannot contain spaces, newlines or special characters.");
            }
        );
        it(
            "should return the server-assigned client id",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "id"
                    ]
                );
                expect(response).to.be.a("number");
                expect(String(response).length).to.be.greaterThan(0);
            }
        );
        it(
            "should respond with a predictable message when \"id\" called with too many parameters",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "id",
                        "test",
                        "two"
                    ]
                );
                expect(response).to.equal(util.format(
                    DEFAULT_ERROR,
                    "id"
                ));
            }
        );
        it(
            "should return a bunch of information when client \"list\" subcommand is invoked",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "list"
                    ]
                );
                expect(response).to.be.a("string");
                expect(response.length).to.be.greaterThan(0);
                expect(response).to.match(/ name=whatever /);
                expect(response).to.match(/\bdb=0\b/);
            }
        );
        it(
            "should respond with a predictable message when \"list\" called with too many parameters",
            async() => {
                const response: any = await sendCommand(
                    client,
                    [
                        "client",
                        "list",
                        "test",
                        "two"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR syntax error");
            }
        );
    }
);
