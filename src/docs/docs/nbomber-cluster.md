---
id: nbomber-cluster
title: Cluster overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import ClusterAllNodesImage from '@site/static/img/cluster/cluster-all-nodes.png';
import ClusterSegregationImage from '@site/static/img/cluster/cluster-segregation.png';
import ClusterPushFlowImage from '@site/static/img/cluster/cluster-push-flow.png';
import ClusterHighlevelSchemaImage from '@site/static/img/cluster/cluster-highlevel-schema.png';
import ClusterAgentGroupsImage from '@site/static/img/cluster/cluster-agent-groups.png';

This document will help you learn about NBomber Cluster. NBomber Cluster is an additional runtime component that can run NBomber tests in a distributed way (on multiple nodes) with flexible orchestration and stats gathering. NBomber Cluster is available in the [Enterprise](https://nbomber.com/#download) version, including a free trial period.

:::note
We assume that you are already familiar with the basics of [NBomber API](general-concepts) and can create and run simple load tests. Also, you should be familiar with configuring your tests via [JSON configuration](json-config).
:::

## Why do you need the cluster?

1. You have reached the point that the capacity of one node is not enough to create a relevant load, and you want to run parallel execution of scenarios on multiple nodes.
<center><img src={ClusterAllNodesImage} width="50%" height="50%" /></center>

2. You want to segregate multiple scenarios to different nodes. For example, you want to test the database by sending INSERT, READ and DELETE requests in parallel. In this case, you can spread your load granularly: one node can send INSERT requests, and another one can send READ or DELETE requests.
<center><img src={ClusterSegregationImage} width="70%" height="70%" /></center>

3. You may need to have several nodes to simulate a production load, especially in geo-distributed mode. In this example, one NBomber node (on the left side) is publishing messages to Kafka and other NBomber nodes (on the right side) are listening to PUSH messages from the Push servers and calculate latency and throughput.
<center><img src={ClusterPushFlowImage} width="70%" height="70%" /></center>

## What are the components of the cluster?

NBomber Cluster consists of 3 main components: `Coordinator`, `Agent` and `Message Broker`. 

- `Coordinator` is responsible for coordinating the execution of the entire test. It sends commands and executes scenarios.
- `Agent` is responsible for listening to the commands from the `Coordinator`, executing scenarios, sending stats.
- `Message Broker`  is a communication point in the cluster. All network communication goes via the `Message Broker`.

:::note
Both Coordinator and Agent are the same .NET application but with different JSON configs.
:::

<center><img src={ClusterHighlevelSchemaImage} width="80%" height="80%" /></center>

### Message Broker (MQTT)

Message Broker is a communication point in the cluster. The main goal of the message broker is to provide reliable message delivery across the cluster. NBomber Cluster works with any message broker that supports the MQTT protocol. In the default setup, one single MQTT node with minimum characteristics (2CPU and 2RAM) will be enough. Such a single MQTT node can serve many concurrent NBomber Clusters with no problems. We recommend using a free version of [EMQ X broker](https://www.emqx.io/). In the following section we will setup EMQX broker using [Docker](https://www.docker.com/).

### Coordinator

Coordinator is the main component that contains registered [Scenarios](general-concepts#scenario) and is responsible for coordinating the execution of the entire test, including gathering all statistics from Agents. The coordination process is lightweight and doesn't take many resources. For these reasons, you should use Coordinator not only for orchestration but also to execute Scenarios.

:::note
There should be only one Coordinator per cluster. So if you have 10 clusters, it means that you have 10 Coordinators. You can have unlimited number of Agents per cluster.
:::

#### Coordinator JSON config

Here is a basic example of Coordinator configuration. Pay attention to property `TargetScenarios` - it plays a significant role and forms topology of test execution.

```json {8} title="coordinator-config.json"
{
    "ClusterSettings": {
        "Coordinator": {
            "ClusterId": "my_test_cluster",
            "MqttServer": "localhost",
            "MqttPort": 1883,
            
            "TargetScenarios": ["insert_mongo"],
            
            "Agents": [
                { "AgentGroup": "1", "TargetScenarios": ["update_mongo"] },
                { "AgentGroup": "2", "TargetScenarios": ["read_mongo"] }
            ]
        }
    }
}
```

As you can see in Coordinator config, we specified what scenarios will be executed on Coordinator.

```json
"TargetScenarios": ["insert_mongo"]
``` 

Scenarios that will be executed on Agents (AgentGroup will be described in the section about Agent):

```json
"Agents": [
    { "AgentGroup": "1", "TargetScenarios": ["update_mongo"] },
    { "AgentGroup": "2", "TargetScenarios": ["read_mongo"] }
]
``` 

All cluster participants should have the same ClusterId because, it will allow them to see each other.

```json
"ClusterId": "my_test_cluster",
"MqttServer": "localhost",
"MqttPort": 1883
``` 

Coordinator config can also contain `GlobalSettings` from regular NBomber [JSON configuration](json-config). After Coordinator starts and reads the config file, it will send all settings to Agents.

```json {20} title="coordinator-config.json"
{
    "ClusterSettings": {
        "Coordinator": {
            "ClusterId": "my_test_cluster",
            "MqttServer": "localhost",
            "MqttPort": 1883,
            
            "TargetScenarios": ["insert_mongo"],
            
            "Agents": [
                { "AgentGroup": "1", "TargetScenarios": ["update_mongo"] },
                { "AgentGroup": "2", "TargetScenarios": ["read_mongo"] }
            ]
        }
    },

    "TestSuite": "public_api_test_suite",
    "TestName": "purchase_api_test",

    "GlobalSettings": {

        "ScenariosSettings": [
            {
                "ScenarioName": "purchase_api",
                "WarmUpDuration": "00:00:05",

                "LoadSimulationsSettings": [
                    { "InjectPerSec": [100, "00:00:15"] },
                    { "InjectPerSec": [200, "00:00:15"] }
                ],

                "CustomSettings": {
                    "BaseUri": "https://jsonplaceholder.typicode.com"
                }
            }
        ]       
    }
}
```

### Agent
 
Agent acts as a worker who listens to commands from Coordinator and executes the `TargetScenarios`. Agent contains registered Scenarios (similar to Coordinator) to run them. 

#### Agent Group

Another feature of Agent is the mandatory binding to AgentGroup. An AgentGroup provides a group of agents that execute the specified scenarios associated with this group. An AgentGroup can contain either one Agent or many. You can think of an AgentGroup like tagging for an Agent. You can have as many AgentGroups as you want,as they are virtual. 

<center><img src={ClusterAgentGroupsImage} width="80%" height="80%" /></center>

#### Agent JSON config

Here is an example of Agent config file. In this example, we define Agent that is bound to `"AgentGroup": "1"`. As you can see, we don't specify `TargetScenarios` since these options will be passed dynamically by Coordinator. So Agent doesn't know what scenarios will be started until receiving a list of `TargetScenarios` from Coordinator.

```json {7} title="agent-config.json"
{
    "ClusterSettings": {
        "Agent": {
            "ClusterId": "my_test_cluster",
            "MqttServer": "localhost",
            "MqttPort": 1883,
            "AgentGroup": "1"
        }
    }
}
```

All cluster participants should have the same `ClusterId`. This way, they will see each other.

```json
"ClusterId": "my_test_cluster",
"MqttServer": "localhost",
"MqttPort": 1883
``` 

## Step by step introduction

:::note
Installation prerequisites

- [.NET Core 3.1 SDK](https://dotnet.microsoft.com/download) or later.
- [Visual Studio Code](https://code.visualstudio.com/) with [F#](https://marketplace.visualstudio.com/items?itemName=Ionide.Ionide-fsharp) or [C#](https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csharp) extension installed.
:::

### Create console application project

```code
dotnet new console -n [project_name] -lang ["F#" or "C#"]
```
```code
dotnet new console -n NBomberClusterTest -lang "F#"
cd NBomberClusterTest
```

### Add Cluster package

:::note
This package is available in the Enterprise version only.
:::

```code
dotnet add package NBomber.Cluster
```

### Create hello world load test

:::note
We assume that you're familiar with the basics of [NBomber API](general-concepts) and can create and run simple load tests. You should also be familiar with configuring your tests via [JSON configuration](json-config).
:::

NBomber Cluster has the same API as a regular NBomber except:


- NBomber Cluster uses `NBomberClusterRunner` instead of `NBomberRunner`. But it has all the API functions that `NBomberRunner` contains.
- NBomber Cluster uses a bit extended [JSON Configuration](json-config) (it contains `ClusterSettings`) to setup Coordinator or Agent. 

Let's first start with an empty hello world example. In this example, we will define one simple Step and Scenario which does nothing. After this, we will add Coordinator and Agent configs to run them in the cluster mode.

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
open System
open System.Threading.Tasks

open FSharp.Control.Tasks.NonAffine

open NBomber
open NBomber.Contracts
open NBomber.FSharp
open NBomber.Cluster.FSharp

[<EntryPoint>]
let main argv =
    
    let step = Step.create("step", fun context -> task {        
        
        do! Task.Delay(seconds 1)
        return Response.ok()
    })
    
    let scenario = Scenario.create "hello_world" [step]     
    
    // here as you can see, we use NBomberClusterRunner instead of NBomberRunner
    NBomberClusterRunner.registerScenario scenario
    |> NBomberClusterRunner.run
    |> ignore    

    0 // return an integer exit code
```

</TabItem>

<TabItem value="C#">

```csharp
using System;
using System.Threading.Tasks;

using NBomber;
using NBomber.Contracts;
using NBomber.CSharp;
using NBomber.Cluster.CSharp;

namespace NBomberTest
{
    class Program
    {
        static void Main(string[] args)
        {   
            var step = Step.Create("step", async context =>
            {
                await Task.Delay(TimeSpan.FromSeconds(1));
                return Response.Ok();
            });

            var scenario = ScenarioBuilder.CreateScenario("hello_world", step);

            // here as you can see, we use NBomberClusterRunner instead of NBomberRunner
            NBomberClusterRunner
                .RegisterScenarios(scenario)
                .Run();            
        }
    }
}
```

</TabItem>
</Tabs>

If we run this example, it will behave as a regular NBomber test since we didn't define any cluster yet. To build a cluster, we need to define configs for Agent and Coordinator; and then connect them to Message Broker.

### Start Message Broker (MQTT)

Remember that the MQTT message broker is a communication point in the cluster, and we need to create and run it to establish connections between cluster members. To do so, we will use [Docker Compose](https://docs.docker.com/compose/) and [EMQX Docker image](https://hub.docker.com/r/emqx/emqx). Here is an example of our docker-compose file (you can create this file in the current project folder).

```yaml title="docker-compose.yml"
version: '3.4'
services:

  emqx:
    container_name: emqx
    image: emqx/emqx:v4.3.5
    ports:
      - 18083:18083
      - 1883:1883
```

Let's run it by using this command. 

```
docker compose up -d
```

After starting try to open EMQX admin panel by URL: `http://localhost:18083`. The default admin user credentials are: 

```
username: admin 
password: public
``` 

You can use admin panel for diagnostic purposes.

### Start Agent

Let's start with Agent since it's simpler. It should start before Coordinator (as Agent should listen to commands from Coordinator). The main thing for us is to define and load Agent config (agent_config.json).

```fsharp
NBomberClusterRunner.registerScenario scenario
|> NBomberClusterRunner.loadConfig "agent_config.json"
|> NBomberClusterRunner.run
```

Here is an example of Agent config that we load. We see that `ClusterSettings` contains `Agent` settings with connection params to the MQTT broker. For dev purposes, we are going to use the localhost and default MQTT port `1883`. All cluster participants should have the same `ClusterId`. This way, they will see each other. Another quite important option is `AgentGroup`, which should be treated like tagging. Also, you can see that we didn't specify any `TargetScenarios` to run. It's because Agent will receive the list of Scenarios from Coordinator to be run plus `ScenarioSettings`.

```json title="agent-config.json"
{
    "ClusterSettings": {
        "Agent": {
            "ClusterId": "my_test_cluster",
            "MqttServer": "localhost",
            "MqttPort": 1883,
            "AgentGroup": "group_1"
        }
    }
}
```

### Start Coordinator

Coordinator contains the same list of scenarios as Agent but uses a different config file and should be started after all Agents.

```fsharp
NBomberClusterRunner.registerScenario scenario
|> NBomberClusterRunner.loadConfig "coordinator_config.json"
|> NBomberClusterRunner.run
```

Here is an example of Coordiantor config that we load.

```json title="coordinator_config.json"
{
    "ClusterSettings": {
        "Coordinator": {
            "ClusterId": "my_test_cluster",
            "MqttServer": "localhost",
            "MqttPort": 1883,
            
            "TargetScenarios": ["hello_world"],
            
            "Agents": [
                { "AgentGroup": "group_1", "TargetScenarios": ["hello_world"] }                 
            ]
        }
    }
}
```

In Coordinator config we defined `TargetScenarios` to run on Coordinator.

```json
"TargetScenarios": ["hello_world"]
```

And also we defined `TargetScenarios` for Agents (via AgentGroup).

```json
"Agents": [
    { "AgentGroup": "group_1", "TargetScenarios": ["hello_world"] }                 
]
```

### Load config file dynamically

Instead of hardcoded file path you can use CLI arguments.

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
let main argv =

    // The following CLI commands are supported:
    // -c or --config: loads configuration,
    // -i or --infra: loads infrastructure configuration.
    
    NBomberClusterRunner.registerScenarios [scenario1; scenario2; scenario3]
    |> NBomberClusterRunner.runWithArgs argv
    //|> NBomberClusterRunner.runWithArgs ["--config=agent-config.json"]
    //|> NBomberClusterRunner.runWithArgs ["--config=coordinator-config.json"]
```

</TabItem>

<TabItem value="C#">

```csharp
static void Main(string[] args)
{
    // The following CLI commands are supported:
    // -c or --config: loads configuration,
    // -i or --infra: loads infrastructure configuration.

    NBomberClusterRunner
        .RegisterScenarios(scenario1, scenario2, scenario3)                
        .Run(args);
        //.Run("--config=agent-config.json")
        //.Run("--config=coordinator-config.json")
}
```

</TabItem>
</Tabs>
