---
title: Convert Your Integration Tests To Load Tests
author: Anton Moldovan (@AntyaDev)
author_title: NBomber Core Team
author_url: https://github.com/AntyaDev
author_image_url: https://avatars.githubusercontent.com/u/1080518
tags: [nbomber-http, load-testing]
---

In this article, I want to cover the topic of how you can effectively reuse your integration tests and convert them into load tests to speed up your load test adoption. 

> This article will be useful for developers who use the .NET platform to write integration tests that cover HTTP API, microservices.

## Load testing adoption

Nowadays, it is difficult to find a project that does not use integration tests, especially in building microservices or distributed systems, etc. In addition to this, some companies start adopting load testing and applying it as a must-have quality attribute. Honestly, load tests are still kind of exotic practice for most web projects, and usually, folks consider them a bit late. One of the main reasons is that the load tests require additional development and maintenance. It would be awesome to reduce time by converting our integration tests into load tests.

## Converting integration tests to load tests

Let's take a look at a simple integration test where a user tries to log in and buy a product. This test example is already a bit prepared for conversion to load test. 

```fsharp
[<Fact>]
let ``logged user should be able to by product`` () = async {

    let productId = "productId"
    let userName = "userName"
    let password = "password"
    
    use httpClient = new HttpClient()

    // Async<HttpResponseMessage>
    let! loginResponse = httpClient |> UserOperations.login userName password

    // string
    let jwtToken = loginResponse |> parseJwtToken |> Result.getOk

    // Async<HttpResponseMessage>
    let! paymentResponse = httpClient |> UserOperations.buyProduct productId jwtToken

    // Result<Payment,AppError>
    let paymentResult = paymentResponse |> parsePaymentResult

    test <@ Result.isOk paymentResult @>
}
```

To convert integration tests to load tests, we need to separate all business operations from test assertions into a separate module. After this, we can use the same business operation for load test and integration test. The main idea can be described as the following expression.

```
IntegrationTest = BusinessOperations + Assertions
LoadTest        = BusinessOperations + Assertions
```

### Business operations module

The business operations module represents such operations as login, buy products. 

```fsharp
module UserOperations

let login: string -> string -> HttpClient -> Async<HttpResponseMessage>

let buyProduct: string -> string -> HttpClient -> Async<HttpResponseMessage>
```

As you may have noticed, all these operations are contained in a single UserOperations module, and each of its functions returns a standard HttpResponseMessage. 

### NBomber response type

[HttpResponseMessage](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpresponsemessage?view=net-5.0) is a well-suported type in .NET and a key thing here is that [NBomber.Http](https://github.com/PragmaticFlow/NBomber.Http) contains a [helper function](https://github.com/PragmaticFlow/NBomber.Http/blob/dev/src/NBomber.Http/Api/FSharp.fs#L24) that converts HttpResponseMessage to NBomber's [Response](https://github.com/PragmaticFlow/NBomber/blob/dev/src/NBomber/Contracts/Contracts.fs#L17) type, and you can reuse such operations in your load tests. For C#, it works via [extension method](https://github.com/PragmaticFlow/NBomber.Http/blob/dev/src/NBomber.Http/Api/CSharp.fs#L44).

```fsharp
module Response

let ofHttp: HttpResponseMessage -> Response
```

### Load test

Now let's see the final example of converting an integration test into a load test.

```fsharp
[<Fact>]
let ``load test operation - buy a product`` () = 

    let productId = "productId"
    let userName = "userName"
    let password = "password"
    
    use httpClient = new HttpClient()

    let login = Step.create("login_step", fun context -> task {

        let! loginResponse = httpClient |> UserOperations.login userName password        
        return Response.ofHttp(loginResponse)
    })

    let buyProduct = Step.create("buy_product", fun context -> task {

        let loginResponse = context.GetPreviousStepResponse<HttpResponseMessage>()
        let jwtToken      = loginResponse |> parseJwtToken |> Result.getOk        
        
        let! paymentResponse = httpClient |> UserOperations.buyProduct productId jwtToken        
        
        return Response.ofHttp(paymentResponse)
    })

    Scenario.create "buy_product_scenario" [login; buyProduct]
    |> Scenario.withLoadSimulations [InjectPerSec(rate = 100, during = minutes 5)]
    |> NBomberRunner.registerScenario
    |> NBomberRunner.run
    |> ignore

    // here you can apply your assertions based on received stats
```

For a more realistic load test, you can leverage the power of the [DataFeed](https://nbomber.com/docs/general-concepts#datafeed) and the [ClientFactory](https://nbomber.com/docs/general-concepts#clientfactory). With these abstractions, you will be able to inject test data, configure your HttpClient, and so on.

## Conclusion

The ability to convert integration tests into load tests can significantly reduce your time and be crucial. Also, I don't want to seem like a salesperson to you, so I want to dispel myths right away: this technique cannot completely replace writing your own load tests since you definitely will have some particular cases that require writing more advanced scenarios. But even though if you can reduce half of your time, it really worth trying.