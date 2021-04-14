---
id: nbomber-2-0
title: NBomber 2.0
author: Anton Moldovan (@AntyaDev)
author_title: NBomber Core Team
author_url: https://github.com/AntyaDev
author_image_url: https://avatars.githubusercontent.com/u/1080518
tags: [nbomber-release, load-testing]
---

Hey folks we were busy for almost half of the year working on a new big release of NBomber. I am so happy to announce that we finally completed! Before we start I'd like to inform you that you can help our project to grow and keep going via donations. So let's start with updates:

- [Statistics improvements](#statistics-improvements)

## UI/UX improvements
console reporting
html reporting

## Step API
status code
thread starvation
step invocation count
correlationID vs context.ScenarioInfo

## Scenario API
Added init only scenario
LoadSimulation.InjectPerSecRandom

## ConnectionPool
We replaced connection pool abstratcion on ClientFactory.

## NBomber execution engine
FsToolkit.ErrorHandling

## Hint analyzer

## Logs
log file location within report folder

## Statistics improvements
We refactored our statistics module to fix the issue with memory footprint for long-running tests. Теперь можно запускать тесты которые будут работать годами и не расти по памяти. Это достигается по сути за счет одной важной оптимизаци: все результаты живут в памяти но раскладываются по блокам с одинаковыми или очень близкими по значению числами, а дальше у каждого такого блока есть свой счетчик который monotonic growing. За счет этого и происходит эффективное сжатие. Также такого рода оптимизации очень часто используются в time-serious databases где на одну точку во времени может прилететь много однотипных метрик. 

## Ok and Fail stats
Важным дополнением к статистике стало треканье fail ответов. Теперь вы можете свободно видеть статистику errors, latency, RPS и тд. мы также отображаем fail stats (если они присутствуют) во всех репортах.

## HTTP improvements

## InfluxDB improvements
display LoadSimulation