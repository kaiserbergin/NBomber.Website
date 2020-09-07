---
id: best-practices
title: Best practices
---

## .NET project settings

- .NET runtime version: if you don't have any dependencies on the old .NET 4.6 framework we recommend you use at least .NET Core 3.1.

```xml
<TargetFramework>netcoreapp3.1</TargetFramework>
```

- GC settings: based on the experience we find out that GC should be switched to the server and concurrent mode:

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

TBD