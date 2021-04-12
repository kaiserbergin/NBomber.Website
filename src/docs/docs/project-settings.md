---
id: project-settings
title: .NET Project settings
---

In order to get maximum from NBomber you should edit your project settings using the following configurations:

## .NET runtime version
If you don't have any dependencies on the old .NET 4.6 framework we recommend you use at least .NET Core 3.1.

```xml
<TargetFramework>netcoreapp3.1</TargetFramework>
```

## GarbageCollection settings 

GarbageCollection should be switched to the server and concurrent mode:

```xml
<ServerGarbageCollection>true</ServerGarbageCollection>
<ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
```

The full project config:

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>netcoreapp3.1</TargetFramework>
        <ServerGarbageCollection>true</ServerGarbageCollection>
        <ConcurrentGarbageCollection>true</ConcurrentGarbageCollection>
    </PropertyGroup>

</Project>
```