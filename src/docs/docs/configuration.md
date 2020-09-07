---
id: configuration
title: Configuration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about configuring NBomber tests. It will cover the topic of dynamic configuration via config files. NBomber separate configuration on two types:

- **Test configuration**: defines all kinds of settings related only to tests. It could be settings for load simulation, settings to choose target scenarios to run, duration of the test, database connection strings, etc.
```fsharp
/// Loads test configuration.
NBomberRunner.loadConfig "config.json"
```

- **Infrastructure configuration**: defines all kinds of settings related only to infrastructure. It could be settings for the logger, plugins, etc.
```fsharp
/// Loads infrastructure configuration.
NBomberRunner.loadInfraConfig "infra-config.json"
```

## Test configuration

NBomber provides a way to configure your test via JSON configuration files. Instead of hardcoding some values you can put them in the config and then load it. Take a look at the configuration via NBomber API (*F# or C#*) and then check (*JSON*).

<Tabs
  groupId="config"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},    
    {label: 'JSON', value: 'JSON'}    
  ]
}>

<TabItem value="F#">

```fsharp
// scenario configuration

Scenario.create "hello_world" [step1; step2; step3] 
|> Scenario.withWarmUpDuration(seconds 1)
|> Scenario.withoutWarmUp
|> Scenario.withLoadSimulations [
    RampConstant(copies = 10, during = seconds 10)
    KeepConstant(copies = 10, during = seconds 10)
    RampPerSec(rate = 10, during = seconds 10)
    InjectPerSec(rate = 10, during = seconds 10)
]

// nbomber runner configuration

|> NBomberRunner.registerScenario
|> NBomberRunner.registerScenarios [scenario1; scenario2]

|> NBomberRunner.withTestSuite "mongo_tests"
|> NBomberRunner.withTestName "insert_data"

|> NBomberRunner.withReportFileName "my_report"
|> NBomberRunner.withReportFormats [ReportFormat.Txt; ReportFormat.Csv; ReportFormat.Html; ReportFormat.Md]
|> NBomberRunner.withoutReports
|> NBomberRunner.withReportingSinks [influxDbSink; prometheusSink] (seconds 30)   

|> NBomberRunner.loadConfig "config.json"            // or config.yaml    
|> NBomberRunner.loadInfraConfig "infra_config.json" // or infra_config.yaml
```
</TabItem>

<TabItem value="JSON">

```json title="config.json"
{
  "TestSuite": "nbomber_tests",
  "TestName": "hello_world_test",

  "TargetScenarios": ["hello_world_scenario"],

  "GlobalSettings": {
    "ScenariosSettings": [{

      "ScenarioName": "hello_world_scenario",
      "WarmUpDuration": "00:00:05",

      "LoadSimulationsSettings": [
        { "RampConstant": [100, "00:00:50"] },
        { "KeepConstant": [100, "00:00:50"] },
        { "RampPerSec": [5, "00:00:05"] },
        { "InjectPerSec": [5, "00:00:05"] }
      ]

    }],

    "ConnectionPoolSettings": [
      { "PoolName": "web_socket_pool", "ConnectionCount": 5 }
    ],

    "ReportFileName": "custom_report_name",
    "ReportFormats": [ "Html", "Txt", "Csv", "Md" ]
  }
}
```
</TabItem>
</Tabs>

### Injecting custom settings

So far you have seen how you can configure NBomber tests via configuration files. But what if you want to extend your test by custom configuration settings. For example, you want to pass the SQL connection string for a database, and depending on the environment you want to pass different values.

```sql
"server=127.0.0.1; uid=root; pwd=12345; database=test"
```

For such cases, NBomber provides dedicated configuration settings called **Custom Settings** where you can put any object structure like this one:
 
```json {24} title="config.json"
{
  "TestSuite": "nbomber_tests",
  "TestName": "hello_world_test",

  "TargetScenarios": ["hello_world_scenario"],

  "GlobalSettings": {
    "ScenariosSettings": [{

      "ScenarioName": "hello_world_scenario",
      "WarmUpDuration": "00:00:05",

      "LoadSimulationsSettings": [
        { "RampConstant": [100, "00:00:50"] },
        { "KeepConstant": [100, "00:00:50"] },
        { "RampPerSec": [5, "00:00:05"] },
        { "InjectPerSec": [5, "00:00:05"] }
      ],

      "ConnectionPoolSettings": [
        { "PoolName": "web_socket_pool", "ConnectionCount": 5 }
      ]

      "CustomSettings": {
        "Server": "127.0.0.1",
        "Uid": "root",
        "Pwd": "12345",
        "Database": "test"
      },      

    }],    

    "ReportFileName": "custom_report_name",
    "ReportFormats": [ "Html", "Txt", "Csv", "Md" ]
  }
}
```

And then fetch it to your test (make sure that your custom settings located within related scenario settings):

```fsharp
[<CLIMutable>]
type SqlDbSettings = {
    Server: string
    Uid: string
    Pwd: string
    Database: string
}

let testInit = fun (context: ScenarioContext) -> task {    
    let settings = context.CustomSettings.Get<SqlDbSettings>()    
    context.Logger.Information("test init received CustomSettings.TestField '{TestField}'", settings.TestField)
}

Scenario.create "hello_world_scenario" [step1; step2]
|> Scenario.withTestInit(testInit)
```

## Infrastracture configuration 

TBD

## CLI arguments

TBD

<!--  
and NBomber will inject it into the test runtime. Let's imagine that we need to inject SQL connection string into our scenario:

Our next step is to fetch custom config into our test. For this we have one entry point: Scenario Init


## Customizing connection pool



## CLI arguments
-->

