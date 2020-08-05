---
id: logging
title: Logging
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about logging in NBomber tests, options to configure, and also it gives you an introduction to Serilog logger and data sinks.

- [Logging in NBomber tests](logging#logging-in-nbomber-tests)
- [Configuring logging](logging#configuring-logging)
- [Elasticsearch integration](logging#elasticsearch-integration)

## Logging in NBomber tests

:::note
NBomber is using [Serilog](https://serilog.net/) library for logging. You don't need to install it, it's included already.
:::

In order to start logging you need to take [Step.Context](core-abstractions#step-context) or [Scenario.Context](core-abstractions#scenario-context) (depending on your execution phase) and access Logger interface. Here is an example:


```fsharp
let step = Step.create("step_name", fun context -> task {    
    context.Logger.Information("hello from step!")    
    return Response.Ok()
})

Scenario.create "scenario_name" [step]
|> Scenario.withInit(fun context -> task {        
    context.Logger.Information("test started!")  
})
|> Scenario.withClean(fun context -> task {
    context.Logger.Information("test stopped!")        
})
```

If you want to use logger out of NBomber context you can get access via static property.

```fsharp
 Log.Logger.Information("hello world!") 
```

## Configuring logging

By default NBomber logger writes logs only to console and file sinks with the following configuration.

:::note

What is sink?

Structured log events (messages) are written to sinks and each sink is responsible for writing it to its own backend, database, store etc.

- [Console sink](https://github.com/serilog/serilog-sinks-console) is a mandatory sink which NBomber use to print out text on console. This sink can't be customized or overridden. Console sink prints only *Info* and *Warning* logs. 
- [File sink](https://github.com/serilog/serilog-sinks-file) is a mandatory sink which NBomber use to write logs into file. This sink can't be customized or overridden. Also, File sink writes all types of logs (*Verbose, Debug, Info, Warning, Error, Fatal*), therefore if you decide to trace some request/response payload this sink is way to go.

:::

```fsharp
// by default NBomber sets MinimumLevel to Debug (you can override it)
LoggerConfiguration().MinimumLevel.Debug()

// Console sink settings: writes to console only Info and Warning logs
LoggerConfiguration()
    .WriteTo.Console()
    .Filter.ByIncludingOnly(fun event -> 
        event.Level = LogEventLevel.Information
        || event.Level = LogEventLevel.Warning
    )

// File sink settings: writes to file all types of logs
LoggerConfiguration()      
    .WriteTo.File(
        path = "./logs/nbomber-log-" + testInfo.SessionId + ".txt",
        outputTemplate = "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] [{ThreadId}] {Message:lj}{NewLine}{Exception}",
        rollingInterval = RollingInterval.Day
    )
```

You can enrich or customize default logger configuration using some other [sinks](https://github.com/serilog/serilog/wiki/Provided-Sinks).

:::important
Make sure that you always return a new instance (not from a variable) of LoggerConfiguration. This limitation is mandatory since Serilog logger does not allow to create multiple instances from the same instance of LoggerConfiguration.  
:::

```fsharp
// here we set MinimumLevel to Verbose (it could be useful for tracing)
NBomberRunner.withLoggerConfig(fun () ->
    LoggerConfiguration().MinimumLevel.Verbose()
)
```

Another way that is more appropriate for production use cases is configuring logger via infrastructure config file.

```fsharp
/// Loads infrastructure configuration.
/// The following formats are supported:
/// - json (.json),
/// - yaml (.yml, .yaml).
NBomberRunner.loadInfraConfig "infra-config.json"
```

:::note
You can also use [NBomber CLI](configuration#cli-arguments) to dynamically specify file path to the infrastructure config.
:::

Here is an example of infrastructure config file.

<Tabs
  groupId="config"
  defaultValue="JSON"
  values={[    
    {label: 'JSON', value: 'JSON'},
    {label: 'YAML', value: 'YAML'},
  ]
}>

<TabItem value="JSON">

```json title="infra-config.json"
{
  "Serilog": {
    "Using":  ["Serilog.Sinks.File"],
    "MinimumLevel": "Debug",
    "WriteTo": [{ 
      "Name": "File", 
      "Args": { 
        "path": "./logs/nbomber-log.txt",
        "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}",         
        "rollingInterval": "Day" 
      }
    }]
  }
}
```
</TabItem>

<TabItem value="YAML">

```yaml title="infra-config.yaml"
Serilog:
  Using:
  - Serilog.Sinks.File  

  MinimumLevel: Debug

  WriteTo:
  - Name: File
    Args:
      path: "./logs/nbomber-log.txt"
      outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
      rollingInterval: "Day"
```
</TabItem>
</Tabs>

## Elasticsearch integration

Serilog supports many data storages to save your logs. You can check this [list](https://github.com/serilog/serilog/wiki/Provided-Sinks). But the most used is [Elasticsearch](https://github.com/serilog/serilog-sinks-elasticsearch). Let's try to integrate our NBomber with Elasticsearch to ship our logs there and be able to analyze them using full-text search or aggregation queries. 

:::note
Installation prerequisites

You should have installed Elasticsearch database. If you don't have you can use [Docker setup](docker-setup).
:::

### Add Elasticsearch sink

```code
dotnet add package Serilog.Sinks.Elasticsearch
```

### Configure Elasticsearch sink

<Tabs
  groupId="config"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},    
    {label: 'JSON', value: 'JSON'},
    {label: 'YAML', value: 'YAML'},
  ]
}>

<TabItem value="F#">

```fsharp
|> NBomberRunner.withLoggerConfig(fun () ->    
    LoggerConfiguration()
        .MinimumLevel.Debug()
        .WriteTo.Elasticsearch(nodeUris = "http://localhost:9200",
                               indexFormat = "custom-index-{0:yyyy.MM}",
                               batchPostingLimit = 0)
)
```
</TabItem>

<TabItem value="JSON">

```json title="infra-config.json"
{
  "Serilog": {
    "Using":  ["Serilog.Sinks.Elasticsearch"],
    "MinimumLevel": "Debug",
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
</TabItem>

<TabItem value="YAML">

```yaml title="infra-config.yaml"
Serilog:
  Using:
  - Serilog.Sinks.Elasticsearch  

  MinimumLevel: Debug

  WriteTo:
  - Name: Elasticsearch
    Args:
      nodeUris: "http://localhost:9200"
      indexFormat: "custom-index-{0:yyyy.MM}"
      batchPostingLimit: 0
```
</TabItem>
</Tabs>

For more information about Elasticsearch sink configuration, please use this [link](https://github.com/serilog/serilog-sinks-elasticsearch).

<!-- TODO: gif animation -->
