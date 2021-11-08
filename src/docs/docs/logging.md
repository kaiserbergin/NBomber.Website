---
id: logging
title: Logging
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about logging in NBomber tests, options to configure, and introduce Serilog logger and sinks.

- [Logging in NBomber tests](logging#logging-in-nbomber-tests)
- [Configuring logging](logging#configuring-logging)
- [Enabling tracing](logging#enabling-tracing)
- [Elasticsearch integration](logging#elasticsearch-integration)

## Logging in NBomber tests

:::note
NBomber uses [Serilog](https://serilog.net/) library for logging. You don't need to install it, it's already included.
:::

In order to start logging you need to take [Step.Context](general-concepts#step-context) or [Scenario.Context](general-concepts#scenario-context) (depending on your execution phase) and access Logger interface. Here is an example.

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
let step = Step.create("step_name", fun context -> task {    
    context.Logger.Information "hello from step!"
    return Response.ok()
})

Scenario.create "scenario_name" [step]
|> Scenario.withInit(fun context -> task {        
    context.Logger.Information "test started!"  
})
|> Scenario.withClean(fun context -> task {
    context.Logger.Information "test stopped!"
})
```

</TabItem>

<TabItem value="C#">

```csharp
var step = Step.Create("step_name", async context => 
{    
    context.Logger.Information("hello from step!");
    return Response.Ok();
});

var scenario = ScenarioBuilder
    .CreateScenario("scenario_name", step)
    .WithInit(context => 
    {
        context.Logger.Information("test started!");
        return Task.CompletedTask;
    })
    .WithClean(context => 
    {
        context.Logger.Information("test stopped!");
        return Task.CompletedTask;
    });
```

</TabItem>
</Tabs>

If you want to use logger out of NBomber context, you can get access via the static property.

```csharp
Log.Logger.Information("hello world!");
```

## Configuring logging

By default NBomber logger writes logs only to a console and file sinks. So basically, when we say "configuring logging," we mean configuring the corresponding sink.

:::note

What is a sink?

Structured log events (messages) are written to sinks and each sink is responsible for writing it to its own backend, database, file, store etc.

- [Console sink](https://github.com/PragmaticFlow/Serilog.Sinks.SpectreConsole) is a mandatory sink which NBomber uses to print out text on console. This sink can't be customized, disabled or overridden. Console sink prints only *Info*, *Warning* and *Error* logs excluding *Verbose*, *Debug*, *Fatal*. 
- [File sink](https://github.com/serilog/serilog-sinks-file) is a mandatory sink which NBomber uses to write logs into file. This sink can't be customized, disabled or overridden. Also, a File sink writes all types of logs (*Verbose, Debug, Info, Warning, Error, Fatal*), therefore if you decide to trace some request/response payload this sink is the way to go.

:::

Serilog supports many data storages and corresponding sinks to save your logs. You can check out the [whole list of provided sinks](https://github.com/serilog/serilog/wiki/Provided-Sinks).

Serilog logger is configured via LoggerConfiguration object. Here is a very basic example of changing minimum log level.

:::note
By default NBomber sets MinimumLevel to Debug (you can override it).
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
NBomberRunner.withLoggerConfig(fun () ->
    // here we set minimum logger level to Verbose
    LoggerConfiguration().MinimumLevel.Verbose() 
)
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner.WithLoggerConfig(() =>
    // here we set minimum logger level to Verbose
    new LoggerConfiguration().MinimumLevel.Verbose() 
)
```

</TabItem>
</Tabs>

Here is an example of registering an additional File sink. Multiple sinks can be active at the same time. Adding additional sinks is a simple as chaining WriteTo blocks.

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
NBomberRunner.withLoggerConfig(fun () ->
    LoggerConfiguration()
        .MinimumLevel.Debug()                 
        .WriteTo.File(
            path = "./logs/my-file-log-" + testInfo.SessionId + ".txt",
            outputTemplate = "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{ThreadId}] {Message:lj}{NewLine}{Exception}",
            rollingInterval = RollingInterval.Day
        )
)
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner.WithLoggerConfig(() =>
    new LoggerConfiguration()
        .MinimumLevel.Debug()                 
        .WriteTo.File(
            path: "./logs/my-file-log-" + testInfo.SessionId + ".txt",
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{ThreadId}] {Message:lj}{NewLine}{Exception}",
            rollingInterval: RollingInterval.Day
        )
)
```

</TabItem>
</Tabs>

Another way that is more appropriate for production use cases is configuring logger via [infrastructure config file](json-config#infrastructure-configuration).

```json title="infra-config.json"
{
  "Serilog": {
    "Using":  ["Serilog.Sinks.File"],
    "MinimumLevel": "Debug",
    "WriteTo": [{ 
      "Name": "File", 
      "Args": { 
        "path": "./logs/my-file-log.txt",
        "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}",         
        "rollingInterval": "Day" 
      }
    }]
  }
}
```

Now we need to load it into NBomber via passing the file path.

:::note
You can also use [NBomber CLI](general-concepts#load-config-file-dynamically) to dynamically specify file path to the infrastructure config.
:::

```fsharp
/// Loads infrastructure configuration.
NBomberRunner.loadInfraConfig "infra-config.json"
```

## Enabling tracing

Some of NBomber plugins support tracing. By enabling it, NBomber logger will log every request and the corresponding response. To enable tracing logger minimum level should be set to Verbose.

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

## Elasticsearch integration

Serilog supports [many data storages](https://github.com/serilog/serilog/wiki/Provided-Sinks) to save your logs. But the most popular solution for loggs is [Elasticsearch](https://www.elastic.co) and Serilog logger support it via [Elasticsearch sink](https://github.com/serilog/serilog-sinks-elasticsearch). Let's try to integrate our NBomber with Elasticsearch to ship our logs there and be able to analyze them using full-text search or aggregation queries. 

:::note
Installation prerequisites

You should have installed Elasticsearch database. If you don't have it, you can use environment bootstrap via [Docker setup](local-environment).
:::

### Add Elasticsearch sink

```code
dotnet add package Serilog.Sinks.Elasticsearch
```

### Configure Elasticsearch sink

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},    
    {label: 'C#', value: 'C#'}    
  ]
}>

<TabItem value="F#">

```fsharp
NBomberRunner.withLoggerConfig(fun () ->    
    LoggerConfiguration()
        .MinimumLevel.Information()
        .WriteTo.Elasticsearch(nodeUris = "http://localhost:9200",
                               indexFormat = "custom-index-{0:yyyy.MM}",
                               batchPostingLimit = 0)
)
```
</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner.WithLoggerConfig(() =>
    new LoggerConfiguration()
        .MinimumLevel.Information()
        .WriteTo.Elasticsearch(nodeUris: "http://localhost:9200",
                               indexFormat: "custom-index-{0:yyyy.MM}",
                               batchPostingLimit: 0)
)
```

</TabItem>
</Tabs>

Also, you can configure Elasticsearch sink via the infrastructure configuration file. For more information about Elasticsearch sink configuration, please follow this [link](https://github.com/serilog/serilog-sinks-elasticsearch).

```json title="infra-config.json"
{
  "Serilog": {
    "Using":  ["Serilog.Sinks.Elasticsearch"],
    "MinimumLevel": "Information",
    "WriteTo": [{ 
      "Name": "Elasticsearch", 
      "Args": { 
        "nodeUris": "http://localhost:9200",
        "indexFormat": "custom-index-{0:yyyy.MM}",         
        "batchPostingLimit": 0 
      }
    }]
  }
}
```