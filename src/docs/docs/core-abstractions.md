---
id: core-abstractions
title: Core abstractions
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about the NBomber core abstractions in detail. The whole API is mainly built around these building blocks:

- Step 
- Scenario
- NBomber runner
- Data feed
- Connection pool

## Step

Step and Scenario are playing the most important role in building real-world simulations. Step is helping you to define your test function only. Scenario is helping you to organize steps into test flow with different load simulations(concurrency control). 

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
// Step is a basic element which will be executed and measured
type Step = {
    Name: string    
    Execute: StepContext -> Task<Response>
    ConnectionPool: ConnectionPool
    Feed: Feed
}

// Scenario is a container for steps and load simulations
type Scenario = {
    Name: string
    Steps: Step list     
    Init: (ScenarioContext -> Task) option 
    Clean: (ScenarioContext -> Task) option
    WarmUpDuration: TimeSpan
    LoadSimulations: LoadSimulation list
}
```
</TabItem>

<TabItem value="C#">
</TabItem>

</Tabs>

You can think of Step like a function which execution time will be measured.

```fsharp
// it's pseudocode example 
// we create scenario with two steps and run them 

let step1 = Step.create("step_1", fun () -> ...)
let step2 = Step.create("step_2", fun () -> ...)

let scenario = Scenario.create "scenario" [step1; step2]

// this is simplified version of how NBomber is executing steps
// all steps will be executed sequantilly
for step in scenario.Steps do

    let start = getCurrentTime()

    step.Execute()        

    let end = getCurrentTime()

    // now, we can calculate the latency of given step
    let latency = end - start
```

### Step execution

:::note

All steps within one scenario are always executing sequentially. Every step is running in an isolated lightweight thread(*Task<'T>*) provided by Scenario.

:::

```fsharp
let step1 = Step.create("step_1", fun context -> task { 

    context.Logger.Information("step 1 is invoked")
    
    return Response.Ok() 
})

let step2 = Step.create("step_2", fun context -> task {         
    
    context.Logger.Information("step 2 is invoked")    
    
    return Response.Ok() 
})

Scenario.create "scenario" [step1; step2]

// console output will have:
// step 1 is invoked
// step 2 is invoked
// step 1 is invoked
// step 2 is invoked
```

In case of step exception or returning Response.Fail() the execution will be restarted from zero step.

```fsharp
let step1 = Step.create("step_1", fun context -> task { 

    context.Logger.Information("step 1 is invoked")
    
    return Response.Fail() // or you throw exception
})

let step2 = Step.create("step_2", fun context -> task {         
    
    // this step will not be executed
    context.Logger.Information("step 2 is invoked")    
    
    return Response.Ok() 
})

Scenario.create "scenario" [step1; step2]

// console output will have:
// step 1 is invoked
// error
// step 1 is invoked
// error
```

### Step hosting

The same step can be hosted in several concurrent scenarios.

```fsharp
let step1 = Step.create("step_1", fun context -> task {         
    return Response.Ok() 
})

let step2 = Step.create("step_2", fun context -> task { 
    return Response.Ok() 
})

Scenario.create "scenario_1" [step1; step1; step2] // you repeat same step
Scenario.create "scenario_2" [step2; step1; step2] // you can change order
```

### Step response

```fsharp
type Response = {
    Payload: obj
    SizeBytes: int
    Exception: exn option
    LatencyMs: int
}
```

Every step after executing can return a response as an input parameter for the next step. 

```fsharp
let step1 = Step.create("step_1", fun context -> task {         
    return Response.Ok(42) 
})

let step2 = Step.create("step_2", fun context -> task { 
        
    let step1Response = context.GetPreviousStepResponse<int>()

    context.Logger.Information("step 1 response is '{0}'", step1Response)

    return Response.Ok() 
})

Scenario.create "scenario" [step1; step2]

// console output will have:
// step 1 response is '42'
```

NBomber provides a way to set the size of response to later use it for statistics related to data transfer.

```fsharp
Response.Ok(payload = "some HTTP response", sizeBytes = 200)
```

Also, you can set even your own latency if you know that you need to correct the final value(it could be useful for PUSH scenarios when your response was buffered, meaning that you received it earlier than NBomber function was invoked).

```fsharp
Response.Ok(latencyMs = 200)
```

You also can return fail.
```fsharp
Response.Fail()
Response.Fail(reason: string)
Response.Fail(ex: Exception)
```

### Step pause

Simulates pause behavior.

```fsharp
/// Creates pause step with specified duration.
Step.createPause(TimeSpan.FromSeconds 10.0)
Step.createPause(seconds 10)
Step.createPause(milliseconds 200)

/// Creates pause step with specified duration in lazy mode.
Step.createPause(fun () -> seconds config.PauseValue)
```

### Step tracking

In case if you don't want to include some step into statistics you can use *doNotTrack = true*.

```fsharp
Step.create(name = "invisible", 
            execute = fun () -> task { return Response.Ok() }, 
            doNotTrack = true)
```


### Step logging

Please read this [page](./logging)

### Step context

Every step is running in separated lightweight thread (*Task<'T>*) and has its own context.

```fsharp
let step = Step.create("step", fun context -> task {             
    //context.CorrelationId
    //context.Logger
})
```

It's a very useful abstraction which contains all related step's information.

```fsharp
type CorrelationId = {
    Id: string
    ScenarioName: string
    CopyNumber: int
}

type IStepContext<'TConnection,'TFeedItem> =
    /// It's unique identifier which represent current scenario thread
    /// correlation_id = scenario_name + scenario_copy_number
    abstract CorrelationId: CorrelationId
    
    /// Cancellation token is a standard mechanics 
    /// for canceling long-running operations.
    /// Cancellation token should be used to help NBomber stop 
    /// scenarios when the test is finished
    abstract CancellationToken: CancellationToken
    
    /// Connection which is taken from attached ConnectionPool    
    abstract Connection: 'TConnection
    
    /// Step's dictionary which you can use to share 
    /// data between steps (within one scenario)
    abstract Data: Dict<string,obj>
    
    /// Feed item taken from attached feed    
    abstract FeedItem: 'TFeedItem
        
    /// Step's logger        
    abstract Logger: ILogger
    
    /// Returns response from previous step
    abstract GetPreviousStepResponse: unit -> 'T
    
    /// Stops scenario by scenario name
    /// It could be useful when you don't know the final scenario duration
    /// or it depends on some other criteria (notification event etc)
    abstract StopScenario: scenarioName:string * reason:string -> unit
    
    /// Stops all running scenarios
    /// Use it when you don't see any sense to continue the current test
    abstract StopCurrentTest: reason:string -> unit
```

## Scenario

Scenario is helping you to organize steps into sequential flow with different load simulations(concurrency control). 

```fsharp
Scenario.create "scenario" [step1; step2; step3; step4]
|> Scenario.withLoadSimulations [
    InjectScenariosPerSec(copiesCount = 10, during = seconds 30)
]
```

:::note

Technically speaking Scenario represents a lightweight thread(*Task<'T>*) of execution and NBomber is allowing to create many copies of such scenario to simulate parallel execution. Scenarios are always running in parallel.

:::

### Load simulations

When it comes to load simulation, systems behave in 2 different ways:
- Closed systems, where you keep a constant number of concurrent clients and they waiting on a response before sending a new request. A good example will be a database with 20 concurrent clients that constantly repeat sending query then wait for a response and do it again. Under the big load, requests will be queued and this queue will not grow since we have a finite number of clients
- Open systems, where you keep arrival rate of new clients requests without waitng on responses. The good example could be some popular website like Amazon. Under the load new clients will arriving even though applications have trouble serving them. 

:::note

Make sure to use the proper load model that matches the load of your system. You can mix open and closed model if your use case requires it.

:::

```fsharp
Scenario.withLoadSimulations [ 
    /// For closed system:
    /// Injects a given number of scenario copies 
    /// with a linear ramp over a given duration.
    /// Use it for ramp up and rump down.
    RampConcurrentScenarios(copiesCount = 10, during = seconds 30)

    /// For closed system:
    /// Injects a given number of scenario copies 
    /// at once and keep them running, during a given duration. 
    KeepConcurrentScenarios(copiesCount = 10, during = seconds 30)

    /// For open system:
    /// Injects a given number of scenario copies 
    /// from starting rate to target rate, 
    /// defined in scenarios per second, during a given duration. 
    RampScenariosPerSec(copiesCount = 10, during = seconds 30)

    /// For open system:
    /// Injects a given number of scenario copies at a constant rate, 
    /// defined in scenarios per second, during a given duration. 
    InjectScenariosPerSec(copiesCount = 10, during = seconds 30)
]
```

### Scenario init

Initialize scenario. You can use it to for example to prepare your target system.

```fsharp
Scenario.withInit(fun context -> task {
    do! populateMongoDb()
})
```

Another popular use case is to parse your custom settings.

```fsharp
Scenario.withInit(fun context -> task {
    let mySettings = context.CustomSettings.DeserializeJson<MySettings>()
    
    // in case of YAML
    // let mySettings = context.CustomSettings.DeserializeYaml<MySettings>()    
})
```

You can read more about configuration on this [page](./configuration)

### Scenario clean

Cleaning scenario's resources.

```fsharp
Scenario.withClean(fun context -> task {
    do! cleanMongoDb()
})
```

### Scenario warm-up

Use warm-up for warming up NBomber itself and target system.

```fsharp
Scenario.withWarmUpDuration(seconds 30)
Scenario.withoutWarmUp
```

### Scenario context

Scenario context is available on init and clean phase.

```fsharp
type ScenarioContext = {
    /// Gets current node info
    NodeInfo: NodeInfo    
    /// Gets client settings content from configuration file    
    CustomSettings: string

    /// Cancellation token is a standard mechanics
    /// for canceling long-running operations.
    /// Cancellation token should be used to help NBomber stop 
    /// scenarios when the test is finished        
    CancellationToken: CancellationToken

    /// Scenario's logger
    Logger: ILogger
}
```

## NBomber runner

Mainly NBomberRunner is responsible for registering and running scenarios under [Test Suite](https://en.wikipedia.org/wiki/Test_suite). Also it provides configuration points related to infrastracture, reporting, loading plugins.

### NBomber runner API

```fsharp
/// Registers scenario in NBomber environment.
NBomberRunner.registerScenario scenario

/// Registers scenarios in NBomber environment. 
/// Scenarios will be run in parallel.
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]

/// Sets test suite name
/// Default value is: nbomber_default_test_suite_name
NBomberRunner.withTestSuite "mongo_db"        

/// Sets test name
/// Default value is: nbomber_default_test_name
NBomberRunner.withTestName "analytical_queries"

/// Loads configuration.
/// The following formats are supported:
/// - json (.json),
/// - yaml (.yml, .yaml).
NBomberRunner.loadConfig "./config.json"
    
/// Loads infrastructure configuration.
/// The following formats are supported:
/// - json (.json),
/// - yaml (.yml, .yaml).
NBomberRunner.loadInfraConfig "./infra-config.json"
    
/// Adds reporting sinks    
NBomberRunner.withReportingSinks([influxDbSink], sendStatsInterval = seconds 30)

/// Adds plugins
NBomberRunner.withPlugins [pingPlugin]

/// Sets application type.
/// The following application types are supported:
/// - Console: is suitable for interactive session (will display progress bar)
/// - Process: is suitable for running tests under test runners (progress bar will not be shown)
/// By default NBomber will automatically identify your environment: Process or Console.
NBomberRunner.withApplicationType ApplicationType.Console

/// Runs test
NBomberRunner.run

/// Runs test with CLI arguments.
/// The following CLI arguments are supported:
/// -c or --config: loads configuration,
/// -i or --infra: loads infrastructure configuration.
/// Examples of possible args:
/// [|"-c"; "config.yaml"; "-i"; "infra_config.yaml"|]
/// [|"--config"; "config.yaml"; "--infra"; "infra_config.yaml"|]
NBomberRunner.runWithArgs ["-c"; "./config.json"; "-i"; "./infra-config.json"]
```

## Data feed

Data feed helps you to inject dynamic data into your test. It could be very valuable when you want to simulate different users which send different queries. Feed is representing a data source stream that you attach to your step and then NBomber is iterating over this stream taking some feed's item and setting it to [Step.Context.FeedItem](#step-context) public property.

```fsharp
// first, we create IFeedProvider to fetch data for our test
// if you need you can build your IFeedProvider 
// to fetch data from any other source

let data = [1; 2; 3; 4; 5] |> FeedData.fromSeq |> FeedData.shuffleData
let data = FeedData.fromJson<User>("users_feed_data.json")
let data = FeedData.fromCsv<User>("users_feed_data.csv")

// second, we create Feed

// creates constant Feed that will take some random value once 
// and return it always to the Step.
// every Step copy will have unique constant value.
let feed = Feed.createConstant "numbers" dataFromSeq

// creates random
let feed = Feed.createRandom "numbers" dataFromSeq


//let feed = Feed.createRandom "numbers" data

let step = Step.create("simple step", feed, fun context -> task {

    do! Task.Delay(TimeSpan.FromSeconds 1.0)

    context.Logger.Information("Data from feed: {FeedItem}", context.FeedItem)
    return Response.Ok()
})
```

## Connection pool

TDB
