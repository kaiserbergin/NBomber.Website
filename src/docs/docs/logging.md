---
id: logging
title: Logging
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

:::note

NBomber is using [Serilog](https://serilog.net/) library for logging. You don't need to install it, it's included already.

:::

In order to start logging you need to take [Step.Context](core-abstractions#step-context) or [Scenario.Context](core-abstractions#scenario-context) and access Logger interface. Here is an example:


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

### Configuring logging

By default NBomber logger writes logs only to console and file with the following configuration.

```fsharp
LoggerConfiguration()
    .WriteTo.Console(restrictedToMinimumLevel = LogEventLevel.Information)
    .WriteTo.File(path = "./logs/nbomber-log.txt",
                  restrictedToMinimumLevel = LogEventLevel.Verbose,
                  outputTemplate = "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}",
                  buffered = true,
                  rollingInterval = RollingInterval.Hour)
```

You can also ovveride default configuration using NBomberRunner.

:::important

Make sure that you always return a new instance of LoggerConfiguration. 

:::

```fsharp
NBomberRunner.withLoggerConfig(fun () ->
    LoggerConfiguration()
        .WriteTo.Console()
)
```

Another way that is more appropriate for production use cases is configuring logger via infrastructure config.

```fsharp
/// Loads infrastructure configuration.
/// The following formats are supported:
/// - json (.json),
/// - yaml (.yml, .yaml).
NBomberRunner.loadInfraConfig "infra_config.json"
```

Here is an example of infrastructure config file.

```json title="/infra_config.json"
{
  "Serilog": {
    "WriteTo": [{ 
      "Name": "File", 
      "Args": { 
        "path": "./logs/nbomber-log.txt",         
        "rollingInterval": "Hour" 
      }
    }]
  }
}
```

### Elasticsearch integration

Serilog supports many data storages to save your logs. You can check this [list](https://github.com/serilog/serilog/wiki/Provided-Sinks). But the most used is Elasticsearch database. Let's try to integrate our NBomber with [Elasticsearch](https://github.com/serilog/serilog-sinks-elasticsearch) to ship our logs there. 

#### Add Elasticsearch sink

```code
dotnet add package NBomber
```

TBD

<!-- 
using static object
Log.Logger.Information



### Sinks your logs to Elastic Search

gif animation -->
