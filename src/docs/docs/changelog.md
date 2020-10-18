---
id: changelog
title: Changelog
---

## Version 1.1.0

### NBomber

- New HTML report by [@Yaroshvitaliy](https://github.com/Yaroshvitaliy). [commit](https://github.com/PragmaticFlow/NBomber/commit/b0435a8baddcea220b4cae2f11dc4e280f20b268).
It was completely redesigned and new charts were added. You can check out by this [link](https://nbomber.com/img/nbomber_report_v1-1-0.html). 

- NBomberRunner allows to set output folder for reports. [commit](https://github.com/PragmaticFlow/NBomber/commit/5279f5c6a0b40b091b9698e47ff092aeb4958567).
```fsharp
NBomberRunner.withReportFolder "./my_reports"
```

And also you can use config.json for this.
```json
{
    "ReportFileName": "custom_report_name",
    "ReportFolder": "./my_reports",
}
```

- "WarmUpDuration" setting for config.json is optional. [commit](https://github.com/PragmaticFlow/NBomber/commit/09c8de5e36e436ab2ca1728b54761feebf46a569).
```fsharp
type ScenarioSetting = {
    ScenarioName: string
    WarmUpDuration: string option
    LoadSimulationsSettings: LoadSimulationSettings list
    ConnectionPoolSettings: ConnectionPoolSetting list option
    CustomSettings: string option
}
```

- Added NuGet symbols to all packages. Now you can go through F# sources during development or debugging.

### NBomber.Http

- added missing C# API overload. [commit](https://github.com/PragmaticFlow/NBomber.Http/commit/49433dc9aa576c0d066b79eae427cd5bb47e55e4)
- fixed the issue with set custom file size within .Check() method. [commit](https://github.com/PragmaticFlow/NBomber.Http/commit/5039a844b0f7d55840aa1a15a2655de7a4f0151a)
