---
id: plugins-ping
title: Ping plugin
---

For any load testing, you need to know the physical latency between the target system and the test agent. For these purposes, NBomber has a Ping plugin that runs on the background and checks the specified web host by sending a PING request to measure the latency. It sends PING only once on the test start.

## API

```fsharp
open NBomber.Plugins.Network.Ping

/// scenario defination.....

let pingPluginConfig = PingPluginConfig.CreateDefault ["nbomber.com"]
use pingPlugin = new PingPlugin(pingPluginConfig)

Scenario.create "rest_api" [getUser; getPosts]
|> NBomberRunner.registerScenario
|> NBomberRunner.withPlugins [pingPlugin]
|> NBomberRunner.run
```

> **Ping statistics table results**

__Host__|__Status__|__Address__|__Round Trip Time__|__Time to Live__|__Don't Fragment__|__Buffer Size__
---|---|---|---|---|---|---
nbomber.com|Success|104.248.140.128|43 ms|128|False|32 bytes

## Configuration

```fsharp
type PingPluginConfig = {
    Hosts: string[]
    /// A buffer of data to be transmitted. The default is 32.
    /// If you believe that a larger (or smaller) packet size will noticeably affect
    /// the response time from the target host, then you may wish to experiment with
    /// different values.  The range of sizes is from 1 to 65500.  Note that values
    /// (for Ethernet) require that the packet be fragmented for any value over 1386
    /// bytes in the data field.
    BufferSizeBytes: int
    /// Sets the number of routing nodes that can forward the Ping data before it is discarded.
    /// An Int32 value that specifies the number of times the Ping data packets can be forwarded. The default is 128.
    Ttl: int
    /// Sets a Boolean value that controls fragmentation of the data sent to the remote host.
    /// true if the data cannot be sent in multiple packets; otherwise false. The default is false
    /// This option is useful if you want to test the maximum transmission unit (MTU)
    /// of the routers and gateways used to transmit the packet.
    /// If this property is true and the data sent to the remote host is larger then the MTU of a gateway
    /// or router between the sender and the remote host, the ping operation fails with status PacketTooBig.
    DontFragment: bool
    /// The default is 1000 ms.
    Timeout: int
}
```

This plugin is allowing dynamic configuration via the infrastructure config file.

```json title="infra-config.json"
{
    "PingPlugin": {
        "Hosts": ["jsonplaceholder.typicode.com"],
        "BufferSizeBytes": 32,
        "Ttl": 128,
        "DontFragment": false,
        "Timeout": 1000
    }
}
```

```fsharp
Scenario.create "rest_api" [getUser; getPosts]
|> NBomberRunner.registerScenario
|> NBomberRunner.withPlugins [new PingPlugin()] // we set empty instance
|> NBomberRunner.loadInfraConfig "infra-config.json"
|> NBomberRunner.run
```