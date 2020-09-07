---
id: cluster-overview
title: Cluster overview
---

NBomber Cluster is an additional runtime component that provides a way to run NBomber tests in a distributed way (on the different nodes).

## Why do you need cluster?

- You reached the point that the capacity of one node is not enough to create a relevant load.
- You want to delegate running multiple scenarios to different nodes. For example, you want to test the database by sending in parallel read and write queries. In this case, one node can send inserts and another one can send read queries.
- You want to simulate a real production load that requires several nodes to participate. For example, you may have one node that periodically writes data to the Kafka broker and two nodes that constantly read this data from the Redis cache.

## How it works?

The cluster consists of 2 main components: coordinator and agents. The main role of agents is to execute test scenarious, they also collect statistics and send it to the coordinator.

The coordinator performs a test, orchestrates a test between agents, collects and calculates statistics from all agents. As you can see, the coordinator plays a very important role in the execution of a test.

:::note
The coordinator should be a singleton for the whole cluster. In terms of application structure, the coordinator and agents - it's the same NBomber application packaged with different configuration files.
:::

An important point is that each agent is assigned to an agent group that can contain either one or many agents. Thus, the complete chain of coordination looks like: coordinator -> agent group -> agent

TBD