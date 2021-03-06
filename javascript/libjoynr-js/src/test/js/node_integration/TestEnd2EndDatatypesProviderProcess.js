/* domain: true, interfaceNameDatatypes: true, globalCapDirCapability: true, channelUrlDirCapability: true */

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

const ChildProcessUtils = require("./ChildProcessUtils");

// anything that you load here is served through the jsTestDriverServer, if you add an entry you
// have to make it available through the jsTestDriverIntegrationTests.conf
const joynr = require("joynr");
const provisioning = require("../../resources/joynr/provisioning/provisioning_cc.js");

const DatatypesProvider = require("../../generated/joynr/datatypes/DatatypesProvider.js");
const TestEnd2EndDatatypesTestData = require("./TestEnd2EndDatatypesTestData");

let providerDomain;

// attribute values for provider
let currentAttributeValue;

let datatypesProvider;

let providerQos;

function getObjectType(obj) {
    if (obj === null || obj === undefined) {
        throw new Error("cannot determine the type of an undefined object");
    }
    const funcNameRegex = /function ([$\w]+)\(/;
    const results = funcNameRegex.exec(obj.constructor.toString());
    return results && results.length > 1 ? results[1] : "";
}

function getter() {
    return currentAttributeValue;
}

function setter(value) {
    currentAttributeValue = value;
}

function initializeTest(provisioningSuffix, providedDomain) {
    providerDomain = providedDomain;
    provisioning.persistency = "localStorage";
    provisioning.channelId = `End2EndDatatypesTestParticipantId${provisioningSuffix}`;

    joynr.selectRuntime("inprocess");
    return joynr
        .load(provisioning)
        .then(newJoynr => {
            providerQos = new joynr.types.ProviderQos({
                customParameters: [],
                priority: Date.now(),
                scope: joynr.types.ProviderScope.GLOBAL,
                supportsOnChangeSubscriptions: true
            });

            // build the provider
            datatypesProvider = joynr.providerBuilder.build(DatatypesProvider, {});

            let i;
            // there are so many attributes for testing different datatypes => register them
            // all by cycling over their names in the attribute
            for (i = 0; i < TestEnd2EndDatatypesTestData.length; ++i) {
                const attribute = datatypesProvider[TestEnd2EndDatatypesTestData[i].attribute];
                attribute.registerGetter(getter);
                attribute.registerSetter(setter);
            }

            // registering operation functions
            datatypesProvider.getJavascriptType.registerOperation(opArgs => {
                return {
                    javascriptType: getObjectType(opArgs.arg)
                };
            });
            datatypesProvider.getArgumentBack.registerOperation(opArgs => {
                return {
                    returnValue: opArgs.arg
                };
            });
            datatypesProvider.multipleArguments.registerOperation(opArgs => {
                return {
                    serialized: JSON.stringify(opArgs)
                };
            });

            // register provider at the given domain
            return newJoynr.registration.registerProvider(providerDomain, datatypesProvider, providerQos).then(() => {
                return Promise.resolve(newJoynr);
            });
        })
        .catch(error => {
            throw error;
        });
}

function startTest() {
    // nothing to do here, everything is already performed in initialize
    return Promise.resolve();
}

function terminateTest() {
    return joynr.registration.unregisterProvider(providerDomain, datatypesProvider);
}

ChildProcessUtils.registerHandlers(initializeTest, startTest, terminateTest);
