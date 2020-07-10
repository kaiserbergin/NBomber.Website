---
id: test-automation
title: Test automation
---

This document will help you learn about available options to automate your tests:

- [Test Assertions](#test-assertions)
- [Test runner integration](#test-runner-integration)
- [CI/CD integration](#cicd-integration)

## Test Assertions

The Assertions are used to verify that global statistics like response time or a number of failed requests match expectations for a whole simulation. After the test finished [NBomberRunner](./core-abstractions#nbomber-runner) returns [Statistic](./api-contracts#statistics-types) data that you can use to apply assertions.

```fsharp
stats.RequestCount > 10_000 // all request count
stats.OkCount > 10_000      // ok request count 
stats.FailCount = 0         // fail request count
stats.Min < 50              // min response latency
stats.Mean < 100            // mean response latency
stats.Max < 200             // max response latency
stats.RPS = 1_000           // request per second count
stats.Percent50 < 50        // 50% of response latency
stats.Percent75 < 100       // 75% of response latency
stats.Percent95 < 100       // 95% of response latency
stats.MinDataKb < 50.0      // min item size that transferred during scenario
stats.MeanDataKb < 50.0     // mean item size that transferred during scenario
stats.MaxDataKb < 50.0      // max item size item that transferred during scenario
stats.AllDataMB < 50.0      // all data that transferred during scenario 
```

## Test runner integration

:::note

NBomber doesn't have any dependency on test runner or assertions API therefore feel free to use your favorite test libs to integrate NBomber tests.

:::

Here you can find a list of popular test libs to integrate with NBomber tests:

- Test runners & assertions: [xUnit](https://xunit.net/), [NUnit](https://nunit.org/)
- Advanced test assertions: [Fluent Assertions](https://github.com/fluentassertions/fluentassertions), [Unquote (F# only)](https://github.com/SwensenSoftware/unquote)

For F# example we will use XUnit and Unquote therefore we need to install dependencies.

```code
dotnet add package xunit
dotnet add package xunit.runner.visualstudio
dotnet add package Unquote
dotnet add package Microsoft.NET.Test.Sdk
```

In terms of integration, NBomber test should be treated like any other piece of code that you can run using a test framework like xUnit or NUnit. Here is an example that you can run/debug from your IDE:

```fsharp
open System
open System.Threading.Tasks
open Xunit
open Swensen.Unquote
open FSharp.Control.Tasks.V2.ContextInsensitive
open NBomber.Contracts
open NBomber.FSharp

[<Fact>]
let ``xUnit test`` () =

    let step = Step.create("step_1", fun context -> task {
        do! Task.Delay(seconds 1)
        return Response.Ok()
    })
    
    Scenario.create "scenario_1" [step]
    |> Scenario.withoutWarmUp
    |> Scenario.withLoadSimulations [KeepConcurrentScenarios(1, seconds 5)]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.run
    |> function
        | Ok nodeStats ->
            
            let stepStats = nodeStats.ScenarioStats 
                            |> Array.find(fun scenario -> scenario.Name = "scenario_1")
                            |> Array.find(fun step -> step.Name = "step_1")

            // you can use direct access by index
            // let stepStats = nodeStats.ScenarioStats.[0].StepStats.[0]
            
            test <@ stepStats.OkCount > 2 @>
            test <@ stepStats.RPS > 8 @>

        | Error msg -> failwith msg
```

## CI/CD integration

An important benefit that load testing brings is the certainty that your system does not degrade with the addition of new features or refactoring of old ones. In the worst case, you would like to be notified as quickly as possible that after certain changes your system began to degrade. These days it is much more widely accepted that load testing should start on the system as early as is feasibly possible, even when it is still in the early stages of development. It's why load testing should be build into the CI/CD pipeline.

In order to get integration you need:

1. Integrate NBomber test with your current or favorite [test runner](#test-runner-integration) (*in terms of execution, your NBomber test will behave like a simple unit test*).
2. Find an appropriate plugin for your test automation server to run your test (*for example, if you use [Jenkins](https://www.jenkins.io) for test automation server [xUnit](https://plugins.jenkins.io/xunit) and [NUnit](https://plugins.jenkins.io/nunit) integration plugins*).