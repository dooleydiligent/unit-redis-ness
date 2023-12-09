import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "publish/subscribe test",
    () => {
        let respServer: RespServer,
            client: net.Socket = new net.Socket(),
            response: any;
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
        it(
            "should return ZERO when a message is published to a channel without subscribers",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "publish",
                        "channel",
                        "Hollow world!"
                    ]
                );
                expect(response).to.equal(0);
            }
        );
        it(
            "should unsubscribe from a channel that it is not subscribed to",
            async() => {
                // Sound's weird, but this is observed behavior
                response = await sendCommand(
                    client,
                    [
                        "unsubscribe",
                        "some channel"
                    ]
                );
                expect(response).to.eql([
                    "unsubscribe",
                    "some channel",
                    0
                ]);
            }
        );
        it(
            "should subscribe to an arbitrary channel",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "subscribe",
                        "arbitrary channel"
                    ]
                );
                expect(response).to.eql([
                    "subscribe",
                    "arbitrary channel",
                    1
                ]);
            }
        );
        it(
            "should report the number of currently subscribed channels",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "subscribe",
                        "another channel"
                    ]
                );
                expect(response).to.eql([
                    "subscribe",
                    "another channel",
                    2
                ]);
                response = await sendCommand(
                    client,
                    [
                        "unsubscribe",
                        "another channel"
                    ]
                );
                expect(response).to.eql([
                    "unsubscribe",
                    "another channel",
                    1
                ]);
                response = await sendCommand(
                    client,
                    [
                        "unsubscribe",
                        "arbitrary channel"
                    ]
                );
                expect(response).to.eql([
                    "unsubscribe",
                    "arbitrary channel",
                    0
                ]);
            }
        );
        it(
            "should receive separate subscribe responses and then notifications on subscribed channels",
            (done) => {
                let counter: number = 0;
                const newClient1: net.Socket = new net.Socket();
                newClient1.on(
                    "data",
                    (data: any) => {
                        /*
                         * Console.log(`Counter is ${counter}`);
                         * Console.log(`\n***Listener ${counter} received ${data.toString('utf8')}\n`);
                         */
                        switch (counter) {
                        case 0:
                            expect(data.toString("utf8")).to.equal("*3\r\n$9\r\nsubscribe\r\n$3\r\none\r\n:1\r\n*3\r\n$9\r\nsubscribe\r\n$3\r\ntwo\r\n:2\r\n*3\r\n$9\r\nsubscribe\r\n$5\r\nthree\r\n:3\r\n");
                            break;
                        case 1:
                            expect(data.toString("utf8")).to.equal("*3\r\n$7\r\nmessage\r\n$3\r\ntwo\r\n$12\r\nmessage to 2\r\n");
                            done();
                            break;
                        }
                        counter++;
                    }
                );
                sendCommand(
                    newClient1,
                    [
                        "subscribe",
                        "one",
                        "two",
                        "three"
                    ]
                ).
                    then((rsp: any) => {
                        /*
                         *        Console.log(`RESPONSE ${JSON.stringify(rsp)}`);
                         * Responses are sent in separate messages
                         */
                        expect(rsp).to.eql([
                            "subscribe",
                            "one",
                            1
                        ]);
                        const anotherClient: net.Socket = new net.Socket();
                        // Wait a tick so that the published message is received separately
                        setTimeout(
                            () => {
                                sendCommand(
                                    anotherClient,
                                    [
                                        "publish",
                                        "two",
                                        "message to 2"
                                    ]
                                ).
                                    then((rsp: any) => {
                                        expect(rsp).to.equal(1);
                                    });
                            },
                            1500
                        );
                    });
            }
        );
    }
);
