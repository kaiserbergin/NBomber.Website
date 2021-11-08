---
id: plugins-ping
title: PING plugin
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

For any load testing, you need to know physical latency between the target system and the test agent. For these purposes, NBomber has a Ping plugin that runs in the background on start-up and checks the specified web host by sending a PING request to measure the latency. It sends a PING only once on the test start.

## API

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
open NBomber.Plugins.Network.Ping

/// scenario defination.....

let pingPluginConfig = PingPluginConfig.CreateDefault "nbomber.com"
let pingPlugin = new PingPlugin(pingPluginConfig)

Scenario.create "rest_api" [getUser; getPosts]
|> NBomberRunner.registerScenario
|> NBomberRunner.withWorkerPlugins [pingPlugin]
|> NBomberRunner.run
```

</TabItem>

<TabItem value="C#">

```csharp
using NBomber.Plugins.Network.Ping;

/// scenario defination.....

var pingPluginConfig = PingPluginConfig.CreateDefault("nbomber.com");
var pingPlugin = new PingPlugin(pingPluginConfig);

NBomberRunner
    .RegisterScenarios(scenario)
    .WithWorkerPlugins(pingPlugin)
    .Run();
```

</TabItem>
</Tabs>

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

This plugin is allowing dynamic configuration via the [infrastructure config file](json-config#infrastructure-configuration).

```json title="infra-config.json"
{
    "PingPlugin": {
        "Hosts": ["nbomber.com"],
        "BufferSizeBytes": 32,
        "Ttl": 128,
        "DontFragment": false,
        "Timeout": 1000
    }
}
```

To load the configuration into the plugin, we should create an empty instance of the plugin (without any configuration) and pass `infra-config.json` into `NBomberRunner`. After this plugin will be initialized by `infra-config.json`.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let pingPlugin = new PingPlugin() // create empty instance

Scenario.create "rest_api" [getUser; getPosts]
|> NBomberRunner.registerScenario
|> NBomberRunner.withWorkerPlugins [pingPlugin] 
|> NBomberRunner.loadInfraConfig "infra-config.json" // load config
|> NBomberRunner.run
```

</TabItem>

<TabItem value="C#">

```csharp
/// scenario defination.....

var pingPlugin = new PingPlugin(); // create empty instance

NBomberRunner
    .RegisterScenarios(scenario)
    .WithWorkerPlugins(pingPlugin)
    .LoadInfraConfig("infra-config.json") // load config
    .Run();
```

</TabItem>
</Tabs>