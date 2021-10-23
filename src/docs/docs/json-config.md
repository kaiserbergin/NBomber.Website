---
id: json-config
title: JSON Configuration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about configuring NBomber tests via configuration files.
NBomber supports two types of configuration: 

- [Load Test Configuration](#load-test-configuration) - it allows you to set or override settings related to your load test: [TestNameSettings](#test-name-settings), [TargetScenarioSettings](#target-scenario-settings), [ScenariosSettings](#scenarios-settings), [ClietFactorySettings](#client-factory-settings), [ReportingSettings](#reporting-settings). Also you can inject user-defined [CustomSettings](#custom-settings) (represented as JSON object) into your test. 

- [Infrastructure Configuration](#infrastructure-configuration) - it allows you to set or override settings related to infrastracture: plugins and reporting sinks. For example: Serilog logger, InfluxDb reporting sink, Ping plugin, etc. 

:::note

Config file has higher priority over code script configuration. For example, if you specified WarmUpDuration in both: code and the config file, NBomber will take the value from the config file.

:::

## Load Test Configuration

Load test configuration allows you to set or override settings related to your load test. This type of configuration is represented as a JSON object with a strictly defined structure. Please refer to the following [link](https://github.com/PragmaticFlow/NBomber/blob/main/src/NBomber/Configuration/Configuration.fs) to see the full corresponding JSON model.

Let's consider a basic example of a load test configuration file.

```json title="config.json"
{
    "TestSuite": "public_api_test_suite",
    "TestName": "purchase_api_test",

    "TargetScenarios": ["purchase_api"],

    "GlobalSettings": {

        "ScenariosSettings": [
            {
                "ScenarioName": "purchase_api",
                "WarmUpDuration": "00:00:05",

                "LoadSimulationsSettings": [
                    { "InjectPerSec": [100, "00:00:15"] },
                    { "InjectPerSec": [200, "00:00:15"] }
                ],

                "CustomSettings": {
                    "BaseUri": "https://jsonplaceholder.typicode.com"
                }
            }
        ]       
    }
}
```

In order to load such config into NBomber test, you should use `NBomberRunner.loadConfig`. After this, NBomber will apply the loaded configuration. You can read more about loading configs [here](general-concepts#load-configuration-file).

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
NBomberRunner.loadConfig "config.json"
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner.LoadConfig("config.json")
```

</TabItem>
</Tabs>

### Test name settings

You can set TestName and TestSuite of your NBomber test via the configuration file.

<Tabs
  groupId="example"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},    
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'}   
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "TestSuite": "public_api_test_suite",
    "TestName": "purchase_api_test",
}
```

</TabItem>

<TabItem value="F#">

```fsharp
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]
|> NBomberRunner.withTestSuite "public_api_test_suite"
|> NBomberRunner.withTestName "purchase_api_test"
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)
    .WithTestSuite("public_api_test_suite")
    .WithTestName("purchase_api_test");
```

</TabItem>
</Tabs>

### Target scenario settings

You can register all scenarios you have for your test but run only those you are interested in by setting TargetScenarios property in the configuration file. Thus, you can configure your NBomber tests dynamically by choosing the needed configuration file. Please note, if no TargetScenarios property is set in the configuration file, all registered scenarios will run.

```json title="config.json"
{
    "TargetScenarios": ["scenario1"]
}
```

The main usage of this setting is to specify which scenarios should be executed. For example you registered a few scenarios:

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
NBomberRunner.registerScenarios [insert_mongo; read_mongo; update_mongo]
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner.RegisterScenarios(insert_mongo, read_mongo, update_mongo);    
```

</TabItem>
</Tabs>

And for one test you want to run the only `insert_mongo` but for the second one `read_mongo` and `update_mongo` together. You can achive this by using TargetScenario setting. One file will contain only `insert_mongo` scenario.


```json title="target_scenario_1.json"
{
    "TargetScenarios": ["insert_mongo"]
}
```

And second one will contain `read_mongo` and `update_mongo` together (they will be executed in parallel).

```json title="target_scenario_2.json"
{
    "TargetScenarios": ["read_mongo", "update_mongo"]
}
```

So the final thing is to load them into NBomber.

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
NBomberRunner.registerScenarios [insert_mongo; read_mongo; update_mongo]
|> NBomberRunner.loadConfig "target_scenario_1.json"
// |> NBomberRunner.loadConfig "target_scenario_2.json"
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner
    .RegisterScenarios(insert_mongo, read_mongo, update_mongo)
    .LoadConfig("target_scenario_1.json");
    // .LoadConfig("target_scenario_2.json")
```

</TabItem>
</Tabs>

Also, you can specify path to config file via [console arguments](general-concepts#load-configuration-file)

### Scenarios settings

You can configure `ScenariosSettings` in `GlobalSettings` section of the configuration file.

<Tabs
  groupId="example"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},    
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'}
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "GlobalSettings": {
        "ScenariosSettings": [
            {
                "ScenarioName": "scenario1",
                "WarmUpDuration": "00:00:05",

                "LoadSimulationsSettings": [
                    { "KeepConstant": [100, "00:00:30"] },
                    { "KeepConstant": [200, "00:00:15"] }
                ]
            }
        ]
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp
Scenario.create "scenario1" [step]
|> Scenario.withWarmUpDuration(seconds 5)
|> Scenario.withLoadSimulations [
    KeepConstant(copies = 100, during = seconds 30)
    KeepConstant(copies = 200, during = seconds 15)
]
```

</TabItem>

<TabItem value="C#">

```csharp
ScenarioBuilder
    .CreateScenario("scenario1", step)
    .WithWarmUpDuration(TimeSpan.FromSeconds(5))
    .WithLoadSimulations(
        Simulation.KeepConstant(copies: 100, during: TimeSpan.FromSeconds(30)),
        Simulation.KeepConstant(copies: 200, during: TimeSpan.FromSeconds(15))
    );
```

</TabItem>
</Tabs>

### Client factory settings

You can configure `ClientFactorySettings` for a scenario in `GlobalSettings.ScenariosSettings` section of the configuration file.

<Tabs
  groupId="example"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},    
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'}
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "GlobalSettings": {
        "ScenariosSettings": [
            {
                "ScenarioName": "rest_api",
                
                "ClientFactorySettings": [
                    { "FactoryName": "websocket_factory", "ClientCount": 100 }
                ]
            }
        ]
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp
let websocketFactory =
    ClientFactory.create(
        name = "websocket_factory",
        initClient = (fun (number,context) -> task { return new WebScoketClient() }),
        clientCount = 1
    )

let step = Step.create("step", 
                       clientFactory = websocketFactory,
                       execute = fun context -> task {
    ...                           
})

Scenario.create "rest_api" [step]
```

</TabItem>

<TabItem value="C#">

```csharp
var websocketFactory = ClientFactory.Create(
    name: "websocket_factory",
    initClient: async (number,context) => new WebScoketClient(),
    clientCount: 1
);

var step = Step.Create("step", 
                       clientFactory: websocketFactory,
                       execute: async (context) => 
{
    ...                           
})

ScenarioBuilder.CreateScenario("rest_api", step)
```

</TabItem>
</Tabs>

### Reporting settings

You can configure reporting settings by setting the following properties in `GlobalSettings` section of the configuration file.

<Tabs
  groupId="example"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'F#', value: 'F#'},  
    {label: 'C#', value: 'C#'}    
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "GlobalSettings": {
        "ReportFileName": "my_report_name",
        "ReportFolder": "./my_reports",
        "ReportFormats": [ "Html", "Md", "Txt", "Csv" ],
        "SendStatsInterval": "00:00:05"
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]
|> NBomberRunner.withReportFileName "my_report_name"
|> NBomberRunner.withReportFolder "./my_reports"
|> NBomberRunner.withReportFormats [
    ReportFormat.Html; ReportFormat.Md; ReportFormat.Txt; ReportFormat.Csv
]
|> NBomberRunner.withReportingInterval(seconds 5)
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)
    .WithReportFileName("my_report_name")
    .WithReportFolder("./my_reports")
    .WithReportFormats(
        ReportFormat.Html, ReportFormat.Md, ReportFormat.Txt, ReportFormat.Csv
    )
    .WithReportingInterval(TimeSpan.FromSeconds(5));
```

</TabItem>
</Tabs>

### Custom settings

Custom settings allow injecting into test scenario user-defined settings. For example, depending on the environment where you run your tests, you want to use different SQL connections or target host addresses. Especially for such use cases, NBomber provides a way to inject any structured JSON object into your scenario and then fetch it and parse it based on a user-defined structure.

Let's imagine that we want to inject different URI to test the target host based on the environment.

```json {7} title="config.json"
{
    "GlobalSettings": {
        "ScenariosSettings": [
            {
                "ScenarioName": "rest_api",

                "CustomSettings": {
                    "TargetHostUri": "https://jsonplaceholder.typicode.com"
                }
            }
        ]
    }
}
```

Ok, let's try to fetch it into our scenario and parse it to get values. First, we need to define a type to represent `CustomSettings`. 

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
[<CLIMutable>]
type CustomScenarioSettings = {
    TargetHostUri: string
}
```

</TabItem>

<TabItem value="C#">

```csharp
public class CustomScenarioSettings
{
    public string TargetHostUri { get; set; }
}
```
</TabItem>
</Tabs>

After this, we should add a handler on [ScenarioInit](general-concepts#scenario-init) to fetch `CustomSettings` related to a specific scenario. Finally, `CustomSettings` is fetched via [ScenarioContext.CustomSettings](general-concepts#scenario-context).

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[    
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'}    
  ]
}>

<TabItem value="F#">

```fsharp {9}
[<CLIMutable>]
type CustomScenarioSettings = {
    TargetHostUri: string
}

let buildScenario () =    

    let scenarioInit (context: IScenarioContext) = task {
        let customSettings <- context.CustomSettings.Get<CustomScenarioSettings>()
        // customSettings.TargetHostUri - you can get parsed value
        context.Logger.Information($"test init received CustomSettings: {customSettings}")
    }

    Scenario.create "rest_api" [step]    
    |> Scenario.withInit scenarioInit
```

</TabItem>

<TabItem value="C#">

```csharp {10}
public class CustomScenarioSettings
{
    public string TargetHostUri { get; set; }
}

public class Example
{
    private static Task ScenarioInit(IScenarioContext context)
    {
        var customSettings = context.CustomSettings.Get<CustomScenarioSettings>();
        // customSettings.TargetHostUri - you can get parsed value
        context.Logger.Information($"test init received CustomSettings: {customSettings}");        
        return Task.CompletedTask;
    }
    
    public static Scenario BuildScenario()
    {
        return ScenarioBuilder        
            .CreateScenario("rest_api", getUser)
            .WithInit(ScenarioInit);           
    }
}
```

</TabItem>
</Tabs>

### Hints analyzer settings

You can enable or disable `HintsAnalyzer` in the `GlobalSettings` section of the configuration file.

<Tabs
  groupId="example"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'}     
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "GlobalSettings": {
        "UseHintsAnalyzer": false
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]
|> NBomberRunner.disableHintsAnalyzer
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)
    .DisableHintsAnalyzer();
```

</TabItem>
</Tabs>

## Infrastructure Configuration

Infrastructure configuration allows you to set or override options related to infrastructure: `Logger`, `WorkerPlugin`, `ReportingSink` (for example: Serilog logger, InfluxDb reporting sink, Ping plugin, etc). This type of configuration is represented as a JSON object with a structure not strictly defined by NBomber but rather by plugin or reporting sink.

Let's consider a basic example of an infrastructure configuration file.

```json title="infra-config.json"
{
    "Serilog": {
        "WriteTo": [{
            "Name": "Elasticsearch",
            "Args": {
                "nodeUris": "http://localhost:9200",
                "indexFormat": "nbomber-index-{0:yyyy.MM}"
            }
        }]
    },

    "PingPlugin": {
        "Hosts": ["jsonplaceholder.typicode.com"],
        "BufferSizeBytes": 32,
        "Ttl": 128,
        "DontFragment": false,
        "Timeout": 1000
    },
    
    "InfluxDBSink": {
        "Url": "http://localhost:8086",
        "Database": "default"
    }
}
```

In order to load such config into NBomber test, you should use `NBomberRunner.loadInfraConfig`. After this, NBomber will apply the loaded configuration. You can read more about loading configs [here](general-concepts#load-configuration-file).

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},   
    {label: 'C#', value: 'C#'}    
  ]
}>

<TabItem value="F#">

```fsharp title="Program.fs"
NBomberRunner.loadInfraConfig "infra-config.json"
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
NBomberRunner.LoadInfraConfig("infra-config.json")
```

</TabItem>
</Tabs>