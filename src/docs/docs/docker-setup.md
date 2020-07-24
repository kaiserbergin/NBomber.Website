---
id: docker-setup
title: Docker setup
---

:::note
Installation prerequisites

- [Docker Compose](https://docs.docker.com/compose/install/)
:::

## Infrastracture setup

Here you find the docker-compose file to setup basic infrastracture for logging and realtime metrics. Just save it in your project folder and run.

```code
// to start, use:
docker-compose up -d

// to stop, use:
docker-compose down
```

```yaml title="docker-compose.yaml"
version: '3.4'
services:
  
  influxdb:
    image: "influxdb:1.5.4"
    environment:
      INFLUXDB_DB: "\"default\""
    ports:
      - "8086:8086"

  grafana:
    image: "grafana/grafana:6.5.2"
    environment:
      - "GF_SERVER_ROOT_URL=http://grafana:6082"
    ports:
      - "3000:3000"
    depends_on:
      - "influxdb"  

  elasticsearch:
    image: "elasticsearch:6.8.6"
    ports:
      - "9200:9200"
      - "9300:9300"

  kibana:
    image: "kibana:6.8.6"
    ports:
      - "5601:5601"
```