---
id: test-assertions
title: Test assertions
---

The Assertions API is used to verify that global statistics like response time or number of failed requests matches expectations for a whole, one can easily add the assertion by calling assertion method in a the setup.

You are asserting on received statistics

This is all available fields to assert on:

```fsharp
type StepStats = {
    StepName: string
    RequestCount: int
    OkCount: int
    FailCount: int
    Min: int
    Mean: int
    Max: int
    RPS: int
    Percent50: int
    Percent75: int
    Percent95: int
    StdDev: int
    MinDataKb: float
    MeanDataKb: float
    MaxDataKb: float
    AllDataMB: float
}

type LatencyCount = {
    Less800: int
    More800Less1200: int
    More1200: int
}

type ScenarioStats = {
    ScenarioName: string
    RequestCount: int
    OkCount: int
    FailCount: int
    AllDataMB: float
    StepStats: StepStats[]
    LatencyCount: LatencyCount
    Duration: TimeSpan
}

type NodeStats = {
    RequestCount: int
    OkCount: int
    FailCount: int
    AllDataMB: float
    ScenarioStats: ScenarioStats[]
    PluginStats: DataSet[]
    NodeInfo: NodeInfo
}
```

NBomber test should be treated as a regular unit test. So if you have already some unit test integration with your CI/CD then basically you already have NBomber integration too.


This is a link to [another document.](doc3.md) This is a link to an [external page.](http://www.example.com/)
