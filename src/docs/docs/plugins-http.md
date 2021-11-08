---
id: plugins-http
title: HTTP plugin
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about NBomber.HTTP plugin in more detail.

- [Overview](plugins-http#overview)
- [HTTP API](plugins-http#http-api)
- [HTTP ClientFactory](plugins-http#http-clientfactory)
- [Tracing](plugins-http#tracing)
- [JSON parsing](plugins-http#json-parsing)
- [Best practices](plugins-http#best-practices)

## Overview

NBomber.Http provides a simple API to define HTTP steps, calculate response size, apply assertions.

Add HTTP package into your project.

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

open FSharp.Control.Tasks.NonAffine

open NBomber.Contracts
open NBomber.FSharp
open NBomber.Plugins.Network.Ping
open NBomber.Plugins.Http.FSharp

[<EntryPoint>]
let main argv =
        
    // it's optional Ping plugin that brings additional reporting data
    let pingConfig = PingPluginConfig.CreateDefault "nbomber.com"
    let pingPlugin = new PingPlugin(pingConfig)

    let httpFactory = HttpClientFactory.create()

    let step = Step.create("simple step", clientFactory = httpFactory, execute = fun context ->
        Http.createRequest "GET" "https://nbomber.com"
        |> Http.withHeader "Accept" "text/html"
        |> Http.withBody(new StringContent("{ some JSON }"))
        |> Http.withCheck(fun response -> task {            
            return if response.IsSuccessStatusCode then Response.ok()
                   else Response.fail()
        })
        |> Http.send context
    )

    Scenario.create "nbomber-web-site" [step]
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
using System.Net.Http;

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
            var pingPluginConfig = PingPluginConfig.CreateDefault("nbomber.com");
            var pingPlugin = new PingPlugin(pingPluginConfig);

            var httpFactory = HttpClientFactory.Create();

            var step = Step.Create("simple step", clientFactory: httpFactory, execute: async context =>
            {
                var request =
                    Http.CreateRequest("GET", "https://nbomber.com")
                        .WithHeader("Accept", "text/html")
                        .WithBody(new StringContent("{ some JSON }"))
                        .WithCheck(async (response) =>                            
                            response.IsSuccessStatusCode
                                ? Response.Ok()
                                : Response.Fail()
                        );

                var response = await Http.Send(request, context);
                return response;
            });

            var scenario = ScenarioBuilder
                .CreateScenario("nbomber-web-site", step)                
                .WithLoadSimulations(Simulation.InjectPerSec(100, TimeSpan.FromSeconds(30)));

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

## HTTP API

NBomber.Http provides HTTP API that can be used to create/send request and check response. It supports HTTP protocol specific concepts like HEADERS, BODY, VERSION.

### HTTP Request

NBomber.Http provides a convenient way to define HTTP request and then send it.

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
let httpFactory = HttpClientFactory.create();

let step1 = Step.create("step 1", clientFactory = httpFactory, execute = fun context ->
    Http.createRequest "GET" "https://nbomber.com"    
    |> Http.send context
)

let step2 = Step.create("step 2", clientFactory = httpFactory, execute = fun context -> task {
    let step1Response = context.GetPreviousStepResponse<HttpResponseMessage>()
    let headers = step1Response.Headers
    let! body = step1Response.Content.ReadAsStringAsync()

    return! Http.createRequest "GET" "https://nbomber.com"            
            |> Http.send context
})
```

</TabItem>

<TabItem value="C#">

```csharp
var httpFactory = HttpClientFactory.Create();

var step1 = Step.Create("step 1", clientFactory: httpFactory, execute: async context =>
{
    var request = Http.CreateRequest("GET", "https://nbomber.com");
    var response = await Http.Send(request, context);
    return response;
});

var step2 = Step.Create("step 2", clientFactory: httpFactory, execute: async context =>
{
    var step1Response = context.GetPreviousStepResponse<HttpResponseMessage>();
    var headers = step1Response.Headers;
    var body = await step1Response.Content.ReadAsStringAsync();

    var request = Http.CreateRequest("GET", "https://nbomber.com");
    var response = await Http.Send(request, context);
    return response;
});
```

</TabItem>
</Tabs>

### HTTP Version

By default, NBomber.Http sets HTTP Version 1.1 but you can override this.

```fsharp
Http.withVersion "2.0"
```

### HTTP Headers

By default, NBomber.Http sets no headers but you can override this.

```fsharp
Http.withHeader "Accept" "application/json"
```

### HTTP Body

```fsharp
// here we set string content
Http.withBody(new StringContent json)

// here we set binary data
Http.withBody(new ByteArrayContent bytes)
```

### HTTP Check Response

By default, NBomber.Http is using this check for every response but you can override it.

```fsharp
Http.withCheck(fun response -> task {
    if response.IsSuccessStatusCode then
        return Response.ok(response, statusCode = int response.StatusCode)
    else
        return Response.fail(statusCode = int response.StatusCode)
})
```

## HTTP ClientFactory

NBomber.Http provides `HttpClientFactory` abstraction that can be used to init a base HttpClient that will be used within your test.

:::note
NBomberHttpClientFactory creates only one instance of HttpClient and uses it for all steps. You can override it if you need it.
:::

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
let httpFactory = HttpClientFactory.create();

let step1 = Step.create("step 1", clientFactory = httpFactory, execute = fun context ->
    Http.createRequest "GET" "https://nbomber.com"    
    |> Http.send context
)
```

</TabItem>

<TabItem value="C#">

```csharp
var httpFactory = HttpClientFactory.Create();

var step1 = Step.Create("step 1", clientFactory: httpFactory, execute: async context =>
{
    var request = Http.CreateRequest("GET", "https://nbomber.com");
    var response = await Http.Send(request, context);
    return response;
});
```

</TabItem>
</Tabs>

### HTTP Client Timeout

By default, NBomber.Http uses HttpClient with default timeout for 100 seconds. A Domain Name System (DNS) query may take up to 15 seconds to return or time out. You can adjust and set a cutom timeout.

:::note
Also, pay attention that NBomber [Step has a default timeout](general-concepts#step-timeout) for 1 second. 
:::

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
let myHttpClient = new HttpClient()
myHttpClient.Timeout <- seconds 5
let httpFactory = HttpClientFactory.create("my_http_factory", myHttpClient)
```

</TabItem>

<TabItem value="C#">

```csharp
var myHttpClient = new HttpClient();
myHttpClient.Timeout = TimeSpan.FromSeconds(5);
var httpFactory = HttpClientFactory.Create("my_http_factory", myHttpClient);
```

</TabItem>
</Tabs>

## Tracing

There may be situations when you need to trace your requests and responses. The NBomber.Http has built-in functionality for tracing every request/response. In order to start tracing you need to set minimum logging level to Verbose.

```fsharp
NBomberRunner.withLoggerConfig(fun () ->
    LoggerConfiguration().MinimumLevel.Verbose()
)
```

Also, you can enable tracing via the [infrastructure config file](json-config#infrastructure-configuration).

```json title="infra-config.json"
{
    "Serilog": {
        "MinimumLevel": "Verbose"
    }
}
```

## JSON parsing

To work with the JSON format, you can use any library you prefer. Here is a list of popular libraries:

- [Newtonsoft.Json](https://github.com/JamesNK/Newtonsoft.Json)
- [System.Text.Json](https://docs.microsoft.com/en-us/dotnet/standard/serialization/system-text-json-how-to)
- [Utf8Json](https://github.com/neuecc/Utf8Json)

Here is an example with using `Newtonsoft.Json`, but you can use any other.

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
Http.createRequest "GET" url
|> Http.withCheck(fun response -> task {
    let! jsonBody = response.Content.ReadAsStringAsync()

    // parse JSON
    let posts = 
        jsonBody
        |> JsonConvert.DeserializeObject<PostResponse[]>
        |> Option.ofObj

    match posts with
    | Some ps when ps.Length > 0 -> return Response.ok()
    |                            -> return Response.fail()                
})
```
</TabItem>

<TabItem value="C#">

```csharp
var request = Http.CreateRequest("GET", url)
    .WithCheck(async response =>
    {
        var jsonBody = await response.Content.ReadAsStringAsync();

        // parse JSON
        var users = JsonConvert.DeserializeObject<PostResponse[]>(jsonBody);

        return users?.Length == 1
            ? Response.Ok()
            : Response.Fail();
    });
```

</TabItem>
</Tabs>

## Best practices 

- To test HTTP use **LoadSimulation.InjectPerSec** since usually web server is an open system. You can read more [here](general-concepts#load-simulations-intro).
- For debugging or tracing you can use **LoadSimulation.KeepConstant** with **copies = 1** since for this simulation NBomber will use a single thread which is easier to debug.
- Use [Ping](plugins-ping) plugin to get more info about networking.
- [Convert your integration tests to load tests](https://nbomber.com/blog/convert-integration-tests-to-load-tests)