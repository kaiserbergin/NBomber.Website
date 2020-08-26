---
id: cluster-overview
title: Cluster overview
---

NBomber Cluster is an additional runtime component that provides a way to run NBomber tests in a distributed way (on different nodes).

## Why do you need cluster?

- You reached the point that the capacity of one node is not enough to create a relevant load.
- You want to delegate running multiple scenarios to different nodes. For example, you want to test the database by sending in parallel read and write queries. In this case, one node can send inserts and another one can send read queries.
- You want to simulate a real production load that requires several nodes to participate. For example, you may have one node that periodically writes data to the Kafka broker and two nodes that constantly read this data from the Redis cache.

## What you can do with it?

TBD