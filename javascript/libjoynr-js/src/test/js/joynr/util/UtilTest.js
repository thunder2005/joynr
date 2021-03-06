/*eslint no-unused-vars: "off"*/
/*
 * #%L
 * %%
 * Copyright (C) 2011 - 2017 BMW Car IT GmbH
 * %%
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * #L%
 */
require("../../node-unit-test-helper");
const UtilInternal = require("../../../../main/js/joynr/util/UtilInternal");
const Util = require("../../../../main/js/joynr/util/Util");
const JoynrMessage = require("../../../../main/js/joynr/messaging/JoynrMessage");
const RadioStation = require("../../../generated/joynr/vehicle/radiotypes/RadioStation");

describe("libjoynr-js.joynr.Util", () => {
    it("is defined and of correct type", () => {
        expect(Util).toBeDefined();
        expect(Util).not.toBeNull();
        expect(typeof Util === "object").toBeTruthy();
    });
});

describe("libjoynr-js.joynr.UtilInternal.extend", () => {
    it("extends objects", () => {
        const merged = {};

        const message = new JoynrMessage({
            type: JoynrMessage.JOYNRMESSAGE_TYPE_REQUEST
        });
        message.payload = {
            payload1: 1,
            payload2: 2
        };
        const subobject = {
            sublevel20: "sublevel20",
            sublevel21: "sublevel21"
        };

        const object1 = {
            originalField: "originalField"
        };
        const object2 = {
            message,
            number: 2.0,
            array: [1, 2, 3, 4, 5],
            string: "string",
            bool: true
        };
        const object3 = {
            level11: "level11",
            level12: subobject
        };

        UtilInternal.extend(merged, object1, object2, object3);

        expect(merged.originalField).toEqual("originalField");
        expect(merged.message).toEqual(message);
        expect(merged.level11).toEqual(object3.level11);
        expect(merged.level12).toEqual(subobject);

        expect(typeof merged.number === "number").toBeTruthy();
        expect(Array.isArray(merged.array)).toBeTruthy();
        expect(typeof merged.string === "string").toBeTruthy();
        expect(typeof merged.bool === "boolean").toBeTruthy();
    });
    it("deep extends objects", () => {
        const merged = {};

        const from = {
            subobject: {
                number: 2.0,
                array: [0, 1, 2, 3, 4],
                string: "string",
                bool: true
            }
        };

        UtilInternal.extendDeep(merged, from);

        delete from.subobject.number;
        delete from.subobject.array;
        delete from.subobject.string;
        delete from.subobject.bool;

        expect(typeof merged.subobject.number === "number").toBeTruthy();
        expect(merged.subobject.number).toEqual(2.0);

        expect(Array.isArray(merged.subobject.array)).toBeTruthy();
        expect(merged.subobject.array[0]).toEqual(0);
        expect(merged.subobject.array[1]).toEqual(1);
        expect(merged.subobject.array[2]).toEqual(2);
        expect(merged.subobject.array[3]).toEqual(3);
        expect(merged.subobject.array[4]).toEqual(4);

        expect(typeof merged.subobject.string === "string").toBeTruthy();
        expect(merged.subobject.string).toEqual("string");

        expect(typeof merged.subobject.bool === "boolean").toBeTruthy();
        expect(merged.subobject.bool).toEqual(true);
    });
});

describe("libjoynr-js.joynr.UtilInternal.transform", () => {
    it("transform array", () => {
        const postFix = "_transformed";
        const origin = [];
        const element = {
            a: "a"
        };
        origin.push(element);

        // now, let's transform
        const transformed = UtilInternal.transform(origin, (element, key) => {
            const result = {};
            for (const id in element) {
                if (element.hasOwnProperty(id)) {
                    const member = element[id];
                    result[id] = member + postFix;
                }
            }
            return result;
        });

        expect(transformed.length).toEqual(1);
        expect(transformed[0].a).toEqual(`a${postFix}`);
    });
});

describe("libjoynr-js.joynr.UtilInternal.firstLower", () => {
    it("decapitalizes first character correctly", () => {
        expect(UtilInternal.firstLower("")).toEqual("");
        expect(UtilInternal.firstLower("asdf")).toEqual("asdf");
        expect(UtilInternal.firstLower("b")).toEqual("b");
        expect(UtilInternal.firstLower("Csdf")).toEqual("csdf");
        expect(UtilInternal.firstLower("D")).toEqual("d");
        expect(UtilInternal.firstLower("ESDFASDF")).toEqual("eSDFASDF");
        expect(UtilInternal.firstLower("FsDfAsDf")).toEqual("fsDfAsDf");
        const rettyLongString =
            "RETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRING";
        expect(UtilInternal.firstLower(`P${rettyLongString}`)).toEqual(`p${rettyLongString}`);
    });

    it("throws on nullable input", () => {
        expect(() => {
            UtilInternal.firstLower(null);
        }).toThrow();
        expect(() => {
            UtilInternal.firstLower(undefined);
        }).toThrow();
    });
});

describe("libjoynr-js.joynr.UtilInternal.firstUpper", () => {
    it("capitalizes first character correctly", () => {
        expect(UtilInternal.firstUpper("")).toEqual("");
        expect(UtilInternal.firstUpper("asdf")).toEqual("Asdf");
        expect(UtilInternal.firstUpper("b")).toEqual("B");
        expect(UtilInternal.firstUpper("Csdf")).toEqual("Csdf");
        expect(UtilInternal.firstUpper("D")).toEqual("D");
        expect(UtilInternal.firstUpper("esdfasdf")).toEqual("Esdfasdf");
        expect(UtilInternal.firstUpper("fSdFaSdF")).toEqual("FSdFaSdF");
        const rettyLongString =
            "rettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstringPRETTYLONGSTRINGprettylongstring";
        expect(UtilInternal.firstUpper(`p${rettyLongString}`)).toEqual(`P${rettyLongString}`);
    });

    it("throws on nullable input", () => {
        expect(() => {
            UtilInternal.firstLower(null);
        }).toThrow();
        expect(() => {
            UtilInternal.firstLower(undefined);
        }).toThrow();
    });
});

describe("libjoynr-js.joynr.UtilInternal.isPromise", () => {
    it("returns only true if param is promis", () => {
        expect(UtilInternal.isPromise(Promise.resolve())).toBe(true);
        expect(UtilInternal.isPromise("")).toBe(false);
        expect(UtilInternal.isPromise(true)).toBe(false);
        expect(UtilInternal.isPromise()).toBe(false);
    });
});

describe("libjoynr-js.joynr.Util.ensureTypedValues", () => {
    it("types untyped objects", () => {
        let returnValue = null;
        const untypedValue = {
            name: "radioStationName",
            _typeName: "joynr.vehicle.radiotypes.RadioStation",
            byteBuffer: []
        };

        returnValue = Util.ensureTypedValues(untypedValue);
        expect(returnValue.name === untypedValue.name).toBe(true);
    });

    it("types untyped arrays", () => {
        let returnValue = null;
        const untypedArray = [
            {
                name: "radioStationName1",
                _typeName: "joynr.vehicle.radiotypes.RadioStation",
                byteBuffer: []
            },
            {
                name: "radioStationName2",
                _typeName: "joynr.vehicle.radiotypes.RadioStation",
                byteBuffer: []
            }
        ];

        returnValue = Util.ensureTypedValues(untypedArray);
        expect(returnValue[0].name === untypedArray[0].name).toBe(true);
        expect(returnValue[1].name === untypedArray[1].name).toBe(true);
    });

    it("accepts primitive types", () => {
        let returnValue = null;
        const numberValue = 1;
        const booleanValue = true;
        const stringValue = "string";

        returnValue = Util.ensureTypedValues(numberValue);
        expect(typeof returnValue === "number").toBe(true);

        returnValue = Util.ensureTypedValues(booleanValue);
        expect(typeof returnValue === "boolean").toBe(true);

        returnValue = Util.ensureTypedValues(stringValue);
        expect(typeof returnValue === "string").toBe(true);
    });
});

describe("libjoynr-js.joynr.UtilInternal.timeoutPromise", () => {
    beforeEach(() => {
        jasmine.clock().install();
    });
    afterEach(() => {
        jasmine.clock().uninstall();
    });
    it("resolves Promise normally when Promise finished before timeout", done => {
        const promise = new Promise((resolve, reject) => {
            setTimeout(resolve, 100);
        });
        UtilInternal.timeoutPromise(promise, 200)
            .then(done)
            .catch(fail);
        jasmine.clock().tick(101);
    });

    it("timeouts after before the promise resolves", done => {
        const promise = new Promise((resolve, reject) => {
            setTimeout(resolve, 200);
        });
        UtilInternal.timeoutPromise(promise, 100)
            .then(fail)
            .catch(() => done());
        jasmine.clock().tick(101);
    });
});

describe("libjoynr-js.joynr.UtilInternal.createDeferred", () => {
    it("create a correct Deferred Object", done => {
        const deferred = UtilInternal.createDeferred();
        deferred.resolve();
        deferred.promise.then(done).catch(fail);
    });
});

describe("libjoynr-js.joynr.UtilInternal.augmentConfig", () => {
    let config;
    let proxy;

    const value1 = "value1";
    const value2 = "value2";
    const value3 = "value3";

    const string1 = "string1";
    const number1 = 4;

    beforeEach(() => {
        config = {
            key1: "value1",
            key2: number1,
            keyWithObject: { key1: value1, keyWithArrayString: [string1], keyWithArrayObject: { key1: value2 } }
        };
        proxy = UtilInternal.augmentConfig(config);
    });

    it("returns undefined if parent keys are not set", () => {
        expect(proxy.a.b.c.d.e.f.g()).toBe(undefined);
        expect(proxy.key1.key2.key3()).toBe(undefined);
        expect(proxy[1][2][3][4][5]()).toBe(undefined);
    });

    it("correctly fetches keys", () => {
        expect(proxy.key1()).toEqual(value1);
        expect(proxy.key2()).toEqual(number1);
        expect(proxy.keyWithObject.keyWithArrayString[0]()).toEqual(string1);
        expect(proxy.keyWithObject.keyWithArrayObject.key1()).toEqual(value2);
    });

    it("allows keys to be inserted", () => {
        proxy.a.b.c.d.e.f = value3;
        expect(config.a.b.c.d.e.f).toEqual(value3);
        expect(proxy.a.b.c.d.e.f()).toEqual(value3);
    });
});
