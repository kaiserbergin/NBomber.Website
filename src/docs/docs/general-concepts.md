---
id: general-concepts
title: General concepts
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

This document will help you learn about NBomber general concepts in more detail. The whole API is mainly built around these building blocks:

- [Step](#step) - helps you define user actions.
- [DataFeed](#datafeed) - helps you inject test data into your load test. It represents a data source.
- [ClientFactory](#clientfactory) - helps you create and initialize API clients to work with specific API or protocol. 
- [Scenario](#scenario) - helps you define user interaction flows.
- [NBomberRunner](#nbomberrunner) - helps you configure and run NBomber load tests.

## Step

Step and Scenario play the most important role in building real-world simulations with NBomber. To represent users behaviors, testers should define scenarios with steps. The scenario is basically a workflow that virtual users will follow. The step represents a single user action like login, logout, etc. 

For example, a standard e-commerce scenario could be defined via the following group of steps:

- Step 1: Login
- Step 2: Access home page
- Step 3: Open a product description

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// it's pseudocode example 
let login   = Step.create("login", fun context -> ...)
let home    = Step.create("home_page", fun context -> ...)
let product = Step.create("product_page", fun context -> ...)

let scenario = Scenario.create "test_scenario" [login; home; product]
```

</TabItem>

<TabItem value="C#">

```csharp
// it's pseudocode example 
var login   = Step.Create("login", context => ...);
var home    = Step.Create("home_page", context => ...);
var product = Step.Create("product_page", context => ...);

var scenario = ScenarioBuilder.CreateScenario("test_scenario", login, home, product);
```

</TabItem>
</Tabs>

The thing is that NBomber is measuring the execution time of each step to record the latency (request and response time). Here is a pseudocode example where you can see how NBromber is executing steps.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// it's pseudocode example 
// this is simplified version of how NBomber is executing steps
// by default, all steps execute sequentially

let login   = Step.create("login", fun context -> ...)
let home    = Step.create("home_page", fun context -> ...)
let product = Step.create("product_page", fun context -> ...)

let scenario = Scenario.create "test_scenario" [login; home; product]

for step in scenario.Steps do

    // step's execution time will be measured.
    let start = getCurrentTime()    
    
    step.Execute()        

    let end = getCurrentTime()

    // now, we can calculate the latency of given step
    let latency = end - start
```

</TabItem>

<TabItem value="C#">

```csharp
// it's pseudocode example 
// this is simplified version of how NBomber is executing steps
// by default, all steps execute sequentially

var login   = Step.Create("login", context => ...);
var home    = Step.Create("home_page", context => ...);
var product = Step.Create("product_page", context => ...);

var scenario = ScenarioBuilder.CreateScenario("test_scenario", login, home, product);

foreach (var step in scenario.Steps)
{
    // step's execution time will be measured.
    var start = GetCurrentTime();    
    
    step.Execute();

    var end = GetCurrentTime();

    // now, we can calculate the latency of given step
    var latency = end - start;
}
```

</TabItem>
</Tabs>

Ok, now let's define a simple hello world scenario with two steps and run it.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let step1 = Step.create("step 1", fun context -> task {        
    
    // you can define and execute any logic here,
    // for example: send http request, SQL query etc
    // NBomber will measure how much time it takes to execute your step

    do! Task.Delay(seconds 1)

    context.Logger.Information("step 1 is invoked!!!")    

    return Response.ok()
})

let step2 = Step.create("step 2", fun context -> task {        
    
    do! Task.Delay(seconds 1)

    context.Logger.Information("step 2 is invoked!!!")    

    return Response.ok()
})

let scenario = Scenario.create "hello_world" [step1; step2]
    
NBomberRunner.registerScenario scenario
|> NBomberRunner.run
|> ignore    

// console output:
// step 1 is invoked!!!
// step 2 is invoked!!!
```

</TabItem>

<TabItem value="C#">

```csharp
var step1 = Step.Create("step 1", async context =>
{        
    
    // you can define and execute any logic here,
    // for example: send http request, SQL query etc
    // NBomber will measure how much time it takes to execute your step

    await Task.Delay(TimeSpan.FromSeconds(1));

    context.Logger.Information("step 1 is invoked!!!");

    return Response.Ok();
});

var step2 = Step.Create("step 2", async context => 
{            
    await Task.Delay(TimeSpan.FromSeconds(1));

    context.Logger.Information("step 2 is invoked!!!")    

    return Response.Ok()
});

var scenario = ScenarioBuilder.CreateScenario("hello_world", step1, step2);
    
NBomberRunner
    .RegisterScenarios(scenario)
    .Run();   

// console output:
// step 1 is invoked!!!
// step 2 is invoked!!!
```

</TabItem>
</Tabs>

### Step ordering

Assume that we have one scenario and three steps: 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login   = Step.create("login", fun context -> ...)
let home    = Step.create("home_page", fun context -> ...)
let product = Step.create("product_page", fun context -> ...)

// here we defile steps order: login => home => product
let scenario = Scenario.create "scenario" [login; home; product]
```

</TabItem>

<TabItem value="C#">

```csharp
var login   = Step.Create("login", context => ...);
var home    = Step.Create("home_page", context => ...);
var product = Step.Create("product_page", context => ...);

// here we defile steps order: login => home => product
var scenario = ScenarioBuilder.CreateScenario("scenario", login, home, product);
```

</TabItem>
</Tabs>

Let's assume that after some time you decided to create a new scenario with a bit different order. You decided to have the following order: login => product => home:

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login   = Step.create("login", fun () -> ...)
let home    = Step.create("home_page", fun () -> ...)
let product = Step.create("product_page", fun () -> ...)

let scenario1 = Scenario.create "scenario_1" [login; home; product]
let scenario2 = Scenario.create "scenario_2" [login; product; home]
```

</TabItem>

<TabItem value="C#">

```csharp
var login   = Step.Create("login", context => ...);
var home    = Step.Create("home_page", context => ...);
var product = Step.Create("product_page", context => ...);

var scenario1 = ScenarioBuilder.CreateScenario("scenario_1", login, home, product);
var scenario2 = ScenarioBuilder.CreateScenario("scenario_2", login, product, home);
```

</TabItem>
</Tabs>

With such flexibility you can configure any user flow as you want.

:::note
By default all steps within one scenario execute sequentially. You can change step order in runtime via using Scenario API: *Scenario.withCustomStepsOrder*
:::

### Step response

An important role in steps execution is playing the Response type. 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let okStep = Step.create("ok_step", fun context -> task {    
    return Response.ok() // here is ok response        
})

let failStep = Step.create("fail_step", fun context -> task {    
    return Response.fail() // here is fail response        
})
```

</TabItem>

<TabItem value="C#">

```csharp
var okStep = Step.Create("ok_step", async context =>
{    
    return Response.Ok() // here is ok response        
});

var failStep = Step.Create("fail_step", async context => 
{    
    return Response.Fail() // here is fail response        
});
```

</TabItem>
</Tabs>

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// here is the full type declaration
type Response = {
    StatusCode: Nullable<int>
    IsError: bool
    ErrorMessage: string
    SizeBytes: int
    LatencyMs: float
    Payload: obj
}

// the response can be constructed using optional parameters
// pay attention that you can enrich every response with:
//  - useful status codes (for example HTTP status code)
//  - transferred data size
Response.ok(payload = "payload", statusCode = 200, sizeBytes = 10)

Response.fail(error = "error msg", statusCode = 401, sizeBytes = 10)            
```

</TabItem>

<TabItem value="C#">

```csharp
// here is the full type declaration
public class Response
{
    public int? StatusCode { get; set; }
    public bool IsError { get; set; }
    public string ErrorMessage { get; set; }
    public int SizeBytes { get; set; }
    public float LatencyMs { get; set; }
    public object Payload { get; set; }
}

// the response can be constructed using optional parameters
// pay attention that you can enrich every response with:
//  - useful status codes (for example HTTP status code)
//  - transferred data size
Response.Ok(payload: "payload", statusCode: 200, sizeBytes: 10);

Response.Fail(error: "error msg", statusCode: 401, sizeBytes: 10);
```

</TabItem>
</Tabs>

The thing is that NBomber is execute steps by iterations and if you return Response.fail from any step - NBomber will stop the current iteration and starts a new one from step one.

Let's look at an example that demonstrates Response.fail behavior:

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login = Step.create("login", fun context -> task {    
    do! Task.Delay(seconds 1)
    context.Logger.Information("login is invoked!!!")
    return Response.ok()
})

let home = Step.create("home_page", fun context -> task {
    do! Task.Delay(seconds 1)
    context.Logger.Information("home_page is invoked!!!")
    
    // because we return a fail response
    // NBomber will stop the current iteration
    // and it will be restarted from the login step again
    return Response.fail()
})

// this step will not be invoked since 'home_page' step returns fail
// and it stops NBomber to execute this step
let logout = Step.create("logout", fun context -> task {
    do! Task.Delay(seconds 1)
    context.Logger.Information("logout is invoked!!!")
    return Response.ok()
})

let scenario = Scenario.create "scenario" [login; home; logout]

// console output:
// login is invoked!!!
// home_page is invoked!!!
// login is invoked!!!
// home_page is invoked!!!
```

</TabItem>

<TabItem value="C#">

```csharp
var login = Step.Create("login", async context => 
{    
    await Task.Delay(TimeSpan.FromSeconds(1));
    context.Logger.Information("login is invoked!!!");
    return Response.Ok();
});

var home = Step.Create("home_page", async context =>
    await Task.Delay(TimeSpan.FromSeconds(1));
    context.Logger.Information("home_page is invoked!!!");
    
    // because we return a fail response
    // NBomber will stop the current iteration
    // and it will be restarted from the login step again
    return Response.Fail();
});

// this step will not be invoked since 'home_page' step returns fail
// and it stops NBomber to execute this step
var logout = Step.Create("logout", async context =>
    await Task.Delay(TimeSpan.FromSeconds(1));
    context.Logger.Information("logout is invoked!!!");
    return Response.Ok();
});

var scenario = ScenarioBuilder.CreateScenario("scenario", login, home, logout);

// console output:
// login is invoked!!!
// home_page is invoked!!!
// login is invoked!!!
// home_page is invoked!!!
```

</TabItem>
</Tabs>

Another important thing about the Response type is how it can be used to pass data between steps. There could be numerous cases where you need to pass response data from one step to another, for example: after user sucessfuly login and you got authorization token you want to pass this token to the following step to make some job. Let see how you can do this.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login = Step.create("login", fun context -> task {    
    do! Task.Delay(seconds 1)    
    
    let token = "JWT token"    
    
    // the response payload will be passed to the next step as input argument
    return Response.ok(token) 
})

let home = Step.create("home_page", fun context -> task {
    do! Task.Delay(seconds 1)

    // here we get the previous step's response
    let token = context.GetPreviousStepResponse<string>()
    context.Logger.Information($"login step's response is '{token}'")    
    
    return Response.ok()
})

let scenario = Scenario.create "scenario" [login; home]

// console output:
// login step's response is 'JWT token'
```

</TabItem>

<TabItem value="C#">

```csharp
var login = Step.Create("login", async context =>
{    
    await Task.Delay(TimeSpan.FromSeconds(1));
    
    var token = "JWT token";
    
    // the response payload will be passed to the next step as input argument
    return Response.Ok(token); 
});

var home = Step.Create("home_page", async context =>
{
    await Task.Delay(TimeSpan.FromSeconds(1));

    // here we get the previous step's response
    var token = context.GetPreviousStepResponse<string>();
    context.Logger.Information($"login step's response is '{token}'");    
    
    return Response.Ok();
});

var scenario = ScenarioBuilder.CreateScenario("scenario", login, home);

// console output:
// login step's response is 'JWT token'
```

</TabItem>
</Tabs>

Also for more advanced cases, you can share data between steps using context.Data property that giving you Dictionary<string,obj>.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login = Step.create("login", fun context -> task {    
    do! Task.Delay(seconds 1)        
    
    context.Data.["token"] <- "JWT token"
    
    return Response.ok() 
})

let home = Step.create("home_page", fun context -> task {
    do! Task.Delay(seconds 1)

    // here we get the previous step's response
    let token = context.Data.["token"]
    context.Logger.Information($"login step's response is '{token}'")    
    
    return Response.ok()
})

let scenario = Scenario.create "scenario" [login; home]

// console output:
// login step's response is 'JWT token'
```

</TabItem>

<TabItem value="C#">

```csharp
ar login = Step.Create("login", async context =>
{    
    await Task.Delay(TimeSpan.FromSeconds(1));    
    
    context.Data["token"] = "JWT token";    
    
    return Response.Ok(); 
});

var home = Step.Create("home_page", async context =>
{
    await Task.Delay(TimeSpan.FromSeconds(1));

    // here we get the previous step's response
    var token = context.Data["token"];
    context.Logger.Information($"login step's response is '{token}'");    
    
    return Response.Ok();
});

var scenario = ScenarioBuilder.CreateScenario("scenario", login, home);

// console output:
// login step's response is 'JWT token'
```

</TabItem>
</Tabs>

### Step pause

If for some cases you want to simulate pause you should use these functions:

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login = Step.create("login", fun context -> ...)
let home  = Step.create("home_page", fun context -> ...)

let pause = Step.createPause(minutes 1)
//let pause = Step.createPause(seconds 10)
//let pause = Step.createPause(milliseconds 200)
//let pause = Step.createPause(fun () -> seconds config.PauseValue)

let scenario = Scenario.create "scenario" [login; pause; home]
```

</TabItem>

<TabItem value="C#">

```csharp
var login = Step.Create("login", context => ...);
var home  = Step.Create("home_page", context => ...);

var pause = Step.CreatePause(TimeSpan.FromMinutes(1));
//var pause = Step.CreatePause(TimeSpan.FromSeconds(10));
//var pause = Step.CreatePause(TimeSpan.FromMilliseconds(200));
//var pause = Step.CreatePause(fun () -> TimeSpan.FromSeconds(config.PauseValue));

var scenario = ScenarioBuilder.CreateScenario("scenario", login, pause, home);
```

</TabItem>
</Tabs>

### Step timeout

The time allotted for the step execution. In case of timeout is reached step will be failed with `TimeoutStatusCode (-100)` error code and execution flow will jump to the next scenario iteration. By default, NBomber uses 1 second as a step's timeout. You can change it if you want.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let login = Step.create("login", 
                        timeout = milliseconds 200, 
                        execute = fun (context) -> task {
    return Response.ok()                            
})
```

</TabItem>

<TabItem value="C#">

```csharp
var login = Step.Create("login", 
                        timeout: TimeSpan.FromMilliseconds(200), 
                        execute: async context => 
{
    return Response.Ok();                            
});
```

</TabItem>
</Tabs>

### Step context

Step context represents the execution context of the current step. It provides useful functionality that can be used to inject test data, logging capabilities, integration with API clients. 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let step = Step.create("step", fun context -> task {    
    // gives access to the logger
    context.Logger            
    
    // gets the current scenario thread id
    // you can use it as correlation id
    context.ScenarioInfo.ThreadId
    context.ScenarioInfo.ThreadNumber
    context.ScenarioInfo.ScenarioName
    
    // invocation number of the current step 
    // (will be incremented on each invocation)
    context.InvocationCount                                
    
    // cancellation token is a standard .NET mechanics
    // for canceling long-running operations
    context.CancellationToken                                 

    // it's a Dictionary<string,object> that you can use
    // for sharing your custom data between steps (within one scenario)
    context.Data     

    // feed item taken from the attached DataFeed.
    // (in the next section we will read about DataFeed)
    context.FeedItem                                

    // client (or API client) which is taken from the client pool
    // (in the next section we will read about ClientFactory)
    context.Client                                            

    // returns response from previous step
    context.GetPreviousStepResponse<'T>()       
    
    // stops scenario by scenario name
    context.StopScenario(scenarioName, reason) 

    // stops all running scenarios
    context.StopCurrentTest(reason) 
})
```

</TabItem>

<TabItem value="C#">

```csharp
var step = Step.Create("step", async context => 
{    
    // gives access to the logger
    context.Logger            
    
    // gets the current scenario thread id
    // you can use it as correlation id
    context.ScenarioInfo.ThreadId
    context.ScenarioInfo.ThreadNumber
    context.ScenarioInfo.ScenarioName
    
    // invocation number of the current step 
    // (will be incremented on each invocation)
    context.InvocationCount                                
    
    // cancellation token is a standard .NET mechanics
    // for canceling long-running operations
    context.CancellationToken                                 

    // it's a Dictionary<string,object> that you can use
    // for sharing your custom data between steps (within one scenario)
    context.Data     

    // feed item taken from the attached DataFeed.
    // (in the next section we will read about DataFeed)
    context.FeedItem                                

    // client (or API client) which is taken from the client pool
    // (in the next section we will read about ClientFactory)
    context.Client                                            

    // returns response from previous step
    context.GetPreviousStepResponse<'T>()       
    
    // stops scenario by scenario name
    context.StopScenario(scenarioName, reason) 

    // stops all running scenarios
    context.StopCurrentTest(reason) 
});
```

</TabItem>
</Tabs>

## DataFeed

DataFeed helps inject test data into your load test. It represents a data source. Let see how you can inject test data in your test and use Step.context to integrate it within your steps.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// here we create test data
let data = [1; 2; 3; 4; 5]
// and create your first data feed
let dataFeed = Feed.createCircular "numbers" data

// now we need to inject dataFeed as an argument into the step
// and after this context.FeedItem will return a number from the data list
let step = Step.create("step", feed = dataFeed, execute = fun context -> task {
    
    do! Task.Delay(seconds 1)

    context.Logger.Information($"data feed item is: '{context.FeedItem}'")
    
    return Response.ok()
})

let scenario = Scenario.create "scenario" [step]

// console output:
// data feed item is: '1'
// data feed item is: '2'
// data feed item is: '3'
```

</TabItem>

<TabItem value="C#">

```csharp
// here we create test data
var data = new[] {1, 2, 3, 4, 5};
// and create your first data feed
var dataFeed = Feed.CreateCircular("numbers", data);

// now we need to inject dataFeed as an argument into the step
// and after this context.FeedItem will return a number from the data list
var step = Step.Create("step", feed: dataFeed, execute: async context => 
{    
    await Task.Delay(TimeSpan.FromSeconds(1));

    context.Logger.Information($"data feed item is: '{context.FeedItem}'");
    
    return Response.Ok();
})

var scenario = ScenarioBuilder.CreateScenario("scenario", step);

// console output:
// data feed item is: '1'
// data feed item is: '2'
// data feed item is: '3'
```

</TabItem>
</Tabs>

Ok, now we ready to consider a bit more complex example with using JSON as a source of data. Consider that we have a JSON with the user's data and we want to inject this data into the step.

```json title="users-feed-data.json"
[
    {
        "UserName": "Test User 1",
        "Password": "Test User 1"
    },
    {
        "UserName": "Test User 2",
        "Password": "Test User 2"
    }
]
```

In order to inject it, we first need to be able to parse user's data via JSON. For this, we will define the UserData type and then will use Feed API to parse JSON.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// here we define user data record.
[<CLIMutable>]
type UserData = {    
    UserName: string
    Password: string
}

// now let's parse JSON file with data and create a feed.
let data = FeedData.fromJson<User>("./users-feed-data.json")
let dataFeed = data |> Feed.createCircular "users"

// now we need to inject dataFeed as an argument into the step
// and after this context.FeedItem will return instance of UserData
let step = Step.create("step", feed = dataFeed, execute = fun context -> task {
    
    do! Task.Delay(seconds 1)

    context.Logger.Information($"user name is: '{context.FeedItem.UserName}'")
    
    return Response.ok()
})

let scenario = Scenario.create "scenario" [step]

// console output:
// user name is: 'Test User 1'
// user name is: 'Test User 2'
```

</TabItem>

<TabItem value="C#">

```csharp
// here we define user data record.
public class UserData
{   
    public int UserName { get; set; }
    public string Password { get; set; }
}

// now let's parse JSON file with data and create a feed.
var data = FeedData.FromJson<User>("./users-feed-data.json");
var dataFeed = Feed.CreateCircular("users", data);

// now we need to inject dataFeed as an argument into the step
// and after this context.FeedItem will return instance of UserData
var step = Step.Create("step", feed: dataFeed, execute: async context => 
{    
    await Task.Delay(TimeSpan.FromSeconds(1));

    context.Logger.Information($"user name is: '{context.FeedItem.UserName}'");
    
    return Response.Ok();
})

var scenario = ScenarioBuilder.CreateScenario("scenario", step);

// console output:
// user name is: 'Test User 1'
// user name is: 'Test User 2'
```

</TabItem>
</Tabs>

## ClientFactory

ClientFactory helps create and initialize API clients to work with specific API or protocol (HTTP, WebSockets, gRPC, GraphQL). So far we have seen examples without real interaction. Let's now try to create a load test for HTTP API. In order to work with HTTP, we need to create HttpClient and this is the main reason why ClientFactory exists.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// here we create a HTTP factory that will create one HttpClient
// initClient function will be invoked under the hood to create HttpClient
let httpFactory =
    ClientFactory.create(name = "http_factory",                         
                         clientCount = 1,
                         initClient = fun (number,context) -> task { 
                             return new HttpClient() 
                         })

// here we create a step and inject httpFactory 
// and after this context.Client will return instance of HttpClient
let step = Step.create("fetch_html_page", 
                       clientFactory = httpFactory,
                       execute = fun context -> task {

    // here we get the HttpClient instance via context.Client 
    // and use it to send HTTP GET request
    let! response = context.Client.GetAsync("https://nbomber.com", 
                                            context.CancellationToken)

    return if response.IsSuccessStatusCode then 
               Response.ok(statusCode = int response.StatusCode)
           else 
               Response.fail(statusCode = int response.StatusCode)
})

let scenario = Scenario.create "scenario" [step]
```

</TabItem>

<TabItem value="C#">

```csharp
// here we create a HTTP factory that will create one HttpClient
// initClient function will be invoked under the hood to create HttpClient
var httpFactory = ClientFactory.Create(
    name: "http_factory",                         
    clientCount: 1,
    initClient: (number,context) => Task.FromResult(new HttpClient())
);

// here we create a step and inject httpFactory 
// and after this context.Client will return instance of HttpClient
var step = Step.Create("fetch_html_page", 
                       clientFactory: httpFactory,
                       execute: async context =>
{
    // here we get the HttpClient instance via context.Client 
    // and use it to send HTTP GET request
    var response = await context.Client.GetAsync("https://nbomber.com",
                                                 context.CancellationToken);

    return response.IsSuccessStatusCode
        ? Response.Ok(statusCode: (int) response.StatusCode)
        : Response.Fail(statusCode: (int) response.StatusCode);
});

var scenario = ScenarioBuilder.CreateScenario("scenario", step);
```

</TabItem>
</Tabs>

Basically, you should use ClientFactory for any interaction where you need to have an API client: WebSocketClient, RedisClient, SqlClient, HttpClient, etc.

In order to better understand the full scope let's create an example where we will fetch user data from fake HTTP API service: https://jsonplaceholder.typicode.com

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
[<CLIMutable>]
type UserData = {    
    Id: int
    Name: string
    Email: string
    Phone: string
}

// this data feed represents user's id
let usersIdFeed = [1; 2; 3; 4; 5] |> Feed.createCircular "numbers"

let httpFactory =
    ClientFactory.create(name = "http_factory",                         
                         clientCount = 1,
                         initClient = fun (number,context) -> task { 
                             return new HttpClient() 
                         })

let step = Step.create("http_step", 
                       feed = usersIdFeed,
                       clientFactory = httpFactory,
                       execute = fun context -> task {
    
    let userId = context.FeedItem
    let url = $"https://jsonplaceholder.typicode.com/users?id={userId}"
    
    let! response = context.Client.GetAsync(url, context.CancellationToken)
    let json = response.Content.ReadAsStringAsync().Result    
    let users = JsonConvert.DeserializeObject<UserData[]>(json)
    
    return if users.[0].Id = userId then Response.ok()
           else Response.fail()
})

let scenario = Scenario.create "scenario" [step]
```

</TabItem>

<TabItem value="C#">

```csharp
public class UserData
{    
    public int Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public string Phone { get; set; }    
}

// this data feed represents user's id
var usersIdFeed = Feed.CreateCircular("numbers", new[] {1, 2, 3, 4, 5});

var httpFactory = ClientFactory.Create(
    name: "http_factory",                         
    clientCount: 1,
    initClient: (number,context) => Task.FromResult(new HttpClient())
);

var step = Step.Create("http_step", 
                       feed: usersIdFeed,
                       clientFactory: httpFactory,
                       execute: async context => 
{    
    var userId = context.FeedItem;
    var url = $"https://jsonplaceholder.typicode.com/users?id={userId}";
    
    var response = await context.Client.GetAsync(url, context.CancellationToken);
    var json = response.Content.ReadAsStringAsync().Result;
    var users = JsonConvert.DeserializeObject<UserData[]>(json);
    
    return users[0].Id == userId 
        ? Response.Ok()
        : Response.Fail();
})

var scenario = ScenarioBuilder.CreateScenario("scenario", step);
```

</TabItem>
</Tabs>

## Scenario

Scenario is basically a workflow that virtual users will follow. It helps you organize steps into user actions.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
let scenario = Scenario.create "scenario" [step1; step2; step3; step4]
```

</TabItem>

<TabItem value="C#">

```csharp
var scenario = ScenarioBuilder.CreateScenario("scenario", step1, step2, step3, step4);
```

</TabItem>
</Tabs>

NBomber allows you to define as many scenarios as you need to cover all user interaction flows. 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// here you see an example where we defined 
// and registered a few scenarios and after that run them.

let scn1 = Scenario.create "scenario_1" [step1; step2; step3]  // 1 user flow
let scn2 = Scenario.create "scenario_2" [login; home; product] // 2 user flow
let scn3 = Scenario.create "scenario_3" [login; logout]        // 3 user flow

NBomberRunner.registerScenarios [scn1; scn2; scn3]
|> NBomberRunner.run
|> ignore    
```

</TabItem>

<TabItem value="C#">

```csharp
// here you see an example where we defined 
// and registered a few scenarios and after that run them.

var scn1 = ScenarioBuilder.CreateScenario("scenario_1", step1, step2, step3);  // 1 user flow
var scn2 = ScenarioBuilder.CreateScenario("scenario_2", login, home, product); // 2 user flow
var scn3 = ScenarioBuilder.CreateScenario("scenario_3", login, logout);        // 3 user flow

NBomberRunner
    .RegisterScenarios(scn1, scn2, scn3)
    .Run();
```

</TabItem>
</Tabs>

### Concurrency

Another important thing about Scenario - it allows you to implement concurrency (simulate concurrent virtual users).

:::note
Scenarios are always running in parallel (it's opposite to steps that run sequentially). You should think about Scenario as a system thread. Technically speaking Scenario represents a lightweight thread (*Task<'T>*) and NBomber allows to create many copies of such scenario to simulate concurrent execution (simulate concurrent virtual users).
:::

In order to implement concurrency, you should use what we call - load simulations. Here is an example of specifying load simulations strategy:

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
Scenario.create "scenario" [step]
|> Scenario.withLoadSimulations [    
    // here you can define a list of necessary simulations

    // will create a 5 copies (threads) of the current scenario 
    // and run them concurrently for 10 sec    
    // here every single copy will iterate while the specified duration
    KeepConstant(copies = 5, during = seconds 10) 

    // will inject 10 new copies (threads) per 1 sec
    // the copies will be injected at regular intervals
    // here every single copy will run only once
    InjectPerSec(rate = 10, during = seconds 30)

    // will inject a random number of scenario copies (threads) per 1 sec
    // the copies will be injected at regular intervals
    // here every single copy will run only once
    InjectPerSecRandom(minRate = 5, maxRate = 50, during = minute 2)
]
```

</TabItem>

<TabItem value="C#">

```csharp
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithLoadSimulations(new[] {    
    // here you can define a list of necessary simulations

    // will create a 5 copies (threads) of the current scenario 
    // and run them concurrently for 10 sec    
    // here every single copy will iterate while the specified duration
    Simulation.KeepConstant(copies: 5, during: TimeSpan.FromSeconds(10)), 

    // will inject 10 new copies (threads) per 1 sec
    // the copies will be injected at regular intervals
    // here every single copy will run only once
    Simulation.InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30)),

    // will inject a random number of scenario copies (threads) per 1 sec
    // the copies will be injected at regular intervals
    // here every single copy will run only once
    Simulation.InjectPerSecRandom(minRate: 5, maxRate: 50, during: TimeSpan.FromMinutes(2))
});
```

</TabItem>
</Tabs>

:::note
NBomber is always running simulations in sequential order that you defined them. All defined simulations are represent the whole Scenario duration.
:::

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
KeepConstant(copies = 5, during = seconds 10) // 1: from 00:00:00 - 00:00:10
InjectPerSec(rate = 10, during = seconds 30)  // 2: from 00:00:10 - 00:00:40
InjectPerSecRandom(5, 50, during = minute 2)  // 3: from 00:00:40 - 00:02:40

// all these simulations represents the whole Scenario duration.
// duration = KeepConstant + InjectPerSec + InjectPerSecRandom
// duration = 10 sec + 30 sec + 2 min
// duration = 00:02:40
```

</TabItem>

<TabItem value="C#">

```csharp
KeepConstant(copies: 5, during: TimeSpan.FromSeconds(10)) // 1: from 00:00:00 - 00:00:10
InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30))  // 2: from 00:00:10 - 00:00:40
InjectPerSecRandom(5, 50, during: TimeSpan.FromMinutes(2))  // 3: from 00:00:40 - 00:02:40

// all these simulations represents the whole Scenario duration.
// duration = KeepConstant + InjectPerSec + InjectPerSecRandom
// duration = 10 sec + 30 sec + 2 min
// duration = 00:02:40

```

</TabItem>
</Tabs>

### Load simulations intro

When it comes to load simulation, systems behave in 2 different ways:
- Closed systems, where you keep a constant number of concurrent clients and they waiting on a response before sending a new request. A good example will be a database with 20 concurrent clients that constantly repeat sending query then wait for a response and do it again. Under the big load, requests will be queued and this queue will not grow since we have a finite number of clients. Usually, in real-world scenarios systems with persisted connections (RabbitMq, Kafka, WebSockets, Databases) are tested as closed systems.
- Open systems, where you keep arrival rate of new clients requests without waitng on responses. The good example could be some popular website like Amazon. Under the load new clients arrive even though applications have trouble serving them. Usually, in real-world scenarios systems that use stateless protocols like HTTP are tested as open systems.

:::note

Make sure to use the proper load model that matches the load of your system. You can mix open and closed model if your use case requires it.

:::

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
Scenario.create "scenario" [step]
|> Scenario.withLoadSimulations [ 
    // It's to model a closed system.
    // Injects a given number of scenario copies (threads) 
    // with a linear ramp over a given duration.
    // Every single scenario copy will iterate while the specified duration.
    // Use it for ramp up and rump down.
    RampConstant(copies = 10, during = seconds 30)

    // It's to model a closed system.    
    // A fixed number of scenario copies (threads) executes as many iterations
    // as possible for a specified amount of time.
    // Every single scenario copy will iterate while the specified duration.
    // Use it when you need to run a specific amount of scenario copies (threads)
    // for a certain amount of time.    
    KeepConstant(copies = 10, during = seconds 30)

    // It's to model an open system.
    // Injects a given number of scenario copies (threads) per 1 sec 
    // from the current rate to target rate during a given duration.     
    // Every single scenario copy will run only once.
    RampPerSec(rate = 10, during = seconds 30)

    // It's to model an open system.
    // Injects a given number of scenario copies (threads) per 1 sec
    // during a given duration. 
    // Every single scenario copy will run only once.
    // Use it when you want to maintain a constant rate of requests 
    // without being affected by the performance of the system under test.
    InjectPerSec(rate = 10, during = seconds 30)
    
    // It's to model an open system.
    // Injects a random number of scenario copies (threads) per 1 sec 
    // defined in scenarios per second during a given duration.
    // Every single scenario copy will run only once.
    // Use it when you want to maintain a random rate of requests
    // without being affected by the performance of the system under test.
    InjectPerSecRandom(minRate = 10, maxRate = 50, during = seconds 30)
]
```

</TabItem>

<TabItem value="C#">

```csharp
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithLoadSimulations(new[] { 
    // It's to model a closed system.
    // Injects a given number of scenario copies (threads) 
    // with a linear ramp over a given duration.
    // Every single scenario copy will iterate while the specified duration.
    // Use it for ramp up and rump down.
    RampConstant(copies: 10, during: TimeSpan.FromSeconds(30)),

    // It's to model a closed system.    
    // A fixed number of scenario copies (threads) executes as many iterations
    // as possible for a specified amount of time.
    // Every single scenario copy will iterate while the specified duration.
    // Use it when you need to run a specific amount of scenario copies (threads)
    // for a certain amount of time.        
    KeepConstant(copies: 5, during: TimeSpan.FromSeconds(10)),

    // It's to model an open system.
    // Injects a given number of scenario copies (threads) per 1 sec 
    // from the current rate to target rate during a given duration.     
    // Every single scenario copy will run only once.
    RampPerSec(rate: 10, during: TimeSpan.FromSeconds(30)),

    // It's to model an open system.
    // Injects a given number of scenario copies (threads) per 1 sec
    // during a given duration. 
    // Every single scenario copy will run only once.
    // Use it when you want to maintain a constant rate of requests 
    // without being affected by the performance of the system under test.
    InjectPerSec(rate: 10, during: TimeSpan.FromSeconds(30)),
    
    // It's to model an open system.
    // Injects a random number of scenario copies (threads) per 1 sec 
    // defined in scenarios per second during a given duration.
    // Every single scenario copy will run only once.
    // Use it when you want to maintain a random rate of requests
    // without being affected by the performance of the system under test.
    InjectPerSecRandom(minRate: 10, maxRate: 50, during: TimeSpan.FromSeconds(30))
})
```

</TabItem>
</Tabs>

### Scenario init

Initializes scenario. You can use it to for example to prepare your target system.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
Scenario.create "scenario" [step]
|> Scenario.withInit(fun context -> task {
    do! populateMongoDb()
    do! populateKafka()
})
```

</TabItem>

<TabItem value="C#">

```csharp
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithInit(async context => 
    {
        await PopulateMongoDb();
        await PopulateKafka();
    });
```

</TabItem>
</Tabs>

### Scenario clean

Cleans scenario's resources.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
Scenario.create "scenario" [step]
|> Scenario.withClean(fun context -> task {
    do! cleanMongoDb()
})
```

</TabItem>

<TabItem value="C#">

```csharp
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithClean(async context => 
    {
        await CleanMongoDb();
    });
```

</TabItem>
</Tabs>

### Scenario warm-up

Use warm-up for warming up NBomber itself and target system. Warm-up will simply start a scenario with a specified duration. In the case of warm-up, NBomber will take a load simulation that matches warm-up duration.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// use it to run scenario with warm-up
Scenario.create "scenario" [step]
|> Scenario.withWarmUpDuration(seconds 30)

// use it to run scenario without warm-up
Scenario.create "scenario" [step]
|> Scenario.withoutWarmUp
```

</TabItem>

<TabItem value="C#">

```csharp
// use it to run scenario with warm-up
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithWarmUpDuration(TimeSpan.FromSeconds(30));

// use it to run scenario without warm-up
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithoutWarmUp();
```

</TabItem>
</Tabs>

### Scenario context

Scenario context represents the execution context of the current scenario. It's available on the init and clean scenario phase.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
Scenario.create "scenario" [step]
|> Scenario.withInit(fun context -> task {
    // gives access to the logger
    context.Logger

    // cancellation token is a standard .NET mechanics
    // for canceling long-running operations
    context.CancellationToken

    // gets current node info
    context.NodeInfo

    // gets current test info
    context.TestInfo

    // gets custom client settings content from the configuration file
    context.CustomSettings
})
```

</TabItem>

<TabItem value="C#">

```csharp
ScenarioBuilder
    .CreateScenario("scenario", step)
    .WithInit(async context => 
    {
        // gives access to the logger
        context.Logger

        // cancellation token is a standard .NET mechanics
        // for canceling long-running operations
        context.CancellationToken

        // gets current node info
        context.NodeInfo

        // gets current test info
        context.TestInfo

        // gets custom client settings content from the configuration file
        context.CustomSettings
    });
```

</TabItem>
</Tabs>

### Scenario configuration

You can read more about configuration on this [page](configuration)

## NBomberRunner

NBomberRunner is responsible for registering and running scenarios under [Test Suite](https://en.wikipedia.org/wiki/Test_suite). Also it provides configuration points related to infrastructure, reporting, loading plugins. 

### Test suite

The hierarchy of any NBomber load test has the following structure:

```json
// it's pseudocode
test_suite
 - test_suite_name: "test_suite_name"
 - test_name: "test_name"
 - scenarios: [scenario_1, scneario_2, scneario_3]
```

NBomberRunner provides the ability to configure your test suite:

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// registers scenarios in NBomber environment. 
// scenarios will be run in parallel.
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]

// default value is: nbomber_default_test_suite_name.
|> NBomberRunner.withTestSuite "databases"

// default value is: "nbomber_report_{current-date}".
|> NBomberRunner.withTestName "mongo_db"
|> NBomberRunner.run
|> ignore
```

</TabItem>

<TabItem value="C#">

```csharp
// registers scenarios in NBomber environment. 
// scenarios will be run in parallel.
NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)

    // default value is: nbomber_default_test_suite_name.
    .WithTestSuite("databases")

    // default value is: "nbomber_report_{current-date}".
    .WithTestName("mongo_db")
    .Run();
```

</TabItem>
</Tabs>

### Report formats

NBomberRunner supports popular report formats that you can use as outcome: [text, csv, html, md]. 

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]
// default name: nbomber_report
|> NBomberRunner.withReportFileName "my_report_name"

// default folder path: "./reports".
|> NBomberRunner.withReportFolder "my_report_name"
|> NBomberRunner.withReportFormats [
    ReportFormat.Txt; ReportFormat.Csv; ReportFormat.Html; ReportFormat.Md
]

//|> NBomberRunner.withoutReports - use it when you don't need a report file

|> NBomberRunner.run
|> ignore
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)
    // default name: nbomber_report
    .WithReportFileName("my_report_name")

    // default folder path: "./reports".
    .WithReportFolder("my_report_name")
    .WithReportFormats(ReportFormat.Txt, ReportFormat.Csv, ReportFormat.Html, ReportFormat.Md)

    //.WithoutReports() - use it when you don't need a report file

    .Run();
```

</TabItem>
</Tabs>

### Realtime reporting

NBomber supports real-time reporting and you can plug it into your test.

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
// create config for InfluxDB reporting sink
let influxDbConfig = InfluxDbSinkConfig.Create(
    url = "http://localhost:8086", dbName = "default"
)
// create InfluxDB reporting sink
use influxDb = new InfluxDBSink(influxDbConfig)

NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]

// reporting sink is used to save real-time metrics to correspond database
|> NBomberRunner.withReportingSinks [influxDb]

// default value: 10 seconds, min value: 5 sec
|> NBomberRunner.withReportingInterval(seconds 10)

|> NBomberRunner.run
|> ignore
```

</TabItem>

<TabItem value="C#">

```csharp
// create config for InfluxDB reporting sink
var influxDbConfig = InfluxDbSinkConfig.Create(
    url: "http://localhost:8086", dbName: "default"
);

// create InfluxDB reporting sink
using var influxDb = new InfluxDBSink(influxDbConfig);

NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)

    // reporting sink is used to save real-time metrics to correspond database
    .WithReportingSinks(influxDb)

    // default value: 10 seconds, min value: 5 sec
    .WithReportingInterval(TimeSpan.FromSeconds(10))
    .Run();
```

</TabItem>
</Tabs>

You can read more about realtime reporting on this [page](reporting-overview)

### Load configuration file

<Tabs
  groupId="example"
  defaultValue="F#"
  values={[
    {label: 'F#', value: 'F#'},
    {label: 'C#', value: 'C#'},
  ]
}>
<TabItem value="F#">

```fsharp
NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]
// loads test configuration
|> NBomberRunner.loadConfig "config.json"
    
// loads infrastructure configuration
|> NBomberRunner.loadInfraConfig "infra-config.json"
```

Instead of a hardcode file path you can use CLI arguments:

```fsharp
[<EntryPoint>]
let main argv =

    // The following CLI commands are supported:
    // -c or --config: loads configuration,
    // -i or --infra: loads infrastructure configuration.
    
    NBomberRunner.registerScenarios [scenario1; scenario2; scenario3]
    |> NBomberRunner.runWithArgs argv
    //|> NBomberRunner.runWithArgs ["--config=config.json --infra=infra_config.json"]
```

</TabItem>

<TabItem value="C#">

```csharp
NBomberRunner
    .RegisterScenarios(scenario1, scenario2, scenario3)
    // loads test configuration
    .LoadConfig("config.json")
    
    // loads infrastructure configuration
    .LoadInfraConfig("infra-config.json");
```

Instead of a hardcode file path you can use CLI arguments:

```csharp
class Program
{
    static void Main(string[] args)
    {
        // The following CLI commands are supported:
        // -c or --config: loads configuration,
        // -i or --infra: loads infrastructure configuration.
    
        NBomberRunner
            .RegisterScenarios(scenario1, scenario2, scenario3)
            .Run(args);
            //.Run("--config=config.json --infra=infra_config.json")
    }
}
```

</TabItem>
</Tabs>

You can read more about dynamic configuration on this [page](configuration)