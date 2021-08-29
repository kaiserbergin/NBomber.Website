---
id: json-config
title: JSON Configuration
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about configuring NBomber tests via configuration files.
NBomber supports two types of configuration: load tests configuration and infrastructure configuration.

Load tests configuration allows you to set up:
- load test settings (test suite, test name)
- target scenarios
- scenario settings
- - warming up
- - load simulations
- - client factory
- - custom settings
- reporting
- - report file name
- - report folder
- - report formats
- - send statistic interval
- hint analyzer

Let's consider how a configuration file looks like and how to load it in NBomber:

<Tabs
  groupId="config"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}   
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "TestSuite": "json_config",
    "TestName": "json_config_example",

    "TargetScenarios": ["rest_api"],

    "GlobalSettings": {
        "ScenariosSettings": [
            {
                "ScenarioName": "rest_api",
                "WarmUpDuration": "00:00:05",

                "LoadSimulationsSettings": [
                    { "InjectPerSec": [100, "00:00:15"] },
                    { "InjectPerSec": [200, "00:00:15"] }
                ],

                "ClientFactorySettings": [
                    { "FactoryName": "http_factory", "ClientCount": 2 }
                ],

                "CustomSettings": {
                    "BaseUri": "https://jsonplaceholder.typicode.com"
                }
            }
        ],

        "ReportFileName": "my_report_name",
        "ReportFolder": "./my_reports",
        "ReportFormats": [ "Html", "Md", "Txt", "Csv" ],
        "SendStatsInterval": "00:00:05",

        "UseHintsAnalyzer": true
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
NBomberRunner
    .LoadConfig("config.json")
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
NBomberRunner.loadConfig "config.json"
```

</TabItem>

</Tabs>

Infrastructure configuration allows you to set up:
- Serilog logger
- worker plugins
- reporting sinks

The following is an example of such a configuration:

<Tabs
  groupId="infra-config"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}   
  ]
}>

<TabItem value="JSON">

```json title="config.json"
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

    "CustomPlugin": {
        "Message": "Plugin is configured via infra config"
    },

    "InfluxDBSink": {
        "Url": "http://localhost:8086",
        "Database": "default"
    },

    "CustomReportingSink": {
        "Message": "Reporting sink is configured via infra config"
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
NBomberRunner
    .LoadInfraConfig("infra-config.json")
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
NBomberRunner.loadInfraConfig "infra-config.json"
```

</TabItem>

</Tabs>

Please refer to the following links to see the full example:
[C#](https://github.com/PragmaticFlow/NBomber/tree/dev/examples/CSharpProd/JsonConfig), [F#](https://github.com/PragmaticFlow/NBomber/tree/dev/examples/FSharpProd/JsonConfig).

Let's consider load test and infrastructure configuration in details.

### NBomber load test configuration

You can configure your NBomber tests using JSON configuration. 
It will help you to keep your code clean and to concentrate on your load testing logic rather configuring.

Please refer to the following [link](https://github.com/PragmaticFlow/NBomber/blob/main/src/NBomber/Configuration/Configuration.fs) to see corresponding model that JSON file is parsed to.

Please note, JSON configuration will override all the settings set up with API.

#### Load test settings

You can set test suite and test name of load test by setting corresponding properties in the root of JSON configuration:

<Tabs
  groupId="load-test-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}   
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "TestSuite": "json_config",
    "TestName": "json_config_example"
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
var step1 = Step.Create("step1", async context => Response.Ok());

var scenario1 = ScenarioBuilder
    .CreateScenario("scenario1", step1)
    .WithLoadSimulations(
        Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
    );

NBomberRunner
    .RegisterScenarios(scenario1)
    .LoadConfig("config.json")
    .Run();
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
let step1 = Step.create("step1", fun context -> task {
    return Response.ok()
})

Scenario.create "scenario1" [step1]
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]
|> NBomberRunner.registerScenario
|> NBomberRunner.loadConfig "config.json"
|> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Target scenario settings
You can register all scenarios you have for your test but run only those that you are interested in by setting target scenarios in the root of configuration file. 
Thus, you can configure your NBomber tests dynamically by choosing needed configuration file.
Please note, if no TargetScenarios property is set in the configuration file, all registered scenarios will run.

<Tabs
  groupId="target-scenario-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}   
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "TargetScenarios": ["scenario1"]
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
var step1 = Step.Create("step1", async context => Response.Ok());

var scenario1 = ScenarioBuilder
    .CreateScenario("scenario1", step1)
    .WithLoadSimulations(
        Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
    );

// there is no scenario2 in target scenarios list, so it will be ignored
var scenario2 = ScenarioBuilder
    .CreateScenario("scenario2", step1)
    .WithLoadSimulations(
        Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
    );


NBomberRunner
    .RegisterScenarios(scenario1, scenario2)
    .LoadConfig("config.json")
    .Run();
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
let step1 = Step.create("step1", fun context -> task {
    return Response.ok()
})

let scenario1 =
    Scenario.create "scenario1" [step1]
    |> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]

// there is no scenario2 in target scenarios list, so it will be ignored
let scenario2 = 
    Scenario.create "scenario2" [step1]
    |> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]

NBomberRunner.registerScenarios [scenario1; scenario2]
|> NBomberRunner.loadConfig "config.json"
|> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Reporting settings
You can configure your reporting by setting the following properties in `GlobalSettings` section of the configuration file:

<Tabs
  groupId="reporting-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}  
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

<TabItem value="C#">

```csharp title="Program.cs"
var step1 = Step.Create("step1", async context => Response.Ok());

var scenario1 = ScenarioBuilder
    .CreateScenario("scenario1", step1)
    .WithLoadSimulations(
        Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
    );

NBomberRunner
    .RegisterScenarios(scenario1)
    .LoadConfig("config.json")
    .Run();
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
let step1 = Step.create("step1", fun context -> task {
    return Response.ok()
})

Scenario.create "scenario1" [step1]
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]
|> NBomberRunner.registerScenario
|> NBomberRunner.loadConfig "config.json"
|> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Hints analyzer settings

You can enable or disable hints analyzer in the `GlobalSettings` section of configuration file:

<Tabs
  groupId="global-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'}    
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "GlobalSettings": {
        "UseHintsAnalyzer": true
    }
}
```

</TabItem>

</Tabs>

#### Scenario settings
You can configure your scenarios in `GlobalSettings.ScenariosSettings` section of the configuration file:

<Tabs
  groupId="scenario-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}  
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
                    { "InjectPerSec": [100, "00:00:15"] },
                    { "InjectPerSec": [200, "00:00:15"] }
                ]
            }
        ]
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
var step1 = Step.Create("step1", async context => Response.Ok());
var scenario1 = ScenarioBuilder.CreateScenario("scenario1", step1);

NBomberRunner
    .RegisterScenarios(scenario1)
    .LoadConfig("config.json")
    .Run();
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
let step1 = Step.create("step1", fun context -> task {
    return Response.ok()
})

Scenario.create "scenario1" [step1]
|> NBomberRunner.registerScenario
|> NBomberRunner.loadConfig "config.json"
|> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Client factory settings
You can configure your client factory settings for a scenario in `GlobalSettings.ScenariosSettings` section of configuration file: 

<Tabs
  groupId="client-factory-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}
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
                    { "FactoryName": "http_factory", "ClientCount": 2 }
                ]
            }
        ]
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
public class UserResponse
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
}

public static class JsonConfigExample
{
    public static void Run()
    {
        var httpFactory = ClientFactory.Create("http_factory",
            initClient: (number,context) => Task.FromResult(new HttpClient()));

        var getUser = Step.Create("get_user", httpFactory, async context =>
        {
            var userId = 1;
            var url = $"https://jsonplaceholder.typicode.com/users?id={userId}";

            var response = await context.Client.GetAsync(url, context.CancellationToken);
            var json = await response.Content.ReadAsStringAsync();

            // parse JSON
            var users = JsonConvert.DeserializeObject<UserResponse[]>(json);

            return users?.Length == 1
                ? Response.Ok(users.First()) // we pass user object response to the next step
                : Response.Fail("not found user");
        });

        var scenario1 = ScenarioBuilder
            .CreateScenario("rest_api", getUser)
            .WithLoadSimulations(
                Simulation.InjectPerSec(rate: 1, during: TimeSpan.FromSeconds(30))
            );

        NBomberRunner
            .RegisterScenarios(scenario1)
            .LoadConfig("config.json")
            .Run();      
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
[<CLIMutable>]
type UserResponse = {
    Id: string
    Name: string
    Email: string
    Phone: string
}

let run () =

    let httpFactory =
        ClientFactory.create(name = "http_factory",
                             initClient = fun (number,context) -> task {
                                 return new HttpClient()
                             })

    let getUser = Step.create("get_user",
                              clientFactory = httpFactory,
                              execute = fun context -> task {

        let userId = 1
        let url = $"https://jsonplaceholder.typicode.com/users?id={userId}"

        let! response = context.Client.GetAsync(url, context.CancellationToken)
        let! json = response.Content.ReadAsStringAsync()

        // parse JSON
        let users = json
                    |> JsonConvert.DeserializeObject<UserResponse[]>
                    |> ValueOption.ofObj

        match users with
        | ValueSome usr when usr.Length = 1 ->
            return Response.ok(usr.[0]) // we pass user object response to the next step

        | _ -> return Response.fail($"not found user: {userId}")
    })

    Scenario.create "rest_api" [getUser]
    |> Scenario.withLoadSimulations [InjectPerSec(rate = 1, during = seconds 30)]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.loadConfig "config.json"
    |> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Custom settings

So far you have seen how you can configure NBomber tests via configuration files. 
But what if you want to extend your test by custom configuration settings? 
How would you pass the base URI for an http client of a scenario, for instance?
For such a case NBomber provides dedicated configuration settings called **Custom Settings** where you can put any object and then fetch it to your test:

<Tabs
  groupId="custom-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}
  ]
}>

<TabItem value="JSON">

```json title="config.json"
{
    "GlobalSettings": {
        "ScenariosSettings": [
            {
                "ScenarioName": "rest_api",

                "CustomSettings": {
                    "BaseUri": "https://jsonplaceholder.typicode.com"
                }
            }
        ]
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
public class CustomScenarioSettings
{
    public string BaseUri { get; set; }
}

public class UserResponse
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }
}

public static class JsonConfigExample
{
    private static CustomScenarioSettings _customSettings = new CustomScenarioSettings();

    private static Task ScenarioInit(IScenarioContext context)
    {
        _customSettings = context.CustomSettings.Get<CustomScenarioSettings>();
        context.Logger.Information($"test init received CustomSettings: {_customSettings}");
        return Task.CompletedTask;
    }

    public static void Run()
    {
        var httpFactory = ClientFactory.Create("http_factory",
            initClient: (number,context) => 
              Task.FromResult(new HttpClient { BaseAddress = new Uri(_customSettings.BaseUri)}));

        var getUser = Step.Create("get_user", httpFactory, async context =>
        {
            var userId = 1;
            var url = $"users?id={userId}";

            var response = await context.Client.GetAsync(url, context.CancellationToken);
            var json = await response.Content.ReadAsStringAsync();

            // parse JSON
            var users = JsonConvert.DeserializeObject<UserResponse[]>(json);

            return users?.Length == 1
                ? Response.Ok(users.First()) // we pass user object response to the next step
                : Response.Fail("not found user");
        });

        var scenario1 = ScenarioBuilder
            .CreateScenario("rest_api", getUser)
            .WithInit(ScenarioInit)
            .WithLoadSimulations(
                Simulation.InjectPerSec(rate: 1, during: TimeSpan.FromSeconds(30))
            );

        NBomberRunner
            .RegisterScenarios(scenario1)
            .LoadConfig("config.json")
            .Run();
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
[<CLIMutable>]
type UserResponse = {
    Id: string
    Name: string
    Email: string
    Phone: string
}

[<CLIMutable>]
type CustomScenarioSettings = {
    BaseUri: string
}

let run () =

    let mutable _customSettings = Unchecked.defaultof<CustomScenarioSettings>

    let scenarioInit (context: IScenarioContext) = task {
        _customSettings <- context.CustomSettings.Get<CustomScenarioSettings>()
        context.Logger.Information($"test init received CustomSettings: {_customSettings}")
    }

    let httpFactory =
        ClientFactory.create(name = "http_factory",
                             initClient = fun (number,context) -> task {
                                 return new HttpClient(BaseAddress = Uri(_customSettings.BaseUri))
                             })

    let getUser = Step.create("get_user",
                              clientFactory = httpFactory,
                              execute = fun context -> task {

        let userId = 1
        let url = $"users?id={userId}"

        let! response = context.Client.GetAsync(url, context.CancellationToken)
        let! json = response.Content.ReadAsStringAsync()

        // parse JSON
        let users = json
                    |> JsonConvert.DeserializeObject<UserResponse[]>
                    |> ValueOption.ofObj

        match users with
        | ValueSome usr when usr.Length = 1 ->
            return Response.ok(usr.[0]) // we pass user object response to the next step

        | _ -> return Response.fail($"not found user: {userId}")
    })

    Scenario.create "rest_api" [getUser]
    |> Scenario.withLoadSimulations [InjectPerSec(rate = 1, during = seconds 30)]
    |> Scenario.withInit scenarioInit
    |> NBomberRunner.registerScenario
    |> NBomberRunner.loadConfig "config.json"
    |> NBomberRunner.run
```

</TabItem>

</Tabs>

Please note, your custom settings is located within related scenario settings.

### NBomber infrastructure configuration

Also you can configure your infrastructure settings using dedicated configuration file: logging, worker plugins, reporting sinks.
Let's consider examples below.

#### Logger settings

As a logger, NBomber uses Serilog with File and [Spectre.Console](https://github.com/PragmaticFlow/Serilog.Sinks.SpectreConsole) sinks.
You can configure additional sinks in `Serilog` section of infrastructure configuration file. 
In an example below we write Nbomber's logs in Elasticsearch. 
Also you can define your own Serilog sink and write logs whatewer you want.

<Tabs
  groupId="logger-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}
  ]
}>

<TabItem value="JSON">

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
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
var step1 = Step.Create("step1", async context => Response.Ok());

var scenario1 = ScenarioBuilder
    .CreateScenario("scenario1", step1)
    .WithLoadSimulations(
        Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
    );

NBomberRunner
    .RegisterScenarios(scenario1)
    .LoadInfraConfig("infra-config.json")
    .Run();
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
let step1 = Step.create("step1", fun context -> task {
    return Response.ok()
})

Scenario.create "scenario1" [step1]
|> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]
|> NBomberRunner.registerScenario
|> NBomberRunner.loadInfraConfig "infra-config.json"
|> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Worker plugin settings

When you use existing or custom worker plugin you can configure it via infrastructure configuration by implementing Init method:

<Tabs
  groupId="worker-plugin-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}
  ]
}>

<TabItem value="JSON">

```json title="infra-config.json"
{
    "PingPlugin": {
        "Hosts": ["jsonplaceholder.typicode.com"],
        "BufferSizeBytes": 32,
        "Ttl": 128,
        "DontFragment": false,
        "Timeout": 1000
    },

    "CustomPlugin": {
        "Message": "Plugin is configured via infra config"
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
public class CustomPluginSettings
{
    public string Message { get; set; }
}

public class CustomPlugin : IWorkerPlugin
{
    private readonly DataSet _pluginStats = new DataSet();
    private CustomPluginSettings _customPluginSettings;

    public CustomPlugin(CustomPluginSettings customPluginSettings) =>
        _customPluginSettings = customPluginSettings;

    public string PluginName => nameof(CustomPlugin);

    public Task Init(IBaseContext context, IConfiguration infraConfig)
    {
        var logger = context.Logger.ForContext<CustomPlugin>();

        _customPluginSettings =
            infraConfig.GetSection(nameof(CustomPlugin)).Get<CustomPluginSettings>()
            ?? _customPluginSettings;

        var settingsJson = JsonSerializer.Serialize(_customPluginSettings);

        logger.Information($"{nameof(CustomPlugin)} settings: {settingsJson}");

        return Task.CompletedTask;
    }

    public Task Start() => Task.CompletedTask;

    public Task<DataSet> GetStats(OperationType currentOperation) => Task.FromResult(_pluginStats);

    public string[] GetHints() => Array.Empty<string>();

    public Task Stop() => Task.CompletedTask;

    public void Dispose()
    {
    }
}

public static class JsonConfigExample
{
    public static void Run()
    {
        var step1 = Step.Create("step1", async context => Response.Ok());

        var scenario1 = ScenarioBuilder
            .CreateScenario("scenario1", step1)
            .WithLoadSimulations(
                Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
            );

        // settings are overriden in infra-config.json
        var pingPlugin = new PingPlugin();

        var customPlugin = new CustomPlugin(new CustomPluginSettings
            {Message = "Plugin is configured via constructor"});            

        NBomberRunner
            .RegisterScenarios(scenario1)
            .WithWorkerPlugins(pingPlugin, customPlugin)
            .LoadInfraConfig("infra-config.json")
            .Run();
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
module Option =

    let ofRecord (value: 'T) =
        let boxed = box(value)
        if isNull boxed then None
        else Some value

[<CLIMutable>]
type CustomPluginSettings = {
    Message: string
}

type CustomPlugin(customPluginSettings: CustomPluginSettings) =
    let mutable _pluginStats = new DataSet()

    interface IWorkerPlugin with
        member _.PluginName = nameof(CustomPlugin)

        member _.Init(context, infraConfig) =
            let logger = context.Logger.ForContext<CustomPluginSettings>()

            let settings =
                infraConfig.GetSection(nameof(CustomPlugin)).Get<CustomPluginSettings>()
                |> Option.ofRecord
                |> Option.defaultValue customPluginSettings

            logger.Information($"{nameof(CustomPlugin)} settings: {settings}")

            Task.CompletedTask

        member _.Start() = Task.CompletedTask
        member _.GetStats(currentOperation) = Task.FromResult(_pluginStats)
        member _.GetHints() = Array.empty
        member _.Stop() = Task.CompletedTask
        member _.Dispose() = ()

let run () =

    let step1 = Step.create("step1", fun context -> task {
        return Response.ok()
    })

    // settings are overriden in infra-config.json
    let pingPlugin = new PingPlugin()
    let customPlugin = new CustomPlugin({ Message = "Plugin is configured via constructor" })

    Scenario.create "scenario1" [step1]
    |> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.withWorkerPlugins [pingPlugin; customPlugin]
    |> NBomberRunner.loadInfraConfig "infra-config.json"
    |> NBomberRunner.run
```

</TabItem>

</Tabs>

#### Reporting sink settings

When you use existing or custom reporting sink you can configure it via infrastructure configuration by implementing Init method:

<Tabs
  groupId="reporting-sink-settings"
  defaultValue="JSON"
  values={[
    {label: 'JSON', value: 'JSON'},
    {label: 'C#', value: 'C#'},
    {label: 'F#', value: 'F#'}   
  ]
}>

<TabItem value="JSON">

```json title="infra-config.json"
{
    "InfluxDBSink": {
        "Url": "http://localhost:8086",
        "Database": "default"
    },

    "CustomReportingSink": {
        "Message": "Reporting sink is configured via infra config"
    }
}
```

</TabItem>

<TabItem value="C#">

```csharp title="Program.cs"
public class CustomReportingSinkSettings
{
    public string Message { get; set; }
}

public class CustomReportingSink : IReportingSink
{
    private CustomReportingSinkSettings _customReportingSinkSettings;

    public CustomReportingSink(CustomReportingSinkSettings customReportingSinkSettings) =>
    _customReportingSinkSettings = customReportingSinkSettings;

    public string SinkName => nameof(CustomReportingSink);

    public Task Init(IBaseContext context, IConfiguration infraConfig)
    {
        var logger = context.Logger.ForContext<CustomReportingSink>();

        _customReportingSinkSettings =
            infraConfig.GetSection(nameof(CustomReportingSink)).Get<CustomReportingSinkSettings>()
            ?? _customReportingSinkSettings;

        var settingsJson = JsonSerializer.Serialize(_customReportingSinkSettings);

        logger.Information($"{nameof(CustomReportingSink)} settings: {settingsJson}");

        return Task.CompletedTask;
    }

    public Task Start() => Task.CompletedTask;
    public Task SaveRealtimeStats(ScenarioStats[] stats) => Task.CompletedTask;
    public Task SaveFinalStats(NodeStats[] stats) => Task.CompletedTask;
    public Task Stop() => Task.CompletedTask;

    public void Dispose()
    {
    }
}

public static class JsonConfigExample
{
    public static void Run()
    {
        var step1 = Step.Create("step1", async context => Response.Ok());

        var scenario1 = ScenarioBuilder
            .CreateScenario("scenario1", step1)
            .WithLoadSimulations(
                Simulation.KeepConstant(copies: 1, during: TimeSpan.FromSeconds(30))
            );

        // settings are overriden in infra-config.json
        var influxDbReportingSink = new InfluxDBSink();

        var customReportingSink = new CustomReportingSink(new CustomReportingSinkSettings
            {Message = "Reporting sink is configured via constructor"});           

        NBomberRunner
            .RegisterScenarios(scenario1)
            .WithReportingSinks(influxDbReportingSink, customReportingSink)
            .LoadInfraConfig("infra-config.json")
            .Run();
    }
}
```

</TabItem>

<TabItem value="F#">

```fsharp title="Program.fs"
module Option =

    let ofRecord (value: 'T) =
        let boxed = box(value)
        if isNull boxed then None
        else Some value
        
[<CLIMutable>]
type CustomReportingSinkSettings = {
    Message: string
}

type CustomReportingSink(customReportingSinkSettings: CustomReportingSinkSettings) =
    interface IReportingSink with
        member _.SinkName = nameof(CustomReportingSink)
        member _.Init(context, infraConfig) =
            let logger = context.Logger.ForContext<CustomReportingSinkSettings>()

            let settings =
                infraConfig.GetSection(nameof(CustomReportingSink)).Get<CustomReportingSinkSettings>()
                |> Option.ofRecord
                |> Option.defaultValue customReportingSinkSettings

            logger.Information($"{nameof(CustomReportingSink)} settings: {settings}")

            Task.CompletedTask
        member _.Start() = Task.CompletedTask
        member _.SaveRealtimeStats(stats) = Task.CompletedTask
        member _.SaveFinalStats(stats) = Task.CompletedTask
        member _.Stop() = Task.CompletedTask
        member _.Dispose() = ()

let run () =

    let step1 = Step.create("step1", fun context -> task {
        return Response.ok()
    })

    // settings are overriden in infra-config.json
    let influxDbReportingSink = new InfluxDBSink();
    let customReportingSink = new CustomReportingSink({ Message = "Reporting sink is configured via constructor" })

    Scenario.create "scenario1" [step1]
    |> Scenario.withLoadSimulations [KeepConstant(copies = 1, during = seconds 30)]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.withReportingSinks [influxDbReportingSink; customReportingSink]
    |> NBomberRunner.loadInfraConfig "infra-config.json"
    |> NBomberRunner.run
```

</TabItem>

</Tabs>