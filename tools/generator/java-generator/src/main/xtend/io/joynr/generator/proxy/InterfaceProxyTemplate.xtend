package io.joynr.generator.proxy
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
import io.joynr.generator.templates.InterfaceTemplate
import io.joynr.generator.templates.util.NamingUtil
import io.joynr.generator.util.JoynrJavaGeneratorExtensions
import io.joynr.generator.util.TemplateBase
import org.franca.core.franca.FInterface

class InterfaceProxyTemplate extends InterfaceTemplate {
	@Inject extension JoynrJavaGeneratorExtensions
	@Inject extension NamingUtil
	@Inject extension TemplateBase

	@Inject
	new(@Assisted FInterface francaIntf) {
		super(francaIntf)
	}

	override generate() {
		val interfaceName =  serviceInterface.joynrName
		val className = interfaceName + "Proxy"
		val asyncClassName = interfaceName + "Async"
		val syncClassName = interfaceName + "Sync"
		val subscriptionClassName = interfaceName + "SubscriptionInterface"
		val broadcastClassName = interfaceName + "BroadcastInterface"
		val packagePath = getPackagePathWithJoynrPrefix(serviceInterface, ".")
		'''

		«warning()»
		package «packagePath»;

		public interface «className» extends «asyncClassName», «syncClassName»«IF serviceInterface.attributes.size>0», «subscriptionClassName»«ENDIF»«IF serviceInterface.broadcasts.size>0», «broadcastClassName»«ENDIF» {
		    public static String INTERFACE_NAME = "«getPackagePathWithoutJoynrPrefix(serviceInterface, "/")»/«interfaceName»";
		}
		'''
	}

}