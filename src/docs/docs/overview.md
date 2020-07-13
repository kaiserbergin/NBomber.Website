---
id: overview
title: Overview
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

Welcome to NBomber! This tutorial will explore the basics of using NBomber and help you get familiar with it at a high level.

### Why we build NBomber and what you can do with it?

1. The main reason behind NBomber is to provide a **lightweight** framework for writing load tests which you can use to test literally **any** system and simulate **any** production workload. 
2. Another goal was to provide building blocks to validate your POC(proof of concept) projects by applying any complex load distribution.  
3. With NBomber you can test any PULL or PUSH system(HTTP, WebSockets, GraphQl, gRPC, SQL Databse, MongoDb, Redis etc). 

NBomber as a modern framework provides:
- Zero dependencies on protocol (HTTP/WebSockets/AMQP/SQL) 
- Zero dependencies on semantic model (Pull/Push)
- Very flexible configuration and dead simple API
- Cluster support
- Realtime metrics
- [CI/CD integration](./test-automation#cicd-integration)
- Plugins/extensions support
- Data feed support 

## Step by step introduction

:::note

Installation prerequisites

- [.NET Core 2.1 SDK](https://dotnet.microsoft.com/download) or later.
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

Let's fist start with an empty hello world example to get more familiar with NBomber. In this example, we will define one simple Step and Scenario which does nothing.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp title="/Program.fs"
open System
open System.Threading.Tasks
open FSharp.Control.Tasks.V2.ContextInsensitive
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

        do! Task.Delay(TimeSpan.FromSeconds 1.0)
        return Response.Ok()
    })

    // second, we add our step to the scenario
    // scenario is basically a container for steps
    // you can think of scenario like a job of sequential operations
    // you can add several steps into one scenario

    Scenario.create "hello_world" [step]     
    |> NBomberRunner.registerScenario
    |> NBomberRunner.run
    |> ignore    

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

```csharp title="/Program.cs"
using System;
using System.Threading.Tasks;
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

                await Task.Delay(TimeSpan.FromSeconds(1.0));
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

After running a test you will get report. Don't be scary, we can skip it for now, later we will understand how to analyse such reports.

### Create simple HTTP load test

Now, let's add HTTP client to test some web server and then run it. 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp title="/Program.fs"
open System
open System.Net.Http
open FSharp.Control.Tasks.V2.ContextInsensitive
open NBomber.Contracts
open NBomber.FSharp

[<EntryPoint>]
let main argv =
    
    use httpClient = new HttpClient()
    
    let step = Step.create("step", fun context -> task {        
        
        let! response = httpClient.GetAsync("https://nbomber.com",
                                            context.CancellationToken)

        match response.IsSuccessStatusCode with
        | true  -> return Response.Ok()
        | false -> return Response.Fail()
    })
    
    Scenario.create "hello_world" [step] 
    |> NBomberRunner.registerScenario
    |> NBomberRunner.run
    |> ignore

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

</TabItem>
</Tabs>


### Create production-ready HTTP load test

Now, you got a basic understanding of NBomber and ready to move on. This time we will use:
- [NBomber.HTTP](https://github.com/PragmaticFlow/NBomber.Http) plugin to simplify defining and handling of HTTP
- NBomber.PingPlugin to add additional reporting 
- Specify load simulation

So, we only need to install missed NBomber.Http package (*NBomber.PingPlugin is included as part of NBomber, we don't need to install it*).

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

```fsharp title="/Program.fs"
open System
open System.Net.Http
open FSharp.Control.Tasks.V2.ContextInsensitive
open NBomber.Contracts
open NBomber.FSharp
open NBomber.Plugins.Network.Ping
open NBomber.Plugins.Http.FSharp

[<EntryPoint>]
let main argv =
    
    let pingConfig = PingPluginConfig.CreateDefault ["nbomber.com"]
    use pingPlugin = new PingPlugin(pingConfig)
    
    // now you use HttpStep instead of NBomber's default Step        
    let step = HttpStep.create("fetch_html_page", fun context ->
        Http.createRequest "GET" "https://nbomber.com"        
    )
    
    Scenario.create "hello_world" [step]     
    |> Scenario.withLoadSimulations [
        InjectScenariosPerSec(100, TimeSpan.FromSeconds 10.0)
    ]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.run
    |> ignore

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

</TabItem>
</Tabs>

## Congratulations! You have done it!

Finally, you reach this point! Here you can find additional information which helps you in building real world NBomber tests:

- [View and analyze reports](./analyze-reports)
- [Add dynamic configuration](./configuration)
- [Add test assertions and CI/CD integration](./test_assertions)
- [Add realtime metrics](./realtime_metrics)
- [Add distributed cluster support](./cluster_overview)

Now, let's add HTTP client to test some web server.

5. View and analyze statistics results

> put link on html, txt reports, write explanation about RPS, min, max

6. Add test runner integration and test assertions

After several runs of this test, you will be able to define asserts based on statistics result. For this you need to wrap your NBomber load test into your favorite unit test framework([NUnit](https://nunit.org/), [XUnit](https://xunit.net/), [Expecto](https://github.com/haf/expecto)). [Read more](./test_assertions)

You can think of NBomber as a process that runs load tests and returns the result and then it's your decision what to do with this result(ignore, analyze, throw an exception).

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

For F# example we will use [XUnit](https://xunit.net/) and [Unquote](https://github.com/SwensenSoftware/unquote) library.
```fsharp
open System
open System.Threading.Tasks
open Xunit
open Swensen.Unquote
open FSharp.Control.Tasks.V2.ContextInsensitive
open NBomber.Contracts
open NBomber.FSharp

[<Fact>]
let ``NBomber load test`` () =

    let step = Step.create("step", fun context -> task {
        do! Task.Delay(TimeSpan.FromSeconds 1.0)
        return Response.Ok()
    })

    Scenario.create "hello_world" [step]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.run
    |> function
        | Ok stats ->
            let stepStats = stats.ScenarioStats.[0].StepStats.[0]
            test <@ stepStats.OkCount > 2 @>
            test <@ stepStats.FailCount = 0 @>            
        
        | Error msg -> failwith msg
```
</TabItem>

<TabItem value="C#">

For C# example we will use [NUnit](https://nunit.org/)
```csharp
using System;
using System.Threading.Tasks;
using NUnit.Framework;
using NBomber.Contracts;
using NBomber.CSharp;

namespace NUnitNBomberTest
{
    public class Tests
    {
        [Test]
        public void NBomber_Load_Test()
        {   
            var step = Step.Create("step", async context =>
            {                
                await Task.Delay(TimeSpan.FromSeconds(1.0));
                return Response.Ok();
            });
            
            var scenario = ScenarioBuilder.CreateScenario("hello_world", step);
            var stats = NBomberRunner.RegisterScenarios(scenario).Run();
            
            Assert.IsTrue(stepStats.OkCount > 2);
            Assert.IsTrue(stepStats.FailCount == 0);            
        }
    }
}
```
</TabItem>
</Tabs>

7. Integrate load test into your CI/CD pipeline

Now you can easily integrate NBomber load tests into your CI/CD pipeline (Jenkins, TeamCity, Bamboo) since NBomber test can be executed by any popular unit test framework.

8. Add realtime metrics

NBomber provides a way to sink your test results in any data storage. It helps you track performance trends in a realtime and make comparison with previous results(historicals). [Read mode]()