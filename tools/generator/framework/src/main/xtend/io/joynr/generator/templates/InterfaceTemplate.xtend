package io.joynr.generator.templates
/*
 * !!!
 *
 * Copyright (C) 2011 - 2016 BMW Car IT GmbH
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

import org.franca.core.franca.FInterface

/*
 * This is the base class used by all generation templates which process a Franca interface type
 */
abstract class InterfaceTemplate {
	protected FInterface francaIntf
	protected var majorVersion = 0
	protected var minorVersion = 0

	new(FInterface francaIntf) {
		this.francaIntf = francaIntf
		if (francaIntf.version != null) {
			majorVersion = francaIntf.version.major;
			minorVersion = francaIntf.version.minor;
		}
	}

	def CharSequence generate()
}