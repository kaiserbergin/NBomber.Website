---
id: plugins-overview
title: Plugins overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about NBomber plugins and plugin development in more detail. NBomber provides a concept of plugins that you can use to extend the functionality of NBomber. A good example would be [HTTP](plugins-http) plugin which provides a convenient API for working with HTTP protocol. Here is a list of existing plugins that you can use in your projects.

- [PING plugin](plugins-ping) - a plugin that executes ping logic to gather networking metrics.
- [HTTP plugin](plugins-http) - a simple DSL plugin for working with HTTP.
- [K8s plugin](#) - *in development*.
- [AMQP plugin](#) - *in development*.
- [MQTT plugin](#) - *in development*.
- [gRPC plugin](#) - *in development*.
- [SQL plugin](#) - *in development*.
- [MongoDB plugin](#) - *in development*.
- [Redis plugin](#) - *in development*.
- [Kafka plugin](#) - *in development*.

## Plugins types

In fact, plugins are divided into 2 types:
 - `DSL` (Domain-specific language) plugin is a plugin that extends NBomber's API to interact with a specific protocol, system, database, etc. A good example is the [HTTP](plugins-http). There is no specialized API for this type of plugins in NBomber, in fact, these plugins use native clients/drivers (for example, Redis client, MongoDb client) and integrate them with basic NBomber elements (for example, Step, ClientFactory, DataFeed).

 - `WorkerPlugin` is a plugin that starts at the test start and works as a background worker. Often, such a plugin can perform additional operations on incoming traffic, infrastructure, etc. `WorkerPlugin` can also return metrics result to be printed in the report or used for test assertions. A good example would be the [Ping networking plugin](plugins-ping), which at startup tests the specified web host and at the end of the test provides the latency results in the form of metrics.

## Worker plugin development

NBomber provides an interface that you should implement to develop your custom `WorkerPlugin`.

```fsharp
type IWorkerPlugin =
    inherit IDisposable
    abstract PluginName: string
    abstract Init: context:IBaseContext * infraConfig:IConfiguration -> Task
    abstract Start: unit -> Task
    abstract GetStats: currentOperation:OperationType -> Task<DataSet>
    abstract GetHints: unit -> string[]
    abstract Stop: unit -> Task
```