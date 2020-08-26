---
id: plugins-http
title: HTTP plugin
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about NBomber.HTTP plugin in more detail.

- [Overview](plugins-http#overview)
- [API](plugins-http#api)
- [Advanced logging (tracing)](plugins-http#advanced-logging-tracing)
- [JSON parsing](plugins-http#json-parsing)
- [Best practices](plugins-http#best-practices)

## Overview

The NBomber.Http provides a simple API to define HTTP steps, handle responses in an efficient way (without waiting on full response body but rather first bytes), calculate response size, apply assertions.

Add HTTP package

```code
dotnet add package NBomber.Http
```

Create HTTP load test

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
open FSharp.Control.Tasks.V2.ContextInsensitive
open NBomber.Contracts
open NBomber.FSharp
open NBomber.Plugins.Network.Ping
open NBomber.Plugins.Http.FSharp

[<EntryPoint>]
let main argv =
        
    // it's optional Ping plugin that brings additional reporting data
    let pingConfig = PingPluginConfig.CreateDefault ["nbomber.com"]
    use pingPlugin = new PingPlugin(pingConfig)

    let step = HttpStep.create("fetch_html_page", fun context ->
        Http.createRequest "GET" "https://nbomber.com"                       
    )
    
    Scenario.create "nbomber_web_site" [step]     
    |> Scenario.withLoadSimulations [InjectPerSec(rate = 100, during = seconds 30)]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.withWorkerPlugins [pingPlugin]
    |> NBomberRunner.run
    |> ignore

    0 // return an integer exit code
```
</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
using System;
using NBomber.Contracts;
using NBomber.CSharp;
using NBomber.Plugins.Http.CSharp;
using NBomber.Plugins.Network.Ping;

namespace CSharp
{
    public class Program
    {
        static void Main(string[] args)
        {
            var step = HttpStep.Create("fetch_html_page", context =>
                Http.CreateRequest("GET", "https://nbomber.com")                    
            );

            var scenario = ScenarioBuilder
                .CreateScenario("nbomber_web_site", step)                
                .WithLoadSimulations(new[]
                {
                    Simulation.InjectPerSec(rate: 100, during: TimeSpan.FromSeconds(30))
                });

            var pingPluginConfig = PingPluginConfig.CreateDefault("nbomber.com");
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

## API

### Http headers

By default NBomber sets no headers.

```fsharp
Http.withHeader "Accept" "application/json"
```

### Http body

```fsharp
Http.withBody(new StringContent(json))
Http.withBody(new ByteArrayContent(bytes))
```

### Http check response

By default, NBomber is using this check for every response but you can override it per step.

```fsharp
Http.withCheck(fun response -> task {
    return if response.IsSuccessStatusCode then Response.Ok() 
           else Response.Fail("status code: " + response.StatusCode.ToString())
})
```

### Advanced example

Here you can find a full example using all API functions.

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
let userFeed = ["1"; "2"; "3"; "4"; "5"]
               |> FeedData.fromSeq
               |> Feed.createRandom "userFeed"

let getUser = HttpStep.create("get_user", userFeed, fun context ->

    let userId = context.FeedItem
    let url = "https://jsonplaceholder.typicode.com/users?id=" + userId

    Http.createRequest "GET" url
    |> Http.withCheck(fun response -> task {
        let! json = response.Content.ReadAsStringAsync()

        // parse JSON
        let users = json
                    |> JsonConvert.DeserializeObject<UserResponse[]>
                    |> ValueOption.ofObj

        match users with
        | ValueSome usr when usr.Length = 1 ->
            return Response.Ok(usr.[0]) // we pass user object response to the next step

        | _ -> return Response.Fail("not found user: " + userId)
    })
)

// this 'getPosts' will be executed only if 'getUser' finished OK.
let getPosts = HttpStep.create("get_posts", fun context ->

    let user = context.GetPreviousStepResponse<UserResponse>()
    let url = "https://jsonplaceholder.typicode.com/posts?userId=" + user.Id

    Http.createRequest "GET" url
    |> Http.withCheck(fun response -> task {
        let! json = response.Content.ReadAsStringAsync()

        // parse JSON
        let posts = json
                    |> JsonConvert.DeserializeObject<PostResponse[]>
                    |> ValueOption.ofObj

        match posts with
        | ValueSome ps when ps.Length > 0 ->
            return Response.Ok()

        | _ -> return Response.Fail()
    })
)

// it's optional Ping plugin that brings additional reporting data
let pingPluginConfig = PingPluginConfig.CreateDefault ["jsonplaceholder.typicode.com"]
let pingPlugin = new PingPlugin(pingPluginConfig)

Scenario.create "rest_api" [getUser; getPosts]
|> Scenario.withWarmUpDuration(seconds 5)
|> Scenario.withLoadSimulations [InjectPerSec(rate = 100, during = seconds 30)]
|> NBomberRunner.registerScenario
|> NBomberRunner.withWorkerPlugins [pingPlugin]
|> NBomberRunner.withTestSuite "http"
|> NBomberRunner.withTestName "advanced_test"
|> NBomberRunner.run
|> ignore
```
</TabItem>
<TabItem value="C#">

```csharp
var userFeed = Feed.CreateRandom(
    name: "userFeed",
    provider: FeedData.FromSeq(new[] {"1", "2", "3", "4", "5"})
);

var getUser = HttpStep.Create("get_user", userFeed, context =>
{
    var userId = context.FeedItem;
    var url = $"https://jsonplaceholder.typicode.com/users?id={userId}";

    return Http.CreateRequest("GET", url)
        .WithCheck(async response =>
        {
            var json = await response.Content.ReadAsStringAsync();

            // parse JSON
            var users = JsonConvert.DeserializeObject<UserResponse[]>(json);

            return users?.Length == 1
                ? Response.Ok(users.First()) // we pass user object response to the next step
                : Response.Fail($"not found user: {userId}");
        });
});

// this 'getPosts' will be executed only if 'getUser' finished OK.
var getPosts = HttpStep.Create("get_posts", context =>
{
    var user = context.GetPreviousStepResponse<UserResponse>();
    var url = $"https://jsonplaceholder.typicode.com/posts?userId={user.Id}";

    return Http.CreateRequest("GET", url)
        .WithCheck(async response =>
        {
            var json = await response.Content.ReadAsStringAsync();

            // parse JSON
            var posts = JsonConvert.DeserializeObject<PostResponse[]>(json);

            return posts?.Length > 0
                ? Response.Ok()
                : Response.Fail($"not found posts for user: {user.Id}");
        });
});

var scenario = ScenarioBuilder
    .CreateScenario("rest_api", getUser, getPosts)
    .WithWarmUpDuration(TimeSpan.FromSeconds(5))
    .WithLoadSimulations(new[]
    {
        Simulation.InjectPerSec(rate: 100, during: TimeSpan.FromSeconds(30))
    });

var pingPluginConfig = PingPluginConfig.CreateDefault(new[] {"jsonplaceholder.typicode.com"});
var pingPlugin = new PingPlugin(pingPluginConfig);

NBomberRunner
    .RegisterScenarios(scenario)
    .WithWorkerPlugins(pingPlugin)
    .WithTestSuite("http")
    .WithTestName("advanced_test")
    .Run();
```
</TabItem>
</Tabs>

## Advanced logging (tracing)

There may be situations when you need to trace your requests and responses. The NBomber.Http has built-in this functionality for tracing every request/response. In order to start tracing you need to switch minimum logging level to verbose.

:::important
Make sure that you always return a new instance (not from a variable) of LoggerConfiguration. This limitation is mandatory since Serilog logger does not allow to create multiple instances from the same instance of LoggerConfiguration.  
:::

```fsharp
NBomberRunner.withLoggerConfig(fun () ->
    LoggerConfiguration().MinimumLevel.Verbose()
)
```

## JSON parsing

To work with the JSON format, you can use any library you prefer. Here is a list of popular libraries:

- [Newtonsoft.Json](https://github.com/JamesNK/Newtonsoft.Json)
- [System.Text.Json](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-how-to)
- [Utf8Json](https://github.com/neuecc/Utf8Json)

## Best practices 

- To test HTTP use **LoadSimulation.InjectPerSec** since usually web server is an open system. You can read more [here](core-abstractions#load-simulations).
- For debugging or tracing you can use **LoadSimulation.KeepConstant** with **copies = 1** since for this simulation NBomber will use a single task which is easier to debug.
- Use [Ping](plugins-ping) plugin to get more info about networking.