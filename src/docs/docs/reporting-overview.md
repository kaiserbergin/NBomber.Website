---
id: reporting-overview
title: Reporting overview
---

This document will help you learn about NBomber reports (*HTML, MarkDown, CSV, TXT*) and real-time metrics which can be persisted and visualized. NBomber provides a concept of `ReportingSink` that you should use to start sending metrics into your metrics data store. Usually, metrics persisted in time series database ([InfluxDB](https://www.influxdata.com/), [TimeScale](https://www.timescale.com/), [Prometheus](https://prometheus.io/)) and visualized by [Grafana](https://grafana.com/).

Here is Grafana dashboard that you can import.

- [Grafana dashboard](https://github.com/PragmaticFlow/NBomber.Grafana)

Here is a list of existing reporting sinks that you can use in your projects.

- [InfluxDB sink](sinks-influxdb)
- [TimeScale sink](#) - *in development*.
- [Prometheus sink](#) - *in development*.

## Reporting sink development

NBomber provides an interface that you should implement to develop your custom `ReportingSink`.

```fsharp
type IReportingSink =
    inherit IDisposable
    abstract SinkName: string
    abstract Init: context:IBaseContext * infraConfig:IConfiguration -> Task
    abstract Start: unit -> Task
    abstract SaveRealtimeStats: stats:ScenarioStats[] -> Task
    abstract SaveFinalStats: stats:NodeStats[] -> Task
    abstract Stop: unit -> Task
```