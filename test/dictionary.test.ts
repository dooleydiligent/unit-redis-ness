import {expect} from "chai";
import "mocha";
import * as sinon from "sinon";
import {Dictionary} from "../src/dictionary";

describe(
    "dictionary test",
    () => {
        let dictionary: Dictionary<string, any>;
        beforeEach(() => {
            dictionary = new Dictionary();
            sinon.createSandbox();
        });

        afterEach(() => {
            sinon.restore();
        });

        after(async() => {
        });

        it(
            "should construct",
            async() => {
                expect(dictionary.constructor.name).to.equal("Dictionary");
            }
        );
        it(
            "should implement basic put/get/remove/size/clear/contains/exists/keys/values functionality",
            () => {
                dictionary.put(
                    "item",
                    "one"
                );
                expect(dictionary.exists("item")).to.equal(true);
                expect(dictionary.exists("one")).to.equal(false);
                expect(dictionary.get("item")).to.equal("one");
                expect(dictionary.size()).to.equal(1);
                expect(dictionary.contains("one")).to.equal(true);
                expect(dictionary.keys().length).to.equal(1);
                expect(dictionary.values().length).to.equal(1);
                dictionary.put(
                    "item",
                    "two"
                );
                expect(dictionary.get("item")).to.equal("two");
                dictionary.put(
                    "one",
                    {"embedded": true}
                );
                dictionary.remove("three");
                expect(dictionary.size()).to.equal(2);
                let foundTwo = false;
                for (const each of dictionary) {
                    if (!foundTwo) {
                        expect(each).to.equal("two");
                        foundTwo = true;
                    } else {
                        expect(each).to.eql({"embedded": true});
                    }
                }
                dictionary.remove("item");
                expect(dictionary.size()).to.equal(1);
                dictionary.clear();
                expect(dictionary.size()).to.equal(0);
            }
        );
    }
);
