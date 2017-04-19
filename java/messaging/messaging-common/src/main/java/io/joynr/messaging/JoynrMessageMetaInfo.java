package io.joynr.messaging;

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

import java.io.Serializable;
import java.util.Map;

import com.google.common.collect.Maps;

import io.joynr.context.JoynrMessageScoped;

/**
 * A container object for the {@link joynr.JoynrMessage#getMessageMetaInfo() message meta info} scoped to the
 * {@link JoynrMessageScoped processing of a joynr message}. The meta-info contains custom headers and other
 * information about the message being delivered.
 */
@JoynrMessageScoped
public class JoynrMessageMetaInfo {

    private Map<String, Serializable> context = Maps.newHashMap();

    public Map<String, Serializable> getMessageContext() {
        return context;
    }

    public void setMessageContext(Map<String, Serializable> context) {
        if (context == null) {
            return;
        }
        this.context = context;
    }

}