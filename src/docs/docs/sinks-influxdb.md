---
id: sinks-influxdb
title: InfluxDB sink
---

## Overview

A NBomber sink that writes metrics to InfluxDB. 

:::note
It supports InfluxDb v1.x (*v2.x in development*).
:::

## Installation

Add NBomber.Sinks.InfluxDB package into your project.

```code
dotnet add package NBomber.Sinks.InfluxDB 
```

## API

```fsharp
let influxConfig = InfluxDbSinkConfig.create(url = "http://localhost:8086", database = "default")
use influxDb = new InfluxDBSink(influxConfig)

Scenario.create "buy_one_product_scenario" [login; getProduct; buyProduct]
|> NBomberRunner.registerScenario
|> NBomberRunner.withReportingSinks [influxDb]
|> NBomberRunner.withReportingInterval(seconds 5)
|> NBomberRunner.run
```

### Send global custom tags

You can attach global custom tags to your metrics via `InfluxDbSinkConfig`.

```fsharp
let influxConfig =
    InfluxDbSinkConfig.create(
        url = "http://localhost:8086",     
        customTags = [{ Key = "environment"; Value = "linux" }]
    )
```

Also, you can use [JSON configuration](#json-configuration).

### Send dynamic custom metrics

There could be use cases that you want to send your custom metrics. For example, it can be beneficial for testing advanced business flows. For this, you can get `InfluxClient` and send whatever data you want.

```fsharp {15}
let influxConfig = InfluxDbSinkConfig.create(url = "http://localhost:8086", database = "default")
use influxDb = new InfluxDBSink(influxConfig)

// influxDb.InfluxClient - provides influx client

let login = Step.create("login", fun context -> task {    
    
    let point =
        PointData
            .Measurement("nbomber")
            .Field("my_custom_field", 42.0)
            .Tag("key", "value")
    
    // here we write custom metric
    let writeApi = influxDb.InfluxClient.GetWriteApiAsync()    
    do! writeApi.WritePointAsync(point)

    return Response.ok()
})

Scenario.create "buy_one_product_scenario" [login]
|> NBomberRunner.registerScenario
|> NBomberRunner.withReportingSinks [influxDb]
|> NBomberRunner.withReportingInterval(seconds 5)
|> NBomberRunner.run
```

## Configuration

You can define more advance configuration.

```fsharp
let influxConfig =
    InfluxDbSinkConfig.create(
        url = "http://localhost:8086",
        database = "default",
        userName = "userName",
        password = "password",
        customTags = [{ Key = "environment"; Value = "linux" }]
    )

use influxDb = new InfluxDBSink(influxConfig)

Scenario.create "buy_one_product_scenario" [login; getProduct; buyProduct]
|> NBomberRunner.registerScenario
|> NBomberRunner.withReportingSinks [influxDb]
|> NBomberRunner.withReportingInterval(seconds 5)
|> NBomberRunner.run    
```

### JSON Configuration

JSON Configuration is based on [infrastructure config file](json-config#infrastructure-configuration).

```json title="infra-config.json"
{
    "InfluxDBSink": {
        "Url": "http://localhost:8086",
        "Database": "nbomber",
        "UserName": "userName",
        "Password": "password",
        "CustomTags": [{"Key": "environment", "Value": "linux"}]
    }
}
```

To load the configuration into the sink, we should create an empty instance of the sink (without any configuration) and pass `infra-config.json` into NBomberRunner. After this sink will be initialized by `infra-config.json`.

```fsharp
use influxDb = new InfluxDBSink() // empty instance, without configuration

Scenario.create "buy_one_product_scenario" [login; getProduct; buyProduct]
|> NBomberRunner.registerScenario
|> NBomberRunner.withReportingSinks [influxDb]
|> NBomberRunner.withReportingInterval(seconds 5)
|> NBomberRunner.loadInfraConfig "infra-config.json" // load config
|> NBomberRunner.run  
```

### Init sink via InfluxClient

In case you need to set up the connection to `InfluxDB` using raw driver client.

:::note
You can use this approach to create connection to InfluxDB v2.*.
:::

```fsharp
// creates connection to InfluxDB v1.*
let client = InfluxDBClientFactory.CreateV1(url, userName, password, database, retentionPolicy)

// also you can create connection to InfluxDB v2.*
let client = InfluxDBClientFactory.Create(url, token)

let influxDb = new InfluxDBSink(client)

Scenario.create "buy_one_product_scenario" [login; getProduct; buyProduct]
|> NBomberRunner.registerScenario
|> NBomberRunner.withReportingSinks [influxDb]
|> NBomberRunner.withReportingInterval(seconds 5)
|> NBomberRunner.loadInfraConfig "infra-config.json" // load config
|> NBomberRunner.run 
```