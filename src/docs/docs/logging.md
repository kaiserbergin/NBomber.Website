---
id: logging
title: Logging
---

:::note

NBomber is using [Serilog](https://serilog.net/) library for logging. You don't need to install it. If you haven't used it before, you will be amazed at how cool it is.

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

TBD

<!-- ### Configuring logging

### Sinks your logs to Elastic Search

gif animation -->
