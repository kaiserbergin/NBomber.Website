---
id: step-api
title: Step API
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about NBomber general concepts in more detail. The whole API is mainly built around these building blocks:

- [Step](#step)
- [Scenario](#scenario)
- [NBomber runner](#nbomber-runner)
- [Data feed](#data-feed)
- [Connection pool](#connection-pool)

## Step API

### Step execution

:::note

By default all steps within one scenario execute sequentially. Every step runs in isolated a lightweight thread (*Task<'T>*) provided by a Scenario. You can change step order in runtime via using function *Scenario.withCustomStepsOrder*

:::

Here is an example of a default (sequential) execution order.

```fsharp
let step1 = Step.create("step_1", fun context -> task { 

    do! Task.Delay(seconds 1)
    context.Logger.Information("step 1 is invoked")    
    
    return Response.ok() 
})

let step2 = Step.create("step_2", fun context -> task {         
    
    do! Task.Delay(seconds 1)
    context.Logger.Information("step 2 is invoked")        
    
    return Response.ok() 
})

// here you create scenario and define (default) step order
// you also can define them in opposite direction, like [step2; step1] 
// or even repeat [step1; step1; step1; step2]  
Scenario.create "scenario" [step1; step2] 
|> Scenario.withoutWarmUp
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 10)]
|> NBomberRunner.registerScenario
|> NBomberRunner.run
|> ignore

// console output:
// step 1 is invoked
// step 2 is invoked
// step 1 is invoked
// step 2 is invoked
```

Here is an example of a custom execution order. This one can be used for more advanced cases when you need to introduce some random step order in your scenario.

```fsharp
let step1 = Step.create("read", fun context -> task { 

    do! Task.Delay(seconds 1)
    context.Logger.Information("step 1 is invoked")
    
    return Response.ok() 
})

let step2 = Step.create("insert", fun context -> task {         
    
    do! Task.Delay(seconds 1)
    context.Logger.Information("step 2 is invoked")    
    
    return Response.ok() 
})

Scenario.create "scenario" [step1; step2]
|> Scenario.withoutWarmUp
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 10)]
|> NBomberRunner.registerScenario
|> NBomberRunner.run
|> ignore

// console output:
// step 1 is invoked
// step 2 is invoked
// step 1 is invoked
// step 2 is invoked
```

In case of step exception or returning Response.fail() the execution will be restarted from zero step.

```fsharp
let step1 = Step.create("step_1", fun context -> task { 

    do! Task.Delay(seconds 1)
    context.Logger.Information("step 1 is invoked")
    
    return Response.fail() // or you throw exception
})

let step2 = Step.create("step_2", fun context -> task {         
    
    // this step will not be executed
    do! Task.Delay(seconds 1)
    context.Logger.Information("step 2 is invoked")    
    
    return Response.ok() 
})

Scenario.create "scenario" [step1; step2]
|> Scenario.withoutWarmUp
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 10)]
|> NBomberRunner.registerScenario
|> NBomberRunner.run
|> ignore

// console output:
// step 1 is invoked
// step 1 is invoked
```

### Step hosting

The same step can be hosted in several concurrent scenarios.

```fsharp
let step1 = Step.create("step_1", fun context -> task {         
    do! Task.Delay(seconds 1)
    return Response.ok() 
})

let step2 = Step.create("step_2", fun context -> task { 
    do! Task.Delay(seconds 1)
    return Response.ok() 
})

let sc1 = Scenario.create "scenario_1" [step1; step1; step2] // you repeat same step
let sc2 = Scenario.create "scenario_2" [step2; step1; step2] // you change order

NBomberRunner.registerScenarios [sc1; sc2] // these scenarios will run concurrently
|> NBomberRunner.run
|> ignore
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
    do! Task.Delay(seconds 1)
    return Response.ok(42) 
})

let step2 = Step.create("step_2", fun context -> task { 
        
    do! Task.Delay(seconds 1)        
    let step1Response = context.GetPreviousStepResponse<int>()

    context.Logger.Information("step 1 response is '{0}'", step1Response)

    return Response.ok() 
})

Scenario.create "scenario" [step1; step2]
|> Scenario.withoutWarmUp
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 10)]
|> NBomberRunner.registerScenario
|> NBomberRunner.run
|> ignore

// console output:
// step 1 response is '42'
// step 1 response is '42'
// step 1 response is '42'
```

NBomber provides a way to set the size of a response for later usage for statistics related to data transfering.

```fsharp
Response.ok(payload = "some HTTP response", sizeBytes = 200)
```

Also, you can set even your own latency if you know that you need to correct the final value (it could be useful for PUSH scenarios when your response is buffered, meaning that you receive it earlier than NBomber function was invoked).

```fsharp
Response.ok(latencyMs = 200)
```

You also can return a fail.
```fsharp
Response.fail()
Response.fail(reason: string)
Response.fail(ex: Exception)
```

### Step pause

Simulate a pause behavior.

```fsharp
/// Creates pause step with specified duration.
Step.createPause(minutes 1)
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

Every step is running in a separated lightweight thread (*Task<'T>*) and has its own context.

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
        
    /// NBomber's logger      
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

### Step pause

If for some cases you want to simulate pause you should use these functions:

```fsharp
let login = Step.create("login", fun () -> ...)
let home  = Step.create("home_page", fun () -> ...)
let pause = Step.createPause(minutes 1)
//let pause = Step.createPause(seconds 10)
//let pause = Step.createPause(milliseconds 200)
//let pause = Step.createPause(fun () -> seconds config.PauseValue)

let scenario = Scenario.create "scenario" [login; pause; home]
```

### Step tracking

In case if you don't want to include a specific step into statistics you can use *doNotTrack = true*.

```fsharp
Step.create(name = "invisible_step", 
            doNotTrack = true,
            execute = fun context -> task { return Response.ok() })
```

## Scenario

Scenario helps to organize steps into sequential flow with different load simulations (concurrency control). 

```fsharp
Scenario.create "scenario" [step1; step2; step3; step4]
|> Scenario.withLoadSimulations [
    InjectPerSec(rate = 10, during = seconds 30)
]
```

:::note

Technically speaking Scenario represents a lightweight thread (*Task<'T>*) of execution and NBomber allows to create many copies of such scenario to simulate parallel execution. Scenarios always run in parallel.

:::

### Load simulations

When it comes to load simulation, systems behave in 2 different ways:
- Closed systems, where you keep a constant number of concurrent clients and they waiting on a response before sending a new request. A good example will be a database with 20 concurrent clients that constantly repeat sending query then wait for a response and do it again. Under the big load, requests will be queued and this queue will not grow since we have a finite number of clients. Usually, in real-world scenarios systems with persisted connections (RabbitMq, Kafka, WebSockets, Databases) are tested as closed systems.
- Open systems, where you keep arrival rate of new clients requests without waitng on responses. The good example could be some popular website like Amazon. Under the load new clients arrive even though applications have trouble serving them. Usually, in real-world scenarios systems that use stateless protocols like HTTP are tested as open systems.

:::note

Make sure to use the proper load model that matches the load of your system. You can mix open and closed model if your use case requires it.

:::

```fsharp
Scenario.withLoadSimulations [ 
    /// For closed system:
    /// Injects a given number of scenario copies 
    /// with a linear ramp over a given duration.
    /// Use it for ramp up and rump down.
    RampConstant(copies = 10, during = seconds 30)

    /// For closed system:
    /// Injects a given number of scenario copies 
    /// at once and keep them running, during a given duration. 
    KeepConstant(copies = 10, during = seconds 30)

    /// For open system:
    /// Injects a given number of scenario copies 
    /// from the current rate to target rate, 
    /// defined in scenarios per second, during a given duration. 
    RampPerSec(rate = 10, during = seconds 30)

    /// For open system:
    /// Injects a given number of scenario copies at a constant rate, 
    /// defined in scenarios per second, during a given duration. 
    InjectPerSec(rate = 10, during = seconds 30)
    
    /// For open system:
    /// Injects a random number of scenario copies at a constant rate, 
    //  defined in scenarios per second, during a given duration.
    InjectPerSecRandom(minRate = 10, maxRate = 50, during = seconds 30)
]
```

### Scenario init

Initializes scenario. You can use it to for example to prepare your target system.

```fsharp
Scenario.withInit(fun context -> task {
    do! populateMongoDb()
})
```

Another popular use case is to parse your custom settings.

```fsharp
Scenario.withInit(fun context -> task {
    let mySettings = context.CustomSettings.Get<MySettings>()    
})
```

You can read more about configuration on this [page](configuration)

### Scenario clean

Cleans scenario's resources.

```fsharp
Scenario.withClean(fun context -> task {
    do! cleanMongoDb()
})
```

### Scenario warm-up

Use warm-up for warming up NBomber itself and target system. Warm-up will just simply start a scenario with a specified duration.

```fsharp
Scenario.withWarmUpDuration(seconds 30)
Scenario.withoutWarmUp
```

### Scenario context

Scenario context is available on init and clean phase.

```fsharp
type IScenarioContext =
    /// Gets current node info
    abstract NodeInfo: NodeInfo
    /// Gets client settings content from configuration file
    abstract CustomSettings: IConfiguration
    /// Cancellation token is a standard mechanics 
    /// for canceling long-running operations.
    /// Cancellation token should be used to help NBomber stop 
    /// scenarios when the test is finished
    abstract CancellationToken: CancellationToken
    /// NBomber's logger
    abstract Logger: ILogger
```

## NBomber runner

Mainly NBomberRunner is responsible for registering and running scenarios under [Test Suite](https://en.wikipedia.org/wiki/Test_suite). Also it provides configuration points related to infrastructure, reporting, loading plugins.

### NBomber runner API

```fsharp
/// Registers scenario in NBomber environment.
NBomberRunner.registerScenario scenario

/// Registers scenarios in NBomber environment. 
/// Scenarios will be run in parallel.
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]

/// Sets test suite name.
/// Default value is: nbomber_default_test_suite_name.
NBomberRunner.withTestSuite "mongo_db"        

/// Sets test name.
/// Default value is: "nbomber_report_{current-date}".
NBomberRunner.withTestName "analytical_queries"

NBomberRunner.withTestName "analytical_queries"

/// Loads test configuration.
/// The following formats are supported:
/// - json (.json)
NBomberRunner.loadConfig "config.json"
    
/// Loads infrastructure configuration.
/// The following formats are supported:
/// - json (.json)
NBomberRunner.loadInfraConfig "infra-config.json"

/// Sets logger configuration.
/// Make sure that you always return a new instance of LoggerConfiguration.
/// You can also configure logger via configuration file.
/// For this use NBomberRunner.loadInfraConfig
NBomberRunner.withLoggerConfig(fun () -> 
    LoggerConfiguration().WriteTo.Elasticsearch(
        ElasticsearchSinkOptions("http://localhost:9200")
    )
)    

/// Sets output report name.
/// Default name: nbomber_report.
NBomberRunner.withReportFileName "my_report"

/// Sets output report folder path.
/// Default folder path: "./reports".
NBomberRunner.withReportFolder "./my_reports"

NBomberRunner.withReportFormats [ReportFormat.Txt; ReportFormat.Csv; ReportFormat.Html; ReportFormat.Md]

/// Sets to run without reports
NBomberRunner.withoutReports

/// Sets reporting sinks.    
/// Reporting sink is used to save real-time metrics to correspond database.
/// (reportingSinks: IReportingSink list)
NBomberRunner.withReportingSinks [influxDbSink]

/// Sets real-time reporting interval.
/// Default value: 10 seconds, min value: 5 sec
NBomberRunner.withReportingInterval(seconds 30)

/// Sets worker plugins.
/// Worker plugin is a plugin that starts at the test start and works as a background worker.
NBomberRunner.withWorkerPlugins [pingPlugin]

/// Sets application type.
/// The following application types are supported:
/// - Console: is suitable for interactive session (will display progress bar)
/// - Process: is suitable for running tests under test runners (progress bar will not be shown)
/// By default NBomber will automatically identify your environment: Process or Console.
NBomberRunner.withApplicationType ApplicationType.Console

/// Runs test
NBomberRunner.run

/// Runs scenarios with arguments.
/// The following CLI commands are supported:
/// -c or --config: loads configuration,
/// -i or --infra: loads infrastructure configuration.
/// Examples of possible args:
/// -c config.json -i infra_config.json
/// --config=config.json --infra=infra_config.json
NBomberRunner.runWithArgs ["--config=config.json --infra=infra_config.json"]
```

## Data feed

Data feed helps you to inject dynamic data into your test. It could be very valuable when you want to simulate different users which send different queries. Feed represents a data source stream that you attach to your step and then NBomber iterates over this stream taking some feed's item and setting it to [Step.Context.FeedItem](#step-context) public property.

```fsharp
////////////////////////////////////
// first, we create IFeedProvider to fetch data for our test
// if you need you can implement your IFeedProvider 
// to fetch data from any other source
////////////////////////////////////

let data = [1; 2; 3; 4; 5] |> FeedData.shuffleData
//let data = FeedData.fromJson<User> "users_feed_data.json"
//let data = FeedData.fromCsv<User> "users_feed_data.csv"

////////////////////////////////////
// second, we create Feed
////////////////////////////////////

// creates Feed that picks constant value per Step copy.
// every Step copy will have unique constant value.
let feed = Feed.createConstant "numbers" data

// creates Feed that randomly picks an item per Step invocation.
//let feed = Feed.createRandom "numbers" data

// creates Feed that returns values from  value on every Step invocation.
//let feed = Feed.createCircular "numbers" data

let userFeed = FeedData.fromCsv<User> "users_feed_data.csv"
               |> FeedData.shuffleData
               |> Feed.createRandom "users"

////////////////////////////////////
// third, we attach feed to the step
////////////////////////////////////
let step = Step.create("simple step", feed, fun context -> task {

    do! Task.Delay(seconds 1)
    context.Logger.Debug("Data from feed: {FeedItem}", context.FeedItem)    
    
    return Response.Ok()
})
```

## Connection pool

TDB