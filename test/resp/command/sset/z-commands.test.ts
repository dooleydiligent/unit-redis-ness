import {expect} from "chai";
import "mocha";
import * as net from "net";
import * as sinon from "sinon";
import {RespServer} from "../../../../src/server/resp-server";
import {sendCommand} from "../../../common.test";

/**
 * These tests are modeled directly after the original
 * node sorted-set https://www.npmjs.com/package/sorted-map by eli skaggs,
 * since that code has been recast in Typescript and included here
 * as SortedSet();
 */
describe(
    "z-command tests",
    () => {
        let respServer: RespServer;
        const client: net.Socket = new net.Socket();
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
            "should support basic operations",
            async() => {
                const uniqueZkey = `key${new Date().getTime()}`;
                let response: any = await sendCommand(
                    client,
                    [
                        "zrange",
                        "testkey",
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER)
                    ]
                );
                expect(response).to.eql([]);
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        "testkey",
                        "14",
                        "__proto__"
                    ]
                );
                expect(response).to.equal(1);

                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "8",
                        "5a600e16"
                    ]
                );
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "9",
                        "5a600e17"
                    ]
                );
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "10",
                        "5a600e18"
                    ]
                );
                expect(response).to.equal(1);

                response = await sendCommand(
                    client,
                    [
                        "zcard",
                        uniqueZkey
                    ]
                );
                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER),
                        "withScores"
                    ]
                );
                expect(response).to.eql([
                    "5a600e16",
                    "8",
                    "5a600e17",
                    "9",
                    "5a600e18",
                    "10"
                ]);

                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "12",
                        "5a600e17"
                    ]
                );
                expect(response).to.equal(0);

                response = await sendCommand(
                    client,
                    [
                        "zcount",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER)
                    ]
                );

                expect(response).to.equal(3);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER)
                    ]
                );
                expect(response.length).to.equal(3);
                expect(response).to.eql([
                    "5a600e16",
                    "5a600e18",
                    "5a600e17"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER),
                        "withScores"
                    ]
                );
                expect(response).to.eql([
                    "5a600e16",
                    "8",
                    "5a600e18",
                    "10",
                    "5a600e17",
                    "12"
                ]);
                response = await sendCommand(
                    client,
                    [
                        "type",
                        uniqueZkey
                    ]
                );
                expect(response).to.equal("zset");

                response = await sendCommand(
                    client,
                    [
                        "zcount",
                        uniqueZkey,
                        "-Infinity",
                        "10"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "zcount",
                        uniqueZkey,
                        "Negative One",
                        "10"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR min or max is not a float");
                // Report syntax error
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER),
                        "with Scores"
                    ]
                );
                expect(response).to.eql("ReplyError: ERR syntax error");
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String("Number.MIN_SAFE_INTEGER"),
                        String(Number.MAX_SAFE_INTEGER),
                        "withScores"
                    ]
                );
                expect(response).to.eql("ReplyError: ERR value is not an integer or out of range");
                // Remove members without removing keys
                response = await sendCommand(
                    client,
                    [
                        "zrem",
                        uniqueZkey,
                        "does not exist",
                        "5a600e16",
                        "5a600e18",
                        "5a600e17"
                    ]
                );
                expect(response).to.equal(3);
                // Unexpectedly, redis removes the key when the last element is removed
                response = await sendCommand(
                    client,
                    [
                        "exists",
                        uniqueZkey
                    ]
                );
                console.log(`searched for ${uniqueZkey}`);
                expect(response).to.equal(0);
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER),
                        "withScores"
                    ]
                );
                expect(response).to.eql([]);
            }
        );
        it(
            "should increase rank",
            async() => {
                const uniqueZkey = `incrkey${new Date().getTime()}`;
                let response: any;
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "1",
                        "first"
                    ]
                );
                expect(response).to.eql(1);
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "2",
                        "second"
                    ]
                );
                expect(response).to.eql(1);
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "3",
                        "third"
                    ]
                );
                expect(response).to.eql(1);
                response = await sendCommand(
                    client,
                    [
                        "zadd",
                        uniqueZkey,
                        "4",
                        "fourth"
                    ]
                );
                expect(response).to.eql(1);

                response = await sendCommand(
                    client,
                    [
                        "zincrby",
                        uniqueZkey,
                        "2",
                        "first"
                    ]
                );
                expect(response).to.equal("3");

                /*
                 * Validate zscore
                 * Response = await sendCommand(client, ['zscore', uniqueZkey, 'first']);
                 * Expect(response).to.equal('3');
                 * Response = await sendCommand(client, ['zscore', uniqueZkey, 'second']);
                 * Expect(response).to.equal('2');
                 * Response = await sendCommand(client, ['zscore', uniqueZkey, 'third']);
                 * Expect(response).to.equal('3');
                 * Response = await sendCommand(client, ['zscore', uniqueZkey, 'fourth']);
                 * Expect(response).to.equal('4');
                 *
                 */
                response = await sendCommand(
                    client,
                    [
                        "zrank",
                        uniqueZkey,
                        "first"
                    ]
                );
                expect(response).to.equal(1);
                response = await sendCommand(
                    client,
                    [
                        "zrank",
                        uniqueZkey,
                        "second"
                    ]
                );
                expect(response).to.equal(0);
                response = await sendCommand(
                    client,
                    [
                        "zrank",
                        uniqueZkey,
                        "third"
                    ]
                );
                expect(response).to.equal(2);
                response = await sendCommand(
                    client,
                    [
                        "zrank",
                        uniqueZkey,
                        "fourth"
                    ]
                );
                expect(response).to.equal(3);
                // Expect(response).to.match(/^ReplyError: ERR unknown command.*/);

                response = await sendCommand(
                    client,
                    [
                        "zincrby",
                        uniqueZkey,
                        "-20",
                        "fourth"
                    ]
                );
                expect(response).to.equal("-16");
                response = await sendCommand(
                    client,
                    [
                        "zincrby",
                        uniqueZkey,
                        `-${Number.MIN_SAFE_INTEGER + 1}.${Number.MAX_SAFE_INTEGER}`,
                        "fourth"
                    ]
                );
                expect(response).to.equal("ReplyError: ERR value is not a valid float");

                // Should create a key if it doesn't exist
                response = await sendCommand(
                    client,
                    [
                        "zincrby",
                        uniqueZkey,
                        "-20",
                        "fifth"
                    ]
                );
                expect(response).to.equal("-20");
                response = await sendCommand(
                    client,
                    [
                        "zrange",
                        uniqueZkey,
                        String(Number.MIN_SAFE_INTEGER),
                        String(Number.MAX_SAFE_INTEGER),
                        "withScores"
                    ]
                );
                expect(response).to.eql([
                    "fifth",
                    "-20",
                    "fourth",
                    "-16",
                    "second",
                    "2",
                    "first",
                    "3",
                    "third",
                    "3"
                ]);
            }
        );
    }
);
