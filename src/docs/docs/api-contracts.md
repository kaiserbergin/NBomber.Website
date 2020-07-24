---
id: api-contracts
title: API Contracts
---

## Step contracts

```fsharp
type CorrelationId = {
    Id: string
    ScenarioName: string
    CopyNumber: int
}

type Response = {
    Payload: obj
    SizeBytes: int
    Exception: exn option
    LatencyMs: int
}

type IStep =
    abstract StepName: string

type IConnectionPoolArgs<'TConnection> =
    abstract PoolName: string
    abstract ConnectionCount: int
    abstract OpenConnection: number:int * cancellationToken:CancellationToken -> Task<'TConnection>
    abstract CloseConnection: connection:'TConnection * cancellationToken:CancellationToken -> Task

type IFeedProvider<'TFeedItem> =
    abstract GetAllItems: unit -> 'TFeedItem[]

type IFeed<'TFeedItem> =
    abstract FeedName: string
    abstract GetNextItem: correlationId:CorrelationId * stepData:Dict<string,obj> -> 'TFeedItem

type IStepContext<'TConnection,'TFeedItem> =
    abstract CorrelationId: CorrelationId
    abstract CancellationToken: CancellationToken
    abstract Connection: 'TConnection
    abstract Data: Dict<string,obj>
    abstract FeedItem: 'TFeedItem
    abstract Logger: ILogger
    abstract GetPreviousStepResponse: unit -> 'T
    abstract StopScenario: scenarioName:string * reason:string -> unit
    abstract StopCurrentTest: reason:string -> unit
```

## Scenario contracts

```fsharp
type Scenario = {
    ScenarioName: string
    Init: (ScenarioContext -> Task) option
    Clean: (ScenarioContext -> Task) option
    Steps: IStep list
    WarmUpDuration: TimeSpan
    LoadSimulations: LoadSimulation list
}

type ScenarioContext = {
    NodeInfo: NodeInfo
    CustomSettings: string
    CancellationToken: CancellationToken
    Logger: ILogger
}

type LoadSimulation =
    | RampConstant of copies:int * during:TimeSpan
    | KeepConstant of copies:int * during:TimeSpan
    | RampPerSec   of rate:int   * during:TimeSpan
    | InjectPerSec of rate:int   * during:TimeSpan
```

## Statistics contracts

```fsharp
type TestInfo = {
    SessionId: string
    TestSuite: string
    TestName: string
}

type NodeType =
    | SingleNode
    | Coordinator
    | Agent
    | Cluster

type NodeOperationType =
    | None = 0
    | Init = 1
    | WarmUp = 2
    | Bombing = 3
    | Stop = 4
    | Complete = 5

type NodeInfo = {
    MachineName: string
    NodeType: NodeType
    CurrentOperation: NodeOperationType
    OS: OperatingSystem
    DotNetVersion: string
    Processor: string
    CoresCount: int
}

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

## NBomber context contracts

```fsharp
type ReportFormat =
    | Txt = 0
    | Html = 1
    | Csv = 2
    | Md = 3
    
type ReportFile = {
    FilePath: string
    ReportFormat: ReportFormat
}

type IReportingSink =
    inherit IDisposable
    abstract SinkName: string
    abstract Init: logger:ILogger * infraConfig:IConfiguration option -> unit
    abstract StartTest: testInfo:TestInfo -> Task
    abstract SaveRealtimeStats: stats:NodeStats[] -> Task
    abstract SaveFinalStats: stats:NodeStats[] -> Task
    abstract StopTest: unit -> Task

type IPlugin =
    inherit IDisposable
    abstract PluginName: string
    abstract Init: logger:ILogger * infraConfig:IConfiguration option -> unit
    abstract StartTest: testInfo:TestInfo -> Task
    abstract GetStats: unit -> DataSet
    abstract StopTest: unit -> Task

type ApplicationType =
    | Process = 0
    | Console = 1

type NBomberContext = {
    TestSuite: string
    TestName: string
    RegisteredScenarios: Scenario list
    NBomberConfig: NBomberConfig option
    InfraConfig: IConfiguration option
    CreateLoggerConfig: (unit -> LoggerConfiguration) option
    ReportFileName: string option
    ReportFormats: ReportFormat list
    ReportingSinks: IReportingSink list
    SendStatsInterval: TimeSpan
    Plugins: IPlugin list
    ApplicationType: ApplicationType option
}
```

## NBomber configuration contracts

```fsharp
type LoadSimulationSettings =
    | RampConstant of copies:int * during:string
    | KeepConstant of copies:int * during:string
    | RampPerSec   of rate:int   * during:string
    | InjectPerSec of rate:int   * during:string

type ConnectionPoolSetting = {
    PoolName: string
    ConnectionCount: int
}

type ScenarioSetting = {
    ScenarioName: string
    WarmUpDuration: string
    LoadSimulationsSettings: LoadSimulationSettings list
    ConnectionPoolSettings: ConnectionPoolSetting list option
    CustomSettings: string option
}

type GlobalSettings = {
    ScenariosSettings: ScenarioSetting list option
    ReportFileName: string option
    ReportFormats: ReportFormat list option
    SendStatsInterval: string option
}

type NBomberConfig = {
    TestSuite: string option
    TestName: string option
    TargetScenarios: string list option
    GlobalSettings: GlobalSettings option
}
```