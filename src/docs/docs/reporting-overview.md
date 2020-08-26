---
id: reporting-overview
title: Reporting overview
---

NBomber provides live metrics which can be persisted and visualised. Also, you will be able to have historicals since data will be persisted and you can analyze performance trends. Usually, metrics persisted in time series database and visualized by [Grafana](https://grafana.com/). Here is a list of ready-made reporting sinks that you can use in your projects: 

- [InfluxDB sink](sinks-influxdb)
- [Prometheus sink](sinks-prometheus)

## Reporting sink development

To develop reporting sink NBomber provides an interface:

```fsharp
type IReportingSink =
    inherit IDisposable
    abstract SinkName: string
    abstract Init: logger:ILogger * infraConfig:IConfiguration option -> unit
    abstract Start: testInfo:TestInfo -> Task
    abstract SaveRealtimeStats: stats:NodeStats[] -> Task
    abstract SaveFinalStats: stats:NodeStats[] -> Task
    abstract Stop: unit -> Task
```