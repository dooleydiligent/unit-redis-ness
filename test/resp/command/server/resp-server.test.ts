import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe.only(
    "resp-server test",
    () => {
        let client: net.Socket,
            respServer: RespServer;
        beforeEach(() => {
            sinon.createSandbox();
        });
        afterEach(() => {
            sinon.restore();
        });

        describe(
            "server start and stop tests",
            () => {
                /**
                 * Functional testing of start/stop behavior
                 */
                it(
                    "should instantiate",
                    async() => {
                        respServer = new RespServer();
                        expect(respServer.constructor.name).to.equal("RespServer");
                    }
                );
                it(
                    "should emit \"ready\" on startup",
                    (done) => {
                        respServer.on(
                            "ready",
                            () => {
                                done();
                            }
                        );
                        respServer.start();
                    }
                );
                it(
                    "should emit \"closed\" on shutdown",
                    (done) => {
                        respServer.on(
                            "closed",
                            () => {
                                done();
                            }
                        );
                        respServer.stop();
                    }
                );
                it(
                    "should accept connections on default ${env.REDIS_HOST}:${env.REDIS_PORT}",
                    (done) => {
                        respServer = new RespServer();
                        respServer.on(
                            "ready",
                            () => {
                                const client = new net.Socket();
                                client.on(
                                    "ready",
                                    (data: any) => {
                                        respServer.on(
                                            "closed",
                                            () => {
                                                done();
                                            }
                                        );
                                        respServer.stop();
                                    }
                                );
                                client.on(
                                    "connect",
                                    (data: any) => {
                                    }
                                );
                                client.on(
                                    "error",
                                    (err) => {
                                        fail(
                                            "Unexpected error during connection",
                                            err.stack
                                        );
                                    }
                                );
                                client.connect(
                                    Number(process.env.REDIS_PORT || 6379),
                                    process.env.REDIS_HOST || "localhost",
                                    () => {
                                    }
                                );
                            }
                        );
                        respServer.start();
                    }
                );
                xit(
                    "should accept connections on alternate ${env.REDIS_PORT}",
                    (done) => {
                        process.env.REDIS_PORT = "1235";
                        respServer = new RespServer();
                        respServer.on(
                            "ready",
                            () => {
                                const client = new net.Socket();
                                client.on(
                                    "ready",
                                    (data: any) => {
                                        respServer.on(
                                            "closed",
                                            () => {
                                                done();
                                            }
                                        );
                                        respServer.stop();
                                    }
                                );
                                client.on(
                                    "connect",
                                    (data: any) => {
                                    }
                                );
                                client.on(
                                    "error",
                                    (err) => {
                                        fail(
                                            "Unexpected error during connection",
                                            err.stack
                                        );
                                    }
                                );
                                client.connect(
                                    Number(process.env.REDIS_PORT),
                                    process.env.REDIS_HOST || "localhost",
                                    () => {
                                    }
                                );
                            }
                        );
                        respServer.start();
                    }
                );
            }
        );

        /**
         * Tests of initially implemented commands
         */
        describe(
            "other server tests",
            () => {
                before((done) => {
                    respServer = new RespServer();
                    respServer.on(
                        "ready",
                        () => {
                            client = new net.Socket();
                            done();
                        }
                    );
                    respServer.start();
                });

                after(async() => {
                    await respServer.stop();
                });
                it(
                    "should respond properly to the \"ping\" command",
                    (done) => {
                        sendCommand(
                            client,
                            ["ping"]
                        ).
                            then((response) => {
                                expect(response).to.equal("PONG");
                                done();
                            });
                    }
                );
                it(
                    "should respond properly to the \"echo\" command",
                    (done) => {
                        sendCommand(
                            client,
                            [
                                "echo",
                                "test"
                            ]
                        ).
                            then((response) => {
                                expect(response).to.equal("test");
                                done();
                            });
                    }
                );
                it(
                    "should respond with \"ERR\" when echo command has no parameters",
                    async() => {
                        // Note that 'ReplyError:' is supplied by the redis parser, NOT by the code under test
                        const response = await sendCommand(
                            client,
                            ["echo"]
                        );
                        expect(response).to.equal("ReplyError: ERR wrong number of arguments for 'echo' command");
                    }
                );
                it(
                    "should respond with \"ERR\" when echo command has two or more parameters",
                    (done) => {
                        sendCommand(
                            client,
                            [
                                "echo",
                                "one",
                                "two"
                            ]
                        ).
                            then((response) => {
                                expect(response).to.equal("ReplyError: ERR wrong number of arguments for 'echo' command");
                                done();
                            });
                    }
                );
                it(
                    "should respond to the \"time\" command with an array of two strings",
                    (done) => {
                        // Note: we use hrtime which should already do what we need so we don't validate
                        sendCommand(
                            client,
                            ["time"]
                        ).
                            then((response: any) => {
                                expect(response).to.be.an("array");
                                expect(response.length).to.equal(2);
                                expect(parseInt(
                                    response[0],
                                    10
                                )).to.be.greaterThan(0);
                                expect(parseInt(
                                    response[1],
                                    10
                                )).to.be.greaterThan(0);
                                done();
                            });
                    }
                );
                it(
                    "should respond with nulCommand when the command is not known",
                    (done) => {
                        sendCommand(
                            client,
                            [
                                "felix",
                                "the",
                                "cat"
                            ]
                        ).
                            then((response: any) => {
                                expect(response).to.match(/^ReplyError: ERR unknown command.*/);
                                done();
                            });
                    }
                );
                it(
                    "should implement the info command",
                    async() => {
                        const response: any = await sendCommand(
                            client,
                            ["info"]
                        );
                        expect(response).to.match(/^# server\r\nredis_version:.*/im);
                    }
                );
                it(
                    "should implement the SET command",
                    (done) => {
                        sendCommand(
                            client,
                            [
                                "SET",
                                "this",
                                "that"
                            ]
                        ).
                            then((response: any) => {
                                expect(response).to.equal("OK");
                                sendCommand(
                                    client,
                                    [
                                        "GET",
                                        "this"
                                    ]
                                ).
                                    then((getresponse: any) => {
                                        expect(getresponse).to.equal("that");
                                        done();
                                    });
                            });
                    }
                );
                it(
                    "should return nil string when GET is invoked with unknown parameters",
                    (done) => {
                        sendCommand(
                            client,
                            [
                                "GET",
                                " "
                            ]
                        ).
                            then((getresponse: any) => {
                                expect(getresponse).to.equal(null);
                                done();
                            });
                    }
                );
                it(
                    "should implement the info command with a known parameter",
                    (done) => {
                        sendCommand(
                            client,
                            [
                                "info",
                                "memory"
                            ]
                        ).
                            then((response: any) => {
                                expect(response).to.match(/^# memory.*/mi);
                                done();
                            });
                    }
                );
                it(
                    "should not respond when info is called with an unknown paramter",
                    async() => {
                        const response = await sendCommand(
                            client,
                            [
                                "info",
                                "juicy"
                            ]
                        );
                        // Don't know how to send an empty - non-null string response yet
                        expect(String(response).trim()).to.equal("");
                    }
                );
                it(
                    "should report the number of keys in the current database",
                    async() => {
                        const response: any = await sendCommand(
                            client,
                            ["dbsize"]
                        );
                        expect(response).to.be.a("number");
                        expect(response).to.be.greaterThan(0);
                    }
                );
                it(
                    "should support the \"select\" command",
                    async() => {
                        let response: any = await sendCommand(
                            client,
                            [
                                "select",
                                "12"
                            ]
                        );
                        expect(response).to.equal("OK");
                        response = await sendCommand(
                            client,
                            ["dbsize"]
                        );
                        expect(response).to.equal(0);
                    }
                );
                it(
                    "should not allow us to select an invalid database",
                    async() => {
                        let response: any = await sendCommand(
                            client,
                            [
                                "select",
                                "one"
                            ]
                        );
                        expect(response).to.equal("ReplyError: ERR invalid DB index");
                        response = await sendCommand(
                            client,
                            [
                                "select",
                                "-12"
                            ]
                        );
                        expect(response).to.equal("ReplyError: ERR DB index is out of range");
                        response = await sendCommand(
                            client,
                            [
                                "select",
                                "22"
                            ]
                        );
                        expect(response).to.equal("ReplyError: ERR DB index is out of range");
                    }
                );
                it(
                    "should respond properly to the \"quit\" command",
                    (done) => {
                        // Note however that the server does not disconnect us.  That is the client's job
                        sendCommand(
                            client,
                            ["quit"]
                        ).
                            then((response) => {
                                expect(response).to.equal("OK");
                                done();
                            });
                    }
                );
            }
        );
    }
);
