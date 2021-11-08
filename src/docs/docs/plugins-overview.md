---
id: plugins-overview
title: Plugins overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about NBomber plugins and plugin development in more detail. NBomber provides a concept of plugins that you can use to extend the functionality of NBomber. A good example would be [Http](plugins-http) plugin which provides a convenient API for working with HTTP protocol. Here is a list of existing plugins that you can use in your projects.

- [Ping plugin](plugins-ping) - a plugin that executes ping logic to gather networking metrics.
- [HTTP plugin](plugins-http) - a simple DSL plugin for working with HTTP.
- [K8s plugin](plugins-k8s) - *in developemnt*.
- [AMQP plugin](plugins-amqp) - *in developemnt*.
- [MQTT plugin](plugins-mqtt) - *in developemnt*.
- [gRPC plugin](plugins-grpc) - *in developemnt*.
- [SQL plugin](plugins-sql) - *in developemnt*.
- [MongoDB plugin](plugins-mongo) - *in developemnt*.
- [Redis plugin](plugins-redis) - *in developemnt*.
- [Kafka plugin](plugins-kafka) - *in developemnt*.

## Plugins types

In fact, plugins are divided into 2 types:
 - DSL (Domain-specific language) plugin is a plugin that extends NBomber's API to interact with a specific protocol, system, database, etc. A good example is the [HTTP](plugins-http) or [Redis](plugins-redis). There is no specialized API for this type of plugins in NBomber, in fact, these plugins use native clients/drivers (for example, Redis client, MongoDb client) and integrate them with basic NBomber elements (for example, Step, ClientFactory, DataFeed).

 - Worker plugin is a plugin that starts at the test start and works as a background worker. Often, such a plugin can perform additional operations on incoming traffic, infrastructure, etc. Worker plugin can also return metrics result to be printed in the report or used for test assertions. A good example would be the [Ping networking plugin](plugins-ping), which at startup tests the specified web host and at the end of the test provides the latency results in the form of metrics.