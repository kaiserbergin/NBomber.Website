---
id: loadtesting-basics
title: Load testing basics
---

## What to measure about performance?

Many folks usually think about performance in a very simple way, resulting in asking questions like "can your server handle 10K concurrent connections?".

> Performance is a multidimensional characteristic. It's impossible to take a picture of the system performance using only 1 metric.

When you asked about how good this system is performing, you should think about: latency, throughput, bandwidth, memory footprint, CPU usage, etc. To understand how system behaves under the load you should:

- Analyze test report metrics. 
- Analyze internal system metrics (CPU, RAM, IO) from the target system to understand what is a bottleneck. Usually, modern systems provide some kind of telemetry that you can sink for further analysis.

Here is an example of NBomber statistics report that we try to analyze together.

> **Scenario statistics table**

__step__|__details__
---|---
name|`pull html`
request count|all = `1491`, ok = `1491`, failed = `0`
latency|RPS = `105`, min = `50`, mean = `1084`, max = `5762`
latency percentile|50% = `752`, 75% = `1048`, 95% = `3731`, 99% = `3901`, StdDev = `999`
data transfer|min = `17.880 Kb`, mean = `17.880 Kb`, max = `17.880 Kb`, all = `26.030 MB`

> **Ping statistics table**

__Host__|__Status__|__Address__|__Round Trip Time__|__Time to Live__|__Don't Fragment__|__Buffer Size__
---|---|---|---|---|---|---
nbomber.com|Success|104.248.140.128|43 ms|128|False|32 bytes

1. The first noticeable thing is physical latency (**Ping statistics -> Round Trip Time: 43ms**) between the load test agent and the target host. It shows that you run your test under problematic infrastructure (internet connection is bad or your test agent and target system located in different datacenters). You should run your tests where are physical latency will be close to 0 - 1ms. 

2. Next important thing is a combination of 3 dependent metrics:

- **RPS (request per sec)** - shows throughput of target system. It reflects the capacity of the server in a way. The ability of the server in terms of how much load it can take. It is one of the significant indicator that helps in evaluating the performance of application. Maximum throughput is often desirable, though the performance of the system itself cannot be based only on higher throughput. There are certain other indicators like latency, bytes transfered size, also needs to be considered when testing the application performance. For a typical Web application, throughput is measured as number of requests sent to web server per second.

- **Latency** - shows time interval from the point when the request was created and sent to the point when the response was received. This metric also depends on throughput (RPS) and data size (request/response size). Usually, during testing, the target system should reach a good balance between RPS and latency. For example, if the target system shows RPS: 10K (which sounds very good) but latency: 2 sec it means that any user will need to wait quite a long time to receive first byte therefore it's not good. Usually (depending on your use case of course) better to reach RPS: 1K but with 99% latency: 50ms. 

- **Data transfer size** - shows how many bytes were sent/received.

## What load simulation to apply?

When it comes to load simulation, systems behave in 2 different ways:
- Closed systems, where you keep a constant number of concurrent clients and **they waiting on a response before sending a new request**. A good example will be a database with 20 concurrent clients that constantly repeat sending query then wait for a response and do it again. Under the big load, requests will be queued and this queue will not grow since we have a finite number of clients. Usually, in real-world scenarios systems with persisted connections (RabbitMq, Kafka, WebSockets, Databases) are tested as closed systems.
- Open systems, where you keep arrival rate of new clients requests **without waitng on responses**. The good example could be some popular website like Amazon. Under the load new clients arrive even though applications have trouble serving them. Usually, in real-world scenarios systems that use stateless protocols like HTTP are tested as open systems.

:::note
NBomber allows you to configure load simulation, you can read more [here](core-abstractions#load-simulations).
:::

### When I need to use smooth ramp-up simulation?

Many folks do believe that they need to start testing using a smooth ramp-up. Usually, depending on the duration of ramp-up it's hard to get correct figures like RPS, latency, etc since your system is not fully loaded during the actual test. **In fact, better to always start with a max load to fully load your system and get correct figures**.

## How long to run load test?

To start, we recommend you start with small *unit load tests*. These are designed to run on each commit for specific API endpoints and may take only 3-5 minutes each. But there could be some side effects (GC pause, memory leak, networking problems, etc) which you can catch only running tests for a long period.
Therefore, you should have a nightly load test that will run at night for 30 minutes (or longer) per endpoint. The main goal of nightly running tests is to bring confidence that your system works stable despite any long period of time.



<!-- 
## Load simulations

## Test structure
 

## What to measure about performance

People usually think about performance wrong, resulting in asking wrong questions like can your server handle 10K connections or 2000000 users?.

…

What is important to remember: Performance is a multidimensional characteristics. its impossible to make a picture of the system performance using only 1 metric.

When you asked about how good some stream of something is performing, you should think about:

    Throughput, Bandwidth
    Latency
    Response time
    Footprint

The relation between throughput and latency is described by Little’s law. -->
