/*-
 * #%L
 * %%
 * Copyright (C) 2011 - 2018 BMW Car IT GmbH
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
package io.joynr.proxy;

import static io.joynr.proxy.StatelessAsyncIdCalculator.CHANNEL_SEPARATOR;
import static io.joynr.proxy.StatelessAsyncIdCalculator.REQUEST_REPLY_ID_SEPARATOR;
import static io.joynr.proxy.StatelessAsyncIdCalculator.USE_CASE_SEPARATOR;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Method;
import java.util.UUID;

import io.joynr.exceptions.JoynrIllegalStateException;
import org.junit.Before;
import org.junit.Test;

import io.joynr.dispatcher.rpc.annotation.StatelessCallbackCorrelation;

public class DefaultStatelessAsyncIdCalculatorImplTest {

    private static final String CHANNEL_ID = "channelId";
    private static final String USE_CASE = "useCase";
    private static final String INTERFACE = "interface";
    private static final String CORRELATION_ID = "correlationId";

    private DefaultStatelessAsyncIdCalculatorImpl subject;

    private StatelessAsyncCallback callback;

    @Before
    public void setup() {
        subject = new DefaultStatelessAsyncIdCalculatorImpl(CHANNEL_ID);
        callback = mock(StatelessAsyncCallback.class);
        when(callback.getUseCase()).thenReturn(USE_CASE);
    }

    @Test
    public void testCalculateParticipantId() {
        String result = subject.calculateParticipantId(INTERFACE, callback);
        assertNotNull(result);
        String expectedUuid = UUID.nameUUIDFromBytes(String.format("%s%s%s%s%s",
                                                                   CHANNEL_ID,
                                                                   CHANNEL_SEPARATOR,
                                                                   INTERFACE,
                                                                   USE_CASE_SEPARATOR,
                                                                   USE_CASE)
                                                           .getBytes())
                                  .toString();
        assertEquals(expectedUuid, result);
    }

    @Test
    public void testCalculateCallbackId() {
        String result = subject.calculateStatelessCallbackId(INTERFACE, callback);
        assertNotNull(result);
        assertEquals(String.format("%s%s%s", INTERFACE, USE_CASE_SEPARATOR, USE_CASE), result);
    }

    @Test
    public void testCalculateCallbackWithMethod() throws Exception {
        Method method = TestInterface.class.getMethod("test");
        String result = subject.calculateStatelessCallbackMethodId(method);
        assertNotNull(result);
        assertEquals(CORRELATION_ID, result);
    }

    @Test
    public void testCalculateRequestReplyId() throws Exception {
        Method method = TestInterface.class.getMethod("test");
        String result = subject.calculateStatelessCallbackRequestReplyId(method);
        assertNotNull(result);
        assertTrue(result.endsWith(REQUEST_REPLY_ID_SEPARATOR + CORRELATION_ID));
    }

    @Test
    public void testExtractMethodIdFromRequestReplyId() {
        String requestReplyId = "random here" + REQUEST_REPLY_ID_SEPARATOR + CORRELATION_ID;
        String result = subject.extractMethodIdFromRequestReplyId(requestReplyId);
        assertNotNull(result);
        assertEquals(CORRELATION_ID, result);
    }

    @Test
    public void testCreateAndRetrieveStatelessCallbackIdForParticipant() {
        String participantId = subject.calculateParticipantId(INTERFACE, callback);
        assertNotNull(participantId);
        String statelessCallbackId = subject.fromParticipantUuid(participantId);
        assertNotNull(statelessCallbackId);
        assertEquals(subject.calculateStatelessCallbackId(INTERFACE, callback), statelessCallbackId);
    }

    @Test(expected = JoynrIllegalStateException.class)
    public void testCannotGetStatelessCallbackIdForUnknownParticipant() {
        subject.fromParticipantUuid(UUID.randomUUID().toString());
    }

    private interface TestInterface extends StatelessAsyncCallback {
        @StatelessCallbackCorrelation(CORRELATION_ID)
        void test();
    }
}
