/*
 * #%L
 * %%
 * Copyright (C) 2016 - 2017 BMW Car IT GmbH
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
#ifndef IWEBSOCKETPPCLIENT_H
#define IWEBSOCKETPPCLIENT_H

#include <functional>

#include <websocketpp/config/asio_client.hpp>
#include <websocketpp/client.hpp>

namespace joynr
{
class IWebSocketSendInterface;

namespace exceptions
{
class JoynrRuntimeException;
}
namespace system
{
namespace RoutingTypes
{
class WebSocketAddress;
}
}

class IWebSocketPpClient
{
public:
    virtual ~IWebSocketPpClient() = default;

    virtual void registerConnectCallback(std::function<void()> callback) = 0;
    virtual void registerReconnectCallback(std::function<void()> callback) = 0;
    virtual void registerDisconnectCallback(std::function<void()> onWebSocketDisconnected) = 0;
    virtual void registerReceiveCallback(
            std::function<void(const std::string&)> onTextMessageReceived) = 0;

    virtual void connect(const system::RoutingTypes::WebSocketAddress& address) = 0;
    virtual void close() = 0;

    virtual bool isConnected() const = 0;

    virtual void send(
            const std::string& msg,
            const std::function<void(const exceptions::JoynrRuntimeException&)>& onFailure) = 0;

    virtual std::shared_ptr<IWebSocketSendInterface> getSender() const = 0;
};

} // namespace joynr

#endif // WEBSOCKETPPCLIENT_H
