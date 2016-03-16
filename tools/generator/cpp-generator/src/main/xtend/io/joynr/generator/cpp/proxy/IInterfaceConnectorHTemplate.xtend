package io.joynr.generator.cpp.proxy
/*
 * !!!
 *
 * Copyright (C) 2011 - 2015 BMW Car IT GmbH
 *
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
 */

import com.google.inject.Inject
import com.google.inject.assistedinject.Assisted
import io.joynr.generator.cpp.util.CppStdTypeUtil
import io.joynr.generator.cpp.util.InterfaceSubscriptionUtil
import io.joynr.generator.cpp.util.JoynrCppGeneratorExtensions
import io.joynr.generator.cpp.util.TemplateBase
import io.joynr.generator.templates.InterfaceTemplate
import io.joynr.generator.templates.util.NamingUtil
import org.franca.core.franca.FInterface

class IInterfaceConnectorHTemplate extends InterfaceTemplate {
	@Inject	extension JoynrCppGeneratorExtensions
	@Inject extension TemplateBase
	@Inject private CppStdTypeUtil cppStdTypeUtil
	@Inject private extension NamingUtil

	@Inject extension InterfaceSubscriptionUtil
	@Inject
	new(@Assisted FInterface francaIntf) {
		super(francaIntf)
	}

	override generate()
'''
«val interfaceName = serviceInterface.joynrName»
«val headerGuard = ("GENERATED_INTERFACE_"+getPackagePathWithJoynrPrefix(serviceInterface, "_")+
	"_I"+interfaceName+"Connector_h").toUpperCase»
«warning()»

#ifndef «headerGuard»
#define «headerGuard»

«getDllExportIncludeStatement()»
«FOR parameterType: cppStdTypeUtil.getRequiredIncludesFor(serviceInterface)»
	#include «parameterType»
«ENDFOR»

#include "«getPackagePathWithJoynrPrefix(serviceInterface, "/")»/I«interfaceName».h"
#include "joynr/ISubscriptionListener.h"
#include "joynr/SubscriptionCallback.h"
#include "joynr/IConnector.h"
#include "joynr/TypeUtil.h"
#include <memory>

namespace joynr {
	template <class ... Ts> class ISubscriptionListener;
	class ISubscriptionCallback;
	class SubscriptionQos;
	class OnChangeSubscriptionQos;
} // namespace joynr

«getNamespaceStarter(serviceInterface)»
class «getDllExportMacro()» I«interfaceName»Subscription{
	/**
	  * in  - subscriptionListener      std::shared_ptr to a SubscriptionListener which will receive the updates.
	  * in  - subscriptionQos           SubscriptionQos parameters like interval and end date.
	  * out - assignedSubscriptionId    Buffer for the assigned subscriptionId.
	  */
public:
	virtual ~I«interfaceName»Subscription() = default;

	«produceSubscribeUnsubscribeMethods(serviceInterface, true)»
};

class «getDllExportMacro()» I«interfaceName»Connector: virtual public I«interfaceName», public joynr::IConnector, virtual public I«interfaceName»Subscription{

public:
	~I«interfaceName»Connector() override = default;
};

«getNamespaceEnder(serviceInterface)»
#endif // «headerGuard»
'''
}
