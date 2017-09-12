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
package io.joynr.messaging;

import io.joynr.context.JoynrMessageScoped;

/**
 * A container object for the {@link joynr.ImmutableMessage#getCreatorUserId() message creator ID} scoped to the
 * {@link JoynrMessageScoped processing of a joynr message}.
 */
@JoynrMessageScoped
public class JoynrMessageCreator {

    private String messageCreatorId;

    public String getMessageCreatorId() {
        return messageCreatorId;
    }

    public void setMessageCreatorId(String messageCreatorId) {
        this.messageCreatorId = messageCreatorId;
    }

}
