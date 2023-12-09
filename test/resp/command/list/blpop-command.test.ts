import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "blpop-command test",
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
            "should return NIL when timeout > 0 and list does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "blpop",
                        "no-key",
                        "1"
                    ]
                );
                expect(response).to.equal(null);
            }
        );
        it(
            "should wait for a list to exist and return the list name and value",
            (done) => {
                sendCommand(
                    client,
                    [
                        "blpop",
                        "no-key",
                        "0"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.eql([
                            "no-key",
                            "THE NEW VALUE"
                        ]);
                        done();
                    });
                sendCommand(
                    new net.Socket(),
                    [
                        "lpush",
                        "no-key",
                        "THE NEW VALUE"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.equal(1);
                    });
            }
        );
        it(
            "should return the list name and HEAD value",
            (done) => {
                sendCommand(
                    client,
                    [
                        "blpop",
                        "no-key2",
                        "0"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.eql([
                            "no-key2",
                            "first"
                        ]);
                        done();
                    });
                sendCommand(
                    new net.Socket(),
                    [
                        "lpush",
                        "no-key2",
                        "third",
                        "second",
                        "first"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.equal(3);
                    });
            }
        );
        it(
            "should support blocking lpop against multiple lists in one call",
            (done) => {
                sendCommand(
                    client,
                    [
                        "blpop",
                        "list1",
                        "list2",
                        "list3",
                        "0"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.eql([
                            "list2",
                            "THE NEW VALUE"
                        ]);
                        done();
                    });
                sendCommand(
                    new net.Socket(),
                    [
                        "lpush",
                        "list2",
                        "THE NEW VALUE"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.equal(1);
                    });
            }
        );
        it(
            "should return the pushd value when it already exists even if a timeout is set",
            (done) => {
                const uniqueKey = `poplpush${new Date().getTime()}`;
                sendCommand(
                    new net.Socket(),
                    [
                        "lpush",
                        uniqueKey,
                        "third",
                        "second",
                        "first"
                    ]
                ).
                    then((response: any) => {
                        expect(response).to.equal(3);
                        sendCommand(
                            client,
                            [
                                "blpop",
                                uniqueKey,
                                "0"
                            ]
                        ).
                            then((response: any) => {
                                expect(response).to.eql([
                                    uniqueKey,
                                    "first"
                                ]);
                                done();
                            });
                    });
            }
        );
    }
);
