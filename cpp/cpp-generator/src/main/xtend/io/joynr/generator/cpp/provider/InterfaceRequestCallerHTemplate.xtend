package io.joynr.generator.cpp.provider
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
import io.joynr.generator.cpp.util.JoynrCppGeneratorExtensions
import io.joynr.generator.cpp.util.TemplateBase
import io.joynr.generator.util.InterfaceTemplate
import org.franca.core.franca.FInterface
import org.franca.core.franca.FMethod

class InterfaceRequestCallerHTemplate implements InterfaceTemplate{

	@Inject
	private extension TemplateBase

	@Inject
	private extension JoynrCppGeneratorExtensions

	override generate(FInterface serviceInterface) {
		val interfaceName = serviceInterface.joynrName
		val headerGuard = ("GENERATED_INTERFACE_"+getPackagePathWithJoynrPrefix(serviceInterface, "_")+"_"+interfaceName+"RequestCaller_h").toUpperCase
		'''
		«warning()»
		#include <functional>

		#ifndef «headerGuard»
		#define «headerGuard»

		#include "joynr/PrivateCopyAssign.h"
		«getDllExportIncludeStatement()»
		#include "joynr/RequestCaller.h"
		#include "«getPackagePathWithJoynrPrefix(serviceInterface, "/")»/I«interfaceName».h"
		#include <QSharedPointer>

		«getNamespaceStarter(serviceInterface)»

		class «interfaceName»Provider;

		class «getDllExportMacro()» «interfaceName»RequestCaller : public joynr::RequestCaller {
		public:
			explicit «interfaceName»RequestCaller(QSharedPointer<«interfaceName»Provider> provider);

			virtual ~«interfaceName»RequestCaller(){}

			«FOR attribute: getAttributes(serviceInterface)»
				«val attributeName = attribute.joynrName»
				«val returnType = getMappedDatatypeOrList(attribute)»
				virtual void get«attributeName.toFirstUpper»(
						std::function<void(
								const joynr::RequestStatus& status,
								const «returnType»& «attributeName.toFirstLower»)> callbackFct);
				virtual void set«attributeName.toFirstUpper»(
						«returnType» «attributeName.toFirstLower»,
						std::function<void(const joynr::RequestStatus& status)> callbackFct);

			«ENDFOR»
			«FOR method: getMethods(serviceInterface)»
				«method.createRequestCallerSignature»

			«ENDFOR»
			void registerAttributeListener(const QString& attributeName, joynr::IAttributeListener* attributeListener);
			void unregisterAttributeListener(const QString& attributeName, joynr::IAttributeListener* attributeListener);

			void registerBroadcastListener(const QString& broadcastName, joynr::IBroadcastListener* broadcastListener);
			void unregisterBroadcastListener(const QString& broadcastName, joynr::IBroadcastListener* broadcastListener);

		private:
			DISALLOW_COPY_AND_ASSIGN(«interfaceName»RequestCaller);
			QSharedPointer<«getPackagePathWithJoynrPrefix(serviceInterface, "::")»::«interfaceName»Provider> provider;
		};

		«getNamespaceEnder(serviceInterface)»
		#endif // «headerGuard»
		'''
	}
	def createRequestCallerSignature(FMethod method)
'''
	«val outputTypedParamList = prependCommaIfNotEmpty(getCommaSeperatedConstTypedOutputParameterList(method))»
	«val inputTypedParamList = getCommaSeperatedTypedParameterList(method)»
	virtual void «method.joynrName»(
			«IF !method.inputParameters.empty»«inputTypedParamList»,«ENDIF»
			std::function<void(const joynr::RequestStatus& joynrInternalStatus«outputTypedParamList»)> callbackFct);
'''
}
