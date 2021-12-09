---
id: overview
title: Overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Welcome to NBomber! This tutorial will explore the basics of using NBomber and help you get familiar with it at a high level.

### Why we build NBomber and what you can do with it?

1. The main reason behind NBomber is to provide a **lightweight** framework for writing load tests which you can use to test literally **any** system and simulate **any** production workload. We wanted to provide only a few abstractions so that we could describe any type of load and still have a simple, intuitive API. 
2. Another goal is to provide building blocks to validate your POC (proof of concept) projects by applying any complex load distribution.  
3. With NBomber you can test any PULL or PUSH system (HTTP, WebSockets, GraphQl, gRPC, SQL Databse, MongoDb, Redis etc). 
4. With NBomber **you can convert some of your integration tests to load tests easily**.

NBomber as a modern framework provides:
- Zero dependencies on protocol (HTTP/WebSockets/AMQP/SQL) 
- Zero dependencies on semantic model (Pull/Push)
- Very flexible configuration and dead simple API (F#/C#/JSON)
- [Cluster support](nbomber-cluster)
- [Plugins support](plugins-overview)
- [Realtime reporting](reporting-overview)
- CI/CD integration
- [DataFeed support](general-concepts#datafeed)

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
dotnet new console -n NBomberTest -lang "F#"
cd NBomberTest
```

### Add NBomber package

```code
dotnet add package NBomber
```

### Create hello world load test

Let's first start with an empty hello world example to get more familiar with NBomber. In this example, we will define one simple Step and Scenario which does nothing.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp title="Program.fs"
open System
open System.Threading.Tasks

open FSharp.Control.Tasks.NonAffine

open NBomber
open NBomber.Contracts
open NBomber.FSharp

[<EntryPoint>]
let main argv =
    
    // first, you need to create a step
    // step is a basic element of every scenario which will be executed and measured
    // every step is running in separated lightweight Task
    // you can run concurrently hundreds steps - it's cheap
    
    let step = Step.create("step", fun context -> task {
        
        // you can define and execute any logic here,
        // for example: send http request, SQL query etc
        // NBomber will measure how much time it takes to execute your step

        do! Task.Delay(seconds 1)
        return Response.ok()
    })

    // second, we add our step to the scenario
    // scenario is basically a container for steps
    // you can think of scenario like a job of sequential operations
    // you can add several steps into one scenario

    let scenario = Scenario.create "hello_world" [step]     
    
    NBomberRunner.registerScenario scenario
    |> NBomberRunner.run
    |> ignore    

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
using System;
using System.Threading.Tasks;

using NBomber;
using NBomber.Contracts;
using NBomber.CSharp;

namespace NBomberTest
{
    class Program
    {
        static void Main(string[] args)
        {   
            // first, you need to create a step
            var step = Step.Create("step", async context =>
            {
                // you can define and execute any logic here,
                // for example: send http request, SQL query etc
                // NBomber will measure how much time it takes to execute your logic

                await Task.Delay(TimeSpan.FromSeconds(1));
                return Response.Ok();
            });
            
            // second, we add our step to the scenario
            var scenario = ScenarioBuilder.CreateScenario("hello_world", step);

            NBomberRunner
                .RegisterScenarios(scenario)
                .Run();
        }
    }
}
```
</TabItem>
</Tabs>


### Run load test

```code
dotnet run -c Release
```

After running a test you will get a report. Don't get scared, we can skip it for now. Later we will understand how to analyse such reports.

### Create simple HTTP load test (not production-ready)

Now, let's add HTTP client to test a web server and then run it. 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp title="Program.fs"
open System
open System.Net.Http

open FSharp.Control.Tasks.NonAffine

open NBomber
open NBomber.Contracts
open NBomber.FSharp

[<EntryPoint>]
let main argv =
    
    use httpClient = new HttpClient()

    let step = Step.create("fetch_html_page", fun context -> task {

        let! response = httpClient.GetAsync("https://nbomber.com")

        return if response.IsSuccessStatusCode then Response.ok()
               else Response.fail()
    })

    let scenario = Scenario.create "simple_http" [step]        
    
    NBomberRunner.registerScenario scenario
    |> NBomberRunner.run
    |> ignore

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
using System;
using System.Net.Http;

using NBomber;
using NBomber.Contracts;
using NBomber.CSharp;

namespace NBomberTest
{
    class Program
    {
        static void Main(string[] args)
        {   
            using var httpClient = new HttpClient();

            var step = Step.Create("fetch_html_page", async context =>
            {
                var response = await httpClient.GetAsync("https://nbomber.com");

                return response.IsSuccessStatusCode
                    ? Response.Ok()
                    : Response.Fail();
            });

            var scenario = ScenarioBuilder.CreateScenario("simple_http", step);

            NBomberRunner
                .RegisterScenarios(scenario)
                .Run();
        }
    }
}
```

</TabItem>
</Tabs>


### Create production-ready HTTP load test

Now, you got a basic understanding of NBomber and ready to move on. This time we will use:
- [NBomber.HTTP](plugins-http) - plugin to simplify defining and handling of HTTP
- [NBomber.PingPlugin](plugins-ping) - to add additional reporting 
- Concurrency

To proceed we only need to install NBomber.Http package (*NBomber.PingPlugin is included as part of NBomber, we don't need to install it*).

```code
dotnet add package NBomber.Http
```

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp title="Program.fs"
open NBomber
open NBomber.Contracts
open NBomber.FSharp
open NBomber.Plugins.Http.FSharp
open NBomber.Plugins.Network.Ping

[<EntryPoint>]
let main argv =    
    
    let step = Step.create("fetch_html_page", 
                           clientFactory = HttpClientFactory.create(), 
                           execute = fun context ->

        Http.createRequest "GET" "https://nbomber.com"
        |> Http.withHeader "Accept" "text/html"
        |> Http.send context
    })    
    
    let scenario =
        Scenario.create "simple_http" [step]     
        |> Scenario.withWarmUpDuration(seconds 5)
        |> Scenario.withLoadSimulations [
            InjectPerSec(rate = 100, during = seconds 30)
        ]    
    
    // creates ping plugin that brings additional reporting data
    let pingConfig = PingPluginConfig.CreateDefault ["nbomber.com"]
    use pingPlugin = new PingPlugin(pingConfig)

    NBomberRunner.registerScenario scenario
    |> NBomberRunner.withWorkerPlugins [pingPlugin]    
    |> NBomberRunner.run
    |> ignore

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
using System;

using NBomber;
using NBomber.Contracts;
using NBomber.CSharp;
using NBomber.Plugins.Http.CSharp;
using NBomber.Plugins.Network.Ping;

namespace NBomberTest
{
    class Program
    {
        static void Main(string[] args)
        {   
            var step = Step.Create("fetch_html_page", 
                                   clientFactory: HttpClientFactory.Create(), 
                                   execute: context =>
            {
                var request = Http.CreateRequest("GET", "https://nbomber.com")
                                  .WithHeader("Accept", "text/html");

                return Http.Send(request, context);
            }

            var scenario = ScenarioBuilder
                .CreateScenario("simple_http", step)
                .WithWarmUpDuration(TimeSpan.FromSeconds(5))
                .WithLoadSimulations(
                    Simulation.InjectPerSec(rate: 100, during: TimeSpan.FromSeconds(30))
                );

            // creates ping plugin that brings additional reporting data
            var pingPluginConfig = PingPluginConfig.CreateDefault(new[] {"nbomber.com"});
            var pingPlugin = new PingPlugin(pingPluginConfig);                

            NBomberRunner
                .RegisterScenarios(scenario)
                .WithWorkerPlugins(pingPlugin)
                .Run();
        }
    }
}
```

</TabItem>
</Tabs>

## Congratulations! You have done it!

Finally, you reach this point! Here you can find additional information which helps you in building real world NBomber tests:

- [Learn general concepts](general-concepts)
- [Loadtesting basics](loadtesting-basics)
- [Examples](https://github.com/PragmaticFlow/NBomber/tree/dev/examples)