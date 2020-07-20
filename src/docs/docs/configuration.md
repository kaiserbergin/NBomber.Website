---
id: configuration
title: Configuration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Test configuration

NBomber provides a way to configure your test via JSON or YAML configuration files. Instead of hardcoding some values you can put them in the config and then load it. Take a look first on the configuration via NBomber API(*F# or C#*) and then choose your favorite format(*JSON or YAML*).

<Tabs
  groupId="config"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
    {label: 'JSON', value: 'JSON'},
    {label: 'YAML', value: 'YAML'},
  ]
}>

<TabItem value="F#">

```fsharp
// scenario configuration

Scenario.create "hello_world" [step1; step2; step3] 
|> Scenario.withWarmUpDuration(seconds 1)
|> Scenario.withoutWarmUp
|> Scenario.withLoadSimulations [
    RampConcurrentScenarios(copies 10, seconds 10)
    KeepConcurrentScenarios(copies 10, seconds 10)
    RampScenariosPerSec(copies 10, seconds 10)
    InjectScenariosPerSec(copies 10, seconds 10)
]

// nbomber runner configuration

|> NBomberRunner.registerScenario
|> NBomberRunner.registerScenarios [scenario1; scenario2]

|> NBomberRunner.withTestSuite "mongo_tests"
|> NBomberRunner.withTestName "insert_data"

|> NBomberRunner.withReportFileName "my_report"
|> NBomberRunner.withReportFormats [ReportFormat.Txt; ReportFormat.Csv; ReportFormat.Html]
|> NBomberRunner.withoutReports
|> NBomberRunner.withReportingSinks [influxDbSink; prometheusSink]    
    
|> NBomberRunner.loadConfig "config.json"            // or config.yaml    
|> NBomberRunner.loadInfraConfig "infra_config.json" // or infra_config.yaml
```
</TabItem>

<TabItem value="C#">

</TabItem>

<TabItem value="JSON">

```json title="/config.json"
{
  "TestSuite": "nbomber_tests",
  "TestName": "hello_world_test",
  "TargetScenarios": ["hello_world_scenario"],

  "GlobalSettings": {
    "ScenariosSettings": [{

      "ScenarioName": "hello_world_scenario",
      "WarmUpDuration": "00:00:05",

      "LoadSimulationsSettings": [
        { "RampConcurrentScenarios": [100, "00:00:50"] },
        { "KeepConcurrentScenarios": [100, "00:00:50"] },
        { "InjectScenariosPerSec": [5, "00:00:05"] },
        { "RampScenariosPerSec": [5, "00:00:05"] }
      ]

    }],

    "ConnectionPoolSettings": [
      { "PoolName": "web_socket_pool", "ConnectionCount": 5 }
    ],

    "ReportFileName": "custom_report_name_from_json",
    "ReportFormats": [ "Html", "Txt", "Csv" ]
  }
}
```
</TabItem>

<TabItem value="YAML">

```yaml title="/config.yaml"
TestSuite: nbomber tests
TestName: test http
GlobalSettings:
  ScenariosSettings:
  - ScenarioName: hello_world_scenario
    WarmUpDuration: '00:00:35'

    LoadSimulationsSettings:
    - RampConcurrentScenarios:
        CopiesCount: 5
        During: '00:00:05'
    - KeepConcurrentScenarios:
        CopiesCount: 5
        During: '00:00:05'
    - InjectScenariosPerSec:
        CopiesCount: 5
        During: '00:00:05'
    - RampScenariosPerSec:
        CopiesCount: 5
        During: '00:00:05'

    CustomSettings:
      TestField: 1

  ConnectionPoolSettings:
  - PoolName: test_pool
    ConnectionCount: 100

  ReportFileName: custom_report_name_from_json
  ReportFormats:
  - Html
  - Txt
  - Csv
```
</TabItem>

</Tabs>

### Injecting custom settings

So far you have seen how you can configure NBomber API features via configuration files. But what if you want to extend your test by custom configuration settings. For example, you want to introduce SQL connection string to a database, and depending on the environment you want to pass different values.

```sql
"server=127.0.0.1; uid=root; pwd=12345; database=test"
```

 For such cases, NBomber provides dedicated configuration settings called **Custom Settings** where are you can put any object structure:
 
 ```json
 {
   "CustomSettings": { "FiledA": "A"; "FieldB": "B" }
 }
 ```
TBD

<!--  
and NBomber will inject it into the test runtime. Let's pretend that we need to inject SQL connection string, into our scenario:

Our next step is to fetch custom config into our test. For this we have one entry point: Scenario Init


## Customizing connection pool

## Infrastracture configuration 

## CLI arguments
-->

