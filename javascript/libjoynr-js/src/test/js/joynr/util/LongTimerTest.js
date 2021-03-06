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
const LongTimer = require("../../../../main/js/joynr/util/LongTimer");
const Typing = require("../../../../main/js/joynr/util/Typing");

const maxPow = 35; // make sure this is at lease 31 to test cases with long timeout (> Math.pow(2, 31)-1)
const concurrentTimeouts = 10;
const testIntervals = 10;

describe("libjoynr-js.joynr.LongTimer.Timeout", () => {
    function testCallTimeout(timeout) {
        jasmine.clock().uninstall();
        jasmine.clock().install();
        const timeoutSpy = jasmine.createSpy("timeoutSpy");
        LongTimer.setTimeout(timeoutSpy, timeout);
        jasmine.clock().tick(timeout - 1);
        expect(timeoutSpy).not.toHaveBeenCalled();
        jasmine.clock().tick(1);
        expect(timeoutSpy).toHaveBeenCalled();
        expect(timeoutSpy.calls.count()).toEqual(1);
    }

    function testCancelTimeout(timeout) {
        jasmine.clock().uninstall();
        jasmine.clock().install();
        const timeoutSpy = jasmine.createSpy("timeoutSpy");
        const timeoutId = LongTimer.setTimeout(timeoutSpy, timeout);
        jasmine.clock().tick(timeout - 1);
        expect(timeoutSpy).not.toHaveBeenCalled();
        LongTimer.clearTimeout(timeoutId);
        jasmine.clock().tick(1);
        expect(timeoutSpy).not.toHaveBeenCalled();
    }

    beforeEach(done => {
        jasmine.clock().install();
        done();
    });

    afterEach(done => {
        jasmine.clock().uninstall();
        done();
    });

    it("provides a timeoutId", done => {
        const timeoutId = LongTimer.setTimeout(() => {}, 0);
        expect(timeoutId).toBeDefined();
        expect(Typing.getObjectType(timeoutId)).toEqual("FakeTimeout");
        LongTimer.clearTimeout(timeoutId);
        done();
    });

    it("calls timeout function at correct time", done => {
        let i;
        for (i = 0; i < maxPow; ++i) {
            testCallTimeout(Math.pow(2, i));
        }
        done();
    });

    it("calls concurrent timeouts correctly", done => {
        let i, j;

        const spyArray = [];
        for (i = 1; i <= concurrentTimeouts; ++i) {
            spyArray.push(`timeout${i}`);
        }
        const spy = jasmine.createSpyObj("spy", spyArray);

        // register spy[i] at i ms and check that no spy has been called
        for (i = 1; i <= concurrentTimeouts; ++i) {
            LongTimer.setTimeout(spy[`timeout${i}`], i);
        }

        // check that spies have been called correctly
        for (j = 0; j <= concurrentTimeouts; ++j) {
            // check if spys have been called correctly
            for (i = 1; i <= concurrentTimeouts; ++i) {
                let e = expect(spy[`timeout${i}`]);
                if (i > j) {
                    e = e.not;
                }
                e.toHaveBeenCalled();
            }

            // forward time 1 ms
            jasmine.clock().tick(1);
        }
        done();
    });

    it("cancels timeout correctly", done => {
        let i;
        for (i = 0; i < maxPow; ++i) {
            testCancelTimeout(Math.pow(2, i));
        }
        done();
    });

    it("calls target function with provided arguments", done => {
        const timeoutSpy = jasmine.createSpy("timeoutSpy");
        const arg1 = "arg1";
        const arg2 = "arg2";
        const timeout = 1000;
        LongTimer.setTimeout(timeoutSpy, timeout, arg1, arg2);
        jasmine.clock().tick(timeout - 1);
        expect(timeoutSpy).not.toHaveBeenCalled();
        jasmine.clock().tick(1);
        expect(timeoutSpy).toHaveBeenCalled();
        expect(timeoutSpy.calls.count()).toEqual(1);
        expect(timeoutSpy.calls.mostRecent().args[0]).toEqual(arg1);
        expect(timeoutSpy.calls.mostRecent().args[1]).toEqual(arg2);
        done();
    });
});

describe("libjoynr-js.joynr.LongTimer.Interval", () => {
    function testCallInterval(interval) {
        let i;
        jasmine.clock().uninstall();
        jasmine.clock().install();
        const intervalSpy = jasmine.createSpy("intervalSpy");
        LongTimer.setInterval(intervalSpy, interval);
        expect(intervalSpy).not.toHaveBeenCalled();
        for (i = 0; i < testIntervals; ++i) {
            jasmine.clock().tick(interval - 1);
            expect(intervalSpy.calls.count()).toEqual(i);
            jasmine.clock().tick(1);
            expect(intervalSpy.calls.count()).toEqual(i + 1);
            expect(intervalSpy).toHaveBeenCalled();
        }
    }

    function testCancelInterval(interval) {
        jasmine.clock().uninstall();
        jasmine.clock().install();
        const intervalSpy = jasmine.createSpy("intervalSpy");
        const intervalId = LongTimer.setInterval(intervalSpy, interval);

        jasmine.clock().tick(interval);

        expect(intervalSpy).toHaveBeenCalled();
        expect(intervalSpy.calls.count()).toEqual(1);

        LongTimer.clearInterval(intervalId);
        jasmine.clock().tick(testIntervals * interval);

        expect(intervalSpy.calls.count()).toEqual(1);
    }

    beforeEach(done => {
        jasmine.clock().install();
        done();
    });

    afterEach(done => {
        jasmine.clock().uninstall();
        done();
    });

    it("provides an intervalId", done => {
        const intervalId = LongTimer.setInterval(() => {}, 0);
        expect(intervalId).toBeDefined();
        expect(Typing.getObjectType(intervalId)).toEqual("Number");
        done();
    });

    it("calls interval function at correct times", done => {
        let i;
        for (i = 0; i < maxPow; ++i) {
            testCallInterval(Math.pow(2, i));
        }
        done();
    });

    it("calls concurrent timeouts correctly", done => {
        let i, j;

        const spyArray = [];
        for (i = 1; i <= concurrentTimeouts; ++i) {
            spyArray.push(`timeout${i}`);
        }
        const spy = jasmine.createSpyObj("spy", spyArray);

        // register spy[i] at i ms and check that no spy has been called
        for (i = 1; i <= concurrentTimeouts; ++i) {
            LongTimer.setTimeout(spy[`timeout${i}`], i);
        }

        // check that spies have been called correctly
        for (j = 0; j <= concurrentTimeouts; ++j) {
            // check if spys have been called correctly
            for (i = 1; i <= concurrentTimeouts; ++i) {
                let e = expect(spy[`timeout${i}`]);
                if (i > j) {
                    e = e.not;
                }
                e.toHaveBeenCalled();
            }

            // forward time 1 ms
            jasmine.clock().tick(1);
        }
        done();
    });

    it("cancells timeout correctly", done => {
        let i;
        for (i = 0; i < maxPow; ++i) {
            testCancelInterval(Math.pow(2, i));
        }
        done();
    });
});
