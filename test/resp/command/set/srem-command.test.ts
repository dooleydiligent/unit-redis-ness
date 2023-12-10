import {fail} from "assert";
import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

describe(
    "srem-command test",
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
         * Functional testing of the srem command
         */
        it(
            "should return 0 when the set does not exist",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "srem",
                        "set",
                        "member"
                    ]
                );
                expect(response).to.equal(0);
            }
        );
        it(
            "should return only the number of existing keys that are removed",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "sadd",
                        "set",
                        "key1",
                        "key2",
                        "key3",
                        "key4"
                    ]
                );
                expect(response).to.equal(4);
                response = await sendCommand(
                    client,
                    [
                        "srem",
                        "set",
                        "key2",
                        "not",
                        "here",
                        "today",
                        "key4"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "smembers",
                        "set"
                    ]
                );
                expect(response.sort()).to.eql([
                    "key1",
                    "key3"
                ]);
            }
        );
        it(
            "should remove an empty set when all members are removed",
            async() => {
                response = await sendCommand(
                    client,
                    [
                        "srem",
                        "set",
                        "key1",
                        "key3"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        "set"
                    ]
                );
                expect(response).to.equal(0);
            }
        );
    }
);
