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
#include <chrono>
#include <memory>
#include <string>
#include <vector>

#include <gtest/gtest.h>
#include <gmock/gmock.h>

#include "joynr/DiscoveryQos.h"
#include "joynr/Future.h"
#include "joynr/OnChangeWithKeepAliveSubscriptionQos.h"
#include "joynr/PrivateCopyAssign.h"
#include "joynr/JoynrClusterControllerRuntime.h"
#include "joynr/LibjoynrSettings.h"
#include "joynr/Semaphore.h"
#include "joynr/Settings.h"
#include "joynr/serializer/Serializer.h"
#include "joynr/system/RoutingTypes/MqttAddress.h"
#include "joynr/system/RoutingTypes/ChannelAddress.h"
#include "joynr/types/ProviderQos.h"
#include "joynr/types/ProviderScope.h"
#include "joynr/types/Localisation/GpsLocation.h"

#include "joynr/tests/testProvider.h"
#include "joynr/tests/testProxy.h"

#include "tests/JoynrTest.h"
#include "tests/mock/MockMqttMessagingSkeleton.h"
#include "tests/mock/MockTransportMessageSender.h"
#include "tests/mock/MockTransportMessageReceiver.h"
#include "tests/mock/MockSubscriptionListener.h"
#include "tests/mock/MockTestProvider.h"
#include "tests/utils/PtrUtils.h"

using namespace ::testing;
using namespace joynr;

using testing::Return;
using testing::ReturnRef;
using testing::ByRef;
using testing::SetArgReferee;
using testing::AtLeast;

class JoynrClusterControllerRuntimeTest : public ::testing::Test
{
public:
    std::string settingsFilenameMqtt;
    std::string settingsFilenameHttp;
    std::string settingsFilenameMultipleAclRclFiles;
    std::shared_ptr<JoynrClusterControllerRuntime> runtime;
    joynr::types::Localisation::GpsLocation gpsLocation;
    std::shared_ptr<MockTransportMessageReceiver> mockHttpMessageReceiver;
    std::shared_ptr<MockTransportMessageSender> mockHttpMessageSender;
    std::shared_ptr<MockTransportMessageReceiver> mockMqttMessageReceiver;
    std::shared_ptr<MockTransportMessageSender> mockMqttMessageSender;
    Semaphore semaphore;
    std::string serializedChannelAddress;
    std::string serializedMqttAddress;

    JoynrClusterControllerRuntimeTest()
            : settingsFilenameMqtt("test-resources/MqttJoynrClusterControllerRuntimeTest.settings"),
              settingsFilenameHttp("test-resources/HttpJoynrClusterControllerRuntimeTest.settings"),
              settingsFilenameMultipleAclRclFiles(
                      "test-resources/AclRclJoynrClusterControllerRuntimeTest.settings"),
              runtime(nullptr),
              gpsLocation(1.1,                                     // longitude
                          2.2,                                     // latitude
                          3.3,                                     // altitude
                          types::Localisation::GpsFixEnum::MODE2D, // gps fix
                          0.0,                                     // heading
                          0.0,                                     // quality
                          0.0,                                     // elevation
                          0.0,                                     // bearing
                          444,                                     // gps time
                          444,                                     // device time
                          444                                      // time
                          ),
              mockHttpMessageReceiver(std::make_shared<MockTransportMessageReceiver>()),
              mockHttpMessageSender(std::make_shared<MockTransportMessageSender>()),
              mockMqttMessageReceiver(std::make_shared<MockTransportMessageReceiver>()),
              mockMqttMessageSender(std::make_shared<MockTransportMessageSender>()),
              semaphore(0)
    {
        std::string httpChannelId("http_JoynrClusterControllerRuntimeTest.ChannelId");
        std::string httpEndPointUrl("http_JoynrClusterControllerRuntimeTest.endPointUrl");
        std::string mqttTopic("mqtt_JoynrClusterControllerRuntimeTest.topic");
        std::string mqttBrokerUrl("mqtt_JoynrClusterControllerRuntimeTest.brokerUrl");

        using system::RoutingTypes::ChannelAddress;
        using system::RoutingTypes::MqttAddress;

        serializedChannelAddress =
                joynr::serializer::serializeToJson(ChannelAddress(httpEndPointUrl, httpChannelId));
        serializedMqttAddress =
                joynr::serializer::serializeToJson(MqttAddress(mqttBrokerUrl, mqttTopic));
    }

    ~JoynrClusterControllerRuntimeTest()
    {
        if (runtime) {
            runtime->deleteChannel();
            runtime->stopExternalCommunication();
            runtime->shutdown();
            test::util::resetAndWaitUntilDestroyed(runtime);
        }
        test::util::removeAllCreatedSettingsAndPersistencyFiles();
        EXPECT_TRUE(Mock::VerifyAndClearExpectations(mockHttpMessageReceiver.get()));
        EXPECT_TRUE(Mock::VerifyAndClearExpectations(mockMqttMessageReceiver.get()));
    }

    void createRuntimeMqtt()
    {
        // runtime can only be created, after MockMessageReceiver has been told to return
        // a channelId for getReceiveChannelId.
        EXPECT_CALL(*mockHttpMessageReceiver, getGlobalClusterControllerAddress()).Times(0);
        EXPECT_CALL(*mockMqttMessageReceiver, getGlobalClusterControllerAddress())
                .WillOnce(::testing::ReturnRefOfCopy(serializedMqttAddress));

        runtime = std::make_shared<JoynrClusterControllerRuntime>(
                std::make_unique<Settings>(settingsFilenameMqtt),
                nullptr,
                nullptr,
                mockHttpMessageReceiver,
                mockHttpMessageSender,
                mockMqttMessageReceiver,
                mockMqttMessageSender);
        runtime->init();
    }

    void createRuntimeHttp()
    {
        // runtime can only be created, after MockMessageReceiver has been told to return
        // a channelId for getReceiveChannelId.
        EXPECT_CALL(*mockHttpMessageReceiver, getGlobalClusterControllerAddress())
                .WillOnce(::testing::ReturnRefOfCopy(serializedChannelAddress));
        EXPECT_CALL(*mockMqttMessageReceiver, getGlobalClusterControllerAddress()).Times(0);

        runtime = std::make_shared<JoynrClusterControllerRuntime>(
                std::make_unique<Settings>(settingsFilenameHttp),
                nullptr,
                nullptr,
                mockHttpMessageReceiver,
                mockHttpMessageSender,
                mockMqttMessageReceiver,
                mockMqttMessageSender);
        runtime->init();
    }

    void startExternalCommunicationDoesNotThrow();

    void invokeOnSuccessWithGpsLocation(
            std::function<void(const joynr::types::Localisation::GpsLocation location)> onSuccess,
            std::function<void(const joynr::exceptions::ProviderRuntimeException& exception)>
                    onError)
    {
        onSuccess(gpsLocation);
    }

private:
    DISALLOW_COPY_AND_ASSIGN(JoynrClusterControllerRuntimeTest);
};

TEST_F(JoynrClusterControllerRuntimeTest, loadMultipleAclRclFiles)
{
    // runtime can only be created, after MockMessageReceiver has been told to return
    // a channelId for getReceiveChannelId.
    EXPECT_CALL(*mockHttpMessageReceiver, getGlobalClusterControllerAddress())
            .WillOnce(::testing::ReturnRefOfCopy(serializedChannelAddress));
    EXPECT_CALL(*mockMqttMessageReceiver, getGlobalClusterControllerAddress()).Times(0);

    runtime = std::make_shared<JoynrClusterControllerRuntime>(
            std::make_unique<Settings>(settingsFilenameMultipleAclRclFiles),
            nullptr,
            nullptr,
            mockHttpMessageReceiver,
            mockHttpMessageSender,
            mockMqttMessageReceiver,
            mockMqttMessageSender);

    runtime->init();

    ASSERT_TRUE(runtime != nullptr);
}

TEST_F(JoynrClusterControllerRuntimeTest, instantiateRuntimeMqtt)
{
    createRuntimeMqtt();
    ASSERT_TRUE(runtime != nullptr);
}

TEST_F(JoynrClusterControllerRuntimeTest, instantiateRuntimeHttp)
{
    createRuntimeHttp();
    ASSERT_TRUE(runtime != nullptr);
}

TEST_F(JoynrClusterControllerRuntimeTest, injectCustomMqttMessagingSkeleton)
{
    auto mockMqttMessagingSkeleton = std::make_shared<MockMqttMessagingSkeleton>();

    auto mockMqttMessagingSkeletonFactory =
            [mockMqttMessagingSkeleton](std::weak_ptr<IMessageRouter> messageRouter,
                                        std::shared_ptr<MqttReceiver> mqttReceiver,
                                        const std::string& multicastTopicPrefix,
                                        std::uint64_t ttlUplift) {
        std::ignore = messageRouter;
        std::ignore = mqttReceiver;
        std::ignore = multicastTopicPrefix;
        std::ignore = ttlUplift;
        return mockMqttMessagingSkeleton;
    };

    smrf::ByteVector msg;
    auto registerReceivedCallbackHelper =
            [msg](std::function<void(smrf::ByteVector && )> onMessageReceived) mutable {
        onMessageReceived(std::move(msg));
    };
    EXPECT_CALL(*mockMqttMessageReceiver, registerReceiveCallback(_))
            .WillOnce(Invoke(registerReceivedCallbackHelper));
    EXPECT_CALL(*mockMqttMessageReceiver, getGlobalClusterControllerAddress())
            .WillOnce(::testing::ReturnRefOfCopy(serializedMqttAddress));

    EXPECT_CALL(*mockMqttMessagingSkeleton, onMessageReceivedMock(msg));

    runtime = std::make_shared<JoynrClusterControllerRuntime>(
            std::make_unique<Settings>(settingsFilenameMqtt),
            nullptr,
            mockMqttMessagingSkeletonFactory,
            mockHttpMessageReceiver,
            mockHttpMessageSender,
            mockMqttMessageReceiver,
            mockMqttMessageSender);
    runtime->init();
}

void JoynrClusterControllerRuntimeTest::startExternalCommunicationDoesNotThrow()
{
    ASSERT_TRUE(runtime != nullptr);
    runtime->startExternalCommunication();
    runtime->stopExternalCommunication();
}

TEST_F(JoynrClusterControllerRuntimeTest, startExternalCommunicationHttpDoesNotThrow)
{
    EXPECT_CALL(*mockHttpMessageReceiver, startReceiveQueue()).Times(1);
    EXPECT_CALL(*mockHttpMessageReceiver, stopReceiveQueue()).Times(1);

    createRuntimeHttp();
    startExternalCommunicationDoesNotThrow();
}

TEST_F(JoynrClusterControllerRuntimeTest, startExternalCommunicationMqttDoesNotThrow)
{
    EXPECT_CALL(*mockHttpMessageReceiver, startReceiveQueue()).Times(0);
    EXPECT_CALL(*mockHttpMessageReceiver, stopReceiveQueue()).Times(0);

    createRuntimeMqtt();
    startExternalCommunicationDoesNotThrow();
}

TEST_F(JoynrClusterControllerRuntimeTest, registerAndUseLocalProvider)
{
    createRuntimeMqtt();
    std::string domain("JoynrClusterControllerRuntimeTest.Domain.A");
    auto mockTestProvider = std::make_shared<MockTestProvider>();
    types::ProviderQos providerQos;
    std::chrono::milliseconds millisSinceEpoch =
            std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch());
    providerQos.setPriority(millisSinceEpoch.count());
    providerQos.setScope(joynr::types::ProviderScope::GLOBAL);
    providerQos.setSupportsOnChangeSubscriptions(true);

    EXPECT_CALL(
            *mockTestProvider,
            getLocation(
                    A<std::function<void(const types::Localisation::GpsLocation&)>>(),
                    A<std::function<void(const joynr::exceptions::ProviderRuntimeException&)>>()))
            .WillOnce(Invoke(
                    this, &JoynrClusterControllerRuntimeTest::invokeOnSuccessWithGpsLocation));

    runtime->startExternalCommunication();
    std::string participantId =
            runtime->registerProvider<tests::testProvider>(domain, mockTestProvider, providerQos);

    std::shared_ptr<ProxyBuilder<tests::testProxy>> testProxyBuilder =
            runtime->createProxyBuilder<tests::testProxy>(domain);

    DiscoveryQos discoveryQos(1000);
    discoveryQos.addCustomParameter("fixedParticipantId", participantId);
    discoveryQos.setDiscoveryTimeoutMs(50);
    discoveryQos.setArbitrationStrategy(DiscoveryQos::ArbitrationStrategy::FIXED_PARTICIPANT);

    std::shared_ptr<tests::testProxy> testProxy(
            testProxyBuilder->setMessagingQos(MessagingQos(5000))
                    ->setDiscoveryQos(discoveryQos)
                    ->build());

    std::shared_ptr<Future<types::Localisation::GpsLocation>> future(testProxy->getLocationAsync());
    future->wait(500);

    EXPECT_EQ(tests::testProxy::INTERFACE_NAME(), testProxy->INTERFACE_NAME());
    ASSERT_EQ(StatusCodeEnum::SUCCESS, future->getStatus());
    joynr::types::Localisation::GpsLocation actualValue;
    future->get(actualValue);
    EXPECT_EQ(gpsLocation, actualValue);
    runtime->unregisterProvider(participantId);
}

TEST_F(JoynrClusterControllerRuntimeTest, registerAndUseLocalProviderWithListArguments)
{
    createRuntimeMqtt();
    auto mockTestProvider = std::make_shared<MockTestProvider>();
    types::ProviderQos providerQos;
    std::chrono::milliseconds millisSinceEpoch =
            std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch());
    providerQos.setPriority(millisSinceEpoch.count());
    providerQos.setScope(joynr::types::ProviderScope::GLOBAL);
    providerQos.setSupportsOnChangeSubscriptions(true);
    std::string domain("JoynrClusterControllerRuntimeTest.Domain.A");

    std::vector<int> ints;
    ints.push_back(4);
    ints.push_back(6);
    ints.push_back(12);
    int sum = 22;

    runtime->startExternalCommunication();
    std::string participantId =
            runtime->registerProvider<tests::testProvider>(domain, mockTestProvider, providerQos);

    std::shared_ptr<ProxyBuilder<tests::testProxy>> testProxyBuilder =
            runtime->createProxyBuilder<tests::testProxy>(domain);

    DiscoveryQos discoveryQos(1000);
    discoveryQos.addCustomParameter("fixedParticipantId", participantId);
    discoveryQos.setDiscoveryTimeoutMs(50);
    discoveryQos.setArbitrationStrategy(DiscoveryQos::ArbitrationStrategy::FIXED_PARTICIPANT);

    std::shared_ptr<tests::testProxy> testProxy(
            testProxyBuilder->setMessagingQos(MessagingQos(5000))
                    ->setDiscoveryQos(discoveryQos)
                    ->build());

    std::shared_ptr<Future<int>> future(testProxy->sumIntsAsync(ints));
    future->wait(500);

    EXPECT_EQ(tests::testProxy::INTERFACE_NAME(), testProxy->INTERFACE_NAME());
    ASSERT_EQ(StatusCodeEnum::SUCCESS, future->getStatus());
    int actualValue;
    future->get(actualValue);
    EXPECT_EQ(sum, actualValue);
    runtime->unregisterProvider(participantId);
}

TEST_F(JoynrClusterControllerRuntimeTest, registerAndSubscribeToLocalProvider)
{
    createRuntimeMqtt();
    std::remove(LibjoynrSettings::DEFAULT_SUBSCRIPTIONREQUEST_PERSISTENCE_FILENAME().c_str());
    std::string domain("JoynrClusterControllerRuntimeTest.Domain.A");
    auto mockTestProvider = std::make_shared<MockTestProvider>();
    types::ProviderQos providerQos;
    std::chrono::milliseconds millisSinceEpoch =
            std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch());
    providerQos.setPriority(millisSinceEpoch.count());
    providerQos.setScope(joynr::types::ProviderScope::GLOBAL);
    providerQos.setSupportsOnChangeSubscriptions(true);

    EXPECT_CALL(
            *mockTestProvider,
            getLocation(
                    A<std::function<void(const types::Localisation::GpsLocation&)>>(),
                    A<std::function<void(const joynr::exceptions::ProviderRuntimeException&)>>()))
            .Times(AtLeast(1))
            .WillRepeatedly(Invoke(
                    this, &JoynrClusterControllerRuntimeTest::invokeOnSuccessWithGpsLocation));

    runtime->startExternalCommunication();
    std::string participantId =
            runtime->registerProvider<tests::testProvider>(domain, mockTestProvider, providerQos);

    std::shared_ptr<ProxyBuilder<tests::testProxy>> testProxyBuilder =
            runtime->createProxyBuilder<tests::testProxy>(domain);

    DiscoveryQos discoveryQos(1000);
    discoveryQos.addCustomParameter("fixedParticipantId", participantId);
    discoveryQos.setDiscoveryTimeoutMs(50);
    discoveryQos.setArbitrationStrategy(DiscoveryQos::ArbitrationStrategy::FIXED_PARTICIPANT);

    std::shared_ptr<tests::testProxy> testProxy(
            testProxyBuilder->setMessagingQos(MessagingQos(5000))
                    ->setDiscoveryQos(discoveryQos)
                    ->build());

    auto mockSubscriptionListener = std::make_shared<MockGpsSubscriptionListener>();
    EXPECT_CALL(*mockSubscriptionListener, onReceive(gpsLocation)).Times(AtLeast(1));

    auto subscriptionQos =
            std::make_shared<OnChangeWithKeepAliveSubscriptionQos>(480,  // validity
                                                                   1000, // publication ttl
                                                                   200,  // min interval
                                                                   200,  // max interval
                                                                   200   // alert after interval
                                                                   );
    auto future = testProxy->subscribeToLocation(mockSubscriptionListener, subscriptionQos);
    std::string subscriptionId;
    JOYNR_ASSERT_NO_THROW({ future->get(5000, subscriptionId); });
    std::this_thread::sleep_for(std::chrono::milliseconds(250));
    testProxy->unsubscribeFromLocation(subscriptionId);
    runtime->unregisterProvider(participantId);
}

TEST_F(JoynrClusterControllerRuntimeTest, unsubscribeFromLocalProvider)
{
    createRuntimeMqtt();
    std::remove(LibjoynrSettings::DEFAULT_SUBSCRIPTIONREQUEST_PERSISTENCE_FILENAME().c_str());
    std::string domain("JoynrClusterControllerRuntimeTest.Domain.A");
    auto mockTestProvider = std::make_shared<MockTestProvider>();
    types::ProviderQos providerQos;
    std::chrono::milliseconds millisSinceEpoch =
            std::chrono::duration_cast<std::chrono::milliseconds>(
                    std::chrono::system_clock::now().time_since_epoch());
    providerQos.setPriority(millisSinceEpoch.count());
    providerQos.setScope(joynr::types::ProviderScope::GLOBAL);
    providerQos.setSupportsOnChangeSubscriptions(true);

    EXPECT_CALL(
            *mockTestProvider,
            getLocation(
                    A<std::function<void(const types::Localisation::GpsLocation&)>>(),
                    A<std::function<void(const joynr::exceptions::ProviderRuntimeException&)>>()))
            .WillRepeatedly(Invoke(
                    this, &JoynrClusterControllerRuntimeTest::invokeOnSuccessWithGpsLocation));

    runtime->startExternalCommunication();
    std::string participantId =
            runtime->registerProvider<tests::testProvider>(domain, mockTestProvider, providerQos);

    std::shared_ptr<ProxyBuilder<tests::testProxy>> testProxyBuilder =
            runtime->createProxyBuilder<tests::testProxy>(domain);

    DiscoveryQos discoveryQos(1000);
    discoveryQos.addCustomParameter("fixedParticipantId", participantId);
    discoveryQos.setDiscoveryTimeoutMs(50);
    discoveryQos.setArbitrationStrategy(DiscoveryQos::ArbitrationStrategy::FIXED_PARTICIPANT);

    std::shared_ptr<tests::testProxy> testProxy(
            testProxyBuilder->setMessagingQos(MessagingQos(5000))
                    ->setDiscoveryQos(discoveryQos)
                    ->build());

    auto mockSubscriptionListener = std::make_shared<MockGpsSubscriptionListener>();

    auto subscriptionQos =
            std::make_shared<OnChangeWithKeepAliveSubscriptionQos>(2000, // validity
                                                                   1000, // publication ttl
                                                                   100,  // min interval
                                                                   1000, // max interval
                                                                   10000 // alert after interval
                                                                   );
    ON_CALL(*mockSubscriptionListener, onReceive(Eq(gpsLocation)))
            .WillByDefault(ReleaseSemaphore(&semaphore));

    auto future = testProxy->subscribeToLocation(mockSubscriptionListener, subscriptionQos);

    std::string subscriptionId;
    JOYNR_ASSERT_NO_THROW({ future->get(5000, subscriptionId); });
    ASSERT_TRUE(semaphore.waitFor(std::chrono::seconds(1)));

    testProxy->unsubscribeFromLocation(subscriptionId);

    std::this_thread::sleep_for(std::chrono::milliseconds(300));

    ASSERT_FALSE(semaphore.waitFor(std::chrono::seconds(1)));
    runtime->unregisterProvider(participantId);
}
