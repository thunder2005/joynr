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

define([
    "global/Promise",
    "joynr",
    "joynr/datatypes/DatatypesProxy",
    "joynr/datatypes/exampleTypes/Country",
    "integration/TestEnd2EndDatatypesTestData",
    "integration/IntegrationUtils",
    "joynr/provisioning/provisioning_cc",
    "uuid",
    "global/WaitsFor"
], function(
        Promise,
        joynr,
        DatatypesProxy,
        Country,
        TestEnd2EndDatatypesTestData,
        IntegrationUtils,
        provisioning,
        uuid,
        waitsFor) {
    describe("libjoynr-js.integration.end2end.datatypes", function() {

        var datatypesProxy, workerId;
        var testIdentifier = 0;

        beforeEach(function(done) {
            datatypesProxy = undefined;
            var provisioningSuffix = "End2EndDatatypesTest" + "-" + testIdentifier++;
            var domain = provisioningSuffix;
            var testProvisioning = IntegrationUtils.getProvisioning(provisioning, domain);
            joynr.load(testProvisioning).then(function(newJoynr){
                joynr = newJoynr;
                IntegrationUtils.initialize(joynr);

                IntegrationUtils.initializeWebWorker(
                        "TestEnd2EndDatatypesProviderWorker",
                        provisioningSuffix,
                        domain).then(function(newWorkerId) {
                    workerId = newWorkerId;
                    return IntegrationUtils.startWebWorker(workerId);
                }).then(
                        function() {
                            return IntegrationUtils.buildProxy(DatatypesProxy, domain).then(
                                    function(newDatatypesProxy) {
                                        datatypesProxy = newDatatypesProxy;
                                        done();
                                        return null;
                                    });
                        });
            }).catch(function(error){
                throw error;
            });
        });

        it("supports all datatypes in attributes get/set", function(done) {
            var i, j;

            function testAttrType(attributeName, attributeValue) {
                return new Promise(function(resolve, reject) {
                    var attribute;
                    attribute = datatypesProxy[attributeName];
                    attribute.set({
                        value : attributeValue
                    }).then(function() {
                        // get the value
                        attribute.get().then(resolve, reject);
                        return null;
                    }).catch(function(error) {
                        reject(error);
                        IntegrationUtils.outputPromiseError(error);
                    });
                });
            }

            function setAndGetAttribute(attributeName, attributeValue, promiseChain) {
                return promiseChain.then(function() {
                    var onFulfilledSpy = jasmine.createSpy("onFulfilledSpy");
                    return testAttrType(attributeName, attributeValue).then(function(value) {
                        expect(value).toEqual(attributeValue);
                        IntegrationUtils.checkValueAndType(value, attributeValue);
                    }).catch(IntegrationUtils.outputPromiseError);
                });
            }

            var promiseChain = Promise.resolve();
            for (i = 0; i < TestEnd2EndDatatypesTestData.length; ++i) {
                var test = TestEnd2EndDatatypesTestData[i];
                for (j = 0; j < test.values.length; ++j) {
                    promiseChain = setAndGetAttribute(test.attribute, test.values[j], promiseChain);
                }
            }
            promiseChain.then(function() {
                done();
                return null;
            }).catch(fail);
        }, 120000);

        it("supports all datatypes as operation arguments", function(done) {
            var i;

            function testGetJavascriptType(arg, expectedReturnValue, promiseChain) {

                return promiseChain.then(function() {
                    var onFulfilledSpy;
                    onFulfilledSpy = jasmine.createSpy("onFulfilledSpy");
                    datatypesProxy.getJavascriptType({
                        arg : arg
                    }).then(onFulfilledSpy).catch(IntegrationUtils.outputPromiseError);

                    return waitsFor(function() {
                        return onFulfilledSpy.calls.count() > 0;
                    }, "operation is called", provisioning.ttl).then(function() {
                        expect(onFulfilledSpy).toHaveBeenCalled();
                        expect(onFulfilledSpy).toHaveBeenCalledWith({
                            javascriptType : expectedReturnValue
                        });
                    });
                });
            }

            var promiseChain = Promise.resolve();
            for (i = 0; i < TestEnd2EndDatatypesTestData.length; ++i) {
                var test = TestEnd2EndDatatypesTestData[i];
                promiseChain = testGetJavascriptType(test.values[0], test.jsRuntimeType, promiseChain);
            }
            promiseChain.then(function() {
                done();
                return null;
            }).catch(fail);
        }, 60000);

        it("supports all datatypes as operation argument and return value", function(done) {
            var i;

            function testGetArgumentBack(arg, promiseChain) {
                return promiseChain.then(function() {
                    return datatypesProxy.getArgumentBack({
                        arg : arg
                    }).then(function(value) {
                        expect(value).toEqual({ returnValue : arg });
                        IntegrationUtils.checkValueAndType(value.returnValue, arg);
                    }).catch(IntegrationUtils.outputPromiseError);
                });
            }

            var promiseChain = Promise.resolve();
            for (i = 0; i < TestEnd2EndDatatypesTestData.length; ++i) {
                var test = TestEnd2EndDatatypesTestData[i];
                promiseChain = testGetArgumentBack(test.values[0], promiseChain);
            }
            promiseChain.then(function() {
                done();
                return null;
            }).catch(fail);
        }, 60000);

        it("supports multiple operation arguments", function(done) {
            var i;

            function testMultipleArguments(opArgs) {
                var onFulfilledSpy;

                onFulfilledSpy = jasmine.createSpy("onFulfilledSpy");
                datatypesProxy.multipleArguments(opArgs).then(
                        onFulfilledSpy).catch(IntegrationUtils.outputPromiseError);

                return waitsFor(function() {
                    return onFulfilledSpy.calls.count() > 0;
                }, "operation is called", provisioning.ttl).then(function() {
                    expect(onFulfilledSpy).toHaveBeenCalled();
                    expect(onFulfilledSpy).toHaveBeenCalledWith({
                        serialized : JSON.stringify(opArgs)
                    });
                });
            }

            var opArgs = {};
            for (i = 0; i < TestEnd2EndDatatypesTestData.length; ++i) {
                var test = TestEnd2EndDatatypesTestData[i];
                /* replace all dots with _ */
                var paramName = test.joynrType.replace(/\./g, "_") + "Arg";
                paramName = paramName.slice(0, 1).toLowerCase() + paramName.slice(1);
                opArgs[paramName] = test.values[0];
            }
            testMultipleArguments(opArgs).then(function() {
                done();
                return null;
            }).catch(fail);
        }, 60000);

        afterEach(function(done) {
            IntegrationUtils.shutdownWebWorker(workerId).then(IntegrationUtils.shutdownLibjoynr).then(function() {
                done();
                return null;
            }).catch(fail);
        });
    });
});
