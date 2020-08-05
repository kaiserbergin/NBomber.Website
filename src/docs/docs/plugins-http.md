---
id: plugins-http
title: HTTP
---

This document will help you learn about NBomber.HTTP plugin in more detail.

- [Overview](plugins-http#overview)
- [API](plugins-http#api)
- [Advanced logging](plugins-http#advanced-logging)
- CLI support

## Overview

The NBomber.Http provides a simple API to define HTTP steps, handle responses in an efficient way (without waiting on full response body but rather first bytes), calculate response size, apply assertions.

Add HTTP package

```code
dotnet add package NBomber.Http
```

Create HTTP load test

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
    
    Scenario.create "hello_world" [step]     
    |> Scenario.withLoadSimulations [
        InjectPerSec(rate = 100, during = seconds 10)
    ]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.withPlugins [pingPlugin]
    |> NBomberRunner.run
    |> ignore

    0 // return an integer exit code
```

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
    if response.IsSuccessStatusCode then
        return Response.Ok() 
    else
        return Response.Fail("status code: " + response.StatusCode.ToString())
})
```

### Full example

Here you can find a full example using all API functions.

```fsharp
// it's optional Ping plugin that brings additional reporting data
let pingConfig = PingPluginConfig.CreateDefault ["https://test-api.com"]
use pingPlugin = new PingPlugin(pingConfig)

let searchUser = HttpStep.create("search user", userIdFeed, fun context ->
    
    let url = "https://test-api.com/api/v1/users?q=userId=" + context.FedItem
    
    Http.createRequest "GET" url
    |> Http.withHeader "Accept" "application/json"
    |> Http.withCheck(fun response -> task {
        let! body = response.Content.ReadAsStringAsync()
        let response = JsonConvert.DeserializeObject<SearchResponse>(body)
        if response.Data.Length = 1 then
            let user = response.Data.[0]
            return Response.Ok(user)
        else
            return Response.Fail()
    })
)

let updateUser = HttpStep.create("update user", fun context -> 
    let user = context.GetPreviousStepResponse<User>()
    
    let json = { user with Age = user.Age + 1 } 
               |> JsonConvert.SerializeObject
        
    Http.createRequest "PUT" "https://test-api.com/api/v1/users"
    |> Http.withHeader "Accept" "application/json"
    |> Http.withBody(new StringContent(json))
)

Scenario.create "test-user-api" [searchUser; updateUser]     
|> Scenario.withLoadSimulations [
    InjectPerSec(rate = 100, during = seconds 30)
]
|> NBomberRunner.registerScenario
|> NBomberRunner.withPlugins [pingPlugin]
|> NBomberRunner.run
|> ignore
```

## Advanced logging

There may be situations when you need to trace your requests and responses. The NBomber.Http has built-in this functionality for tracing every request/response. In order to start tracing you need to switch minimum logging level to verbose.

```fsharp
NBomberRunner.withLoggerConfig(fun () ->
    LoggerConfiguration().MinimumLevel.Verbose()
)
```

## CLI support

TBD