---
id: plugins-overview
title: Plugins overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

NBomber provides a concept of plugins that you can use to extend the functionality of NBomber. A good example would be the [Http](plugins-http) plugin which provides a convenient API for working with the HTTP protocol. Here is a list of existing plugins that you can use in your projects:

- [Http plugin](plugins-http) - a simple DSL for working with HTTP.
- [Ping plugin](plugins-ping) - a plugin that executes ping logic to gather networking metrics.
- [Chaos monkey plugin]() - TBD
- [AMQP plugin]() - TBD
- [MQTT plugin]() - TBD
- [gRPC plugin]() - TBD
- [SQL plugin]() - TBD
- [MongoDB plugin]() - TBD
- [Redis plugin]() - TBD
- [Kafka plugin]() - TBD

## Plugins development

In fact, plugins are divided into 2 types:
 - DSL (Domain-specific language) plugin is a plugin that extends NBomber's API to interact with a specific protocol, system, database, etc. A good example is the Http or Redis plugin. There is no specialized API for this type of plugins in NBomber, in fact, these plugins use native clients/drivers and wrap them in the basic NBomber elements (for example, Step, ConnectionPool) that extends NBomber API.

 - Worker plugin is a plugin that starts at the test start and works as a background worker. Often, such a plugin can perform additional operations on incoming traffic, infrastructure, etc. A good example would be the Ping networking plugin, which at startup tests the specified web host and at the end of the test provides the latency results in the form of metrics. For this type of plugins, NBomber provides this interface:

```fsharp
type IWorkerPlugin =
    inherit IDisposable
    abstract PluginName: string
    abstract Init: logger:ILogger * infraConfig:IConfiguration option -> unit
    abstract Start: testInfo:TestInfo -> Task
    abstract GetStats: unit -> DataSet
    abstract Stop: unit -> Task
```