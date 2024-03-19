# Short-URL HTTP Service

## Introduction

This is a HTTP-based RESTful API written in Express, for managing Short URLs and redirecting clients similar to other service like bit.ly or goo.gl.

## Getting Started

Pre-requisites:

- docker compose (v2+)

Running development server:

```bash
$ cd ShortUrl-Service
$ docker compose up -d --build

Server starts on port :3000
```

Shuting Down development server:

```bash
$ docker compose down
```

## API

### Generate url

```bash
$ curl -X POST http://localhost:3000/generate -H "Content-Type: application/json" -d '{"url": "https://www.youtube.com/"}'

{"status":200,"data":{"longUrl":"https://www.youtube.com/","shortUrl":"http://localhost:3000/BBuwm8Fd"}}
```

### Redirect url

```bash
$ curl -X GET http://localhost:3000/ynSCqOLL

Found. Redirecting to https://www.youtube.com/
```

### Analytics

```bash
$ curl -X GET http://localhost:3000/analytics/ynSCqOLL

{"status":200,"data":{"oneday":{"count":4,"averageRequestTime":0.5},"oneWeek":{"count":4,"averageRequestTime":0.5},"allTime":{"count":4,"averageRequestTime":0.5}}}
```
NB: averageRequestTime is in ms.

### Get All url

```bash
$ curl -X GET http://localhost:3000/
               
{"status":200,"data":[{"shortUrl":"http://localhost:3000/ynSCqOLL","longUrl":"https://www.youtube.com/","analytics":{"oneday":{"count":4,"averageRequestTime":0.5},"oneWeek":{"count":4,"averageRequestTime":0.5},"allTime":{"count":4,"averageRequestTime":0.5}}},{"shortUrl":"http://localhost:3000/BBuwm8Fd","longUrl":"https://www.youtube.com/","analytics":{"oneday":{"count":0,"averageRequestTime":0},"oneWeek":{"count":0,"averageRequestTime":0},"allTime":{"count":0,"averageRequestTime":0}}}]}
```


# System Architecture


## System requirements

### Functional Requirement
- Generated Short Url should have one long url
- Short Url is Permanent, once created
- Short url is Unique; If a long url is added twice it should result in two different short urls
- Short Url is not easily discoverable; incrementing an already existing short url should have a low probability of finding a working short url
- Able to List the number of times a short url has been accessed in the last 24 hours, past week and all time

### Non-Functional Requirement
- Redirecting a short url to a long url within 10 ms
- Data must survive computer restarts
- HTTP-based RESTFUL API


## System Capacity Estimations

### Traffic Estimate

Assuming 50:1 read/write ratio

Short Url per month = 1 million

Number of short url links per seconds = 1 million /(30 days * 24 hours * 3600 seconds ) ~ 0.4 URLs/second

With 50:1 read/write ratio, number of redirections = 0.4 URLs/s * 50 = 20 URLs/s


### Storage Estimate

Assuming the service will last for 10 years and create 1 million shortened links each month, we'll have a total of 120 million data points (i.e 1 million/month * 10 (years) * 12 (months)) in the system.

With each data object being 500 bytes in size, the total storage needed would be around 55.91 GB.


## Short-Url Generator

### Encoding with base62
A base is a number of digits or characters that can be used to represent a particular number.

base 62 are [0–9][a-z][A-Z]

Number of possible short URLs using base62 and No of characters:

- 6 characters short URL: `62^6 = ~56.8 billion` possible URLs
- 7 characters short URL: `62^7 = ~3.52 trillion` possible URLs
- 8 characters short URL: `62^8 = ~218 trillion` possible URLs

Given the large range of possible urls, base 62 encoding was used in creating the short urls

## DataBase

Database Requierements: 

- High storage capabilities

- Read heavy based on our estimation.

- Easily scalable.

NoSql db was used in this implementation, since it fit our requirements and its easily scalable. 


## Cache
Given that we aim to redirect a short URL within 10ms or less, a caching mechanism has been implemented for frequently requested short URLs. The objective is to verify the URL's presence in the cache for a quicker response before accessing the database.
