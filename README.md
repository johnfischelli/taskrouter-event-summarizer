# taskrouter-event-summarizer

## Overview
This is a node application that listens to [Twilio's TaskRouter Callback Events](https://www.twilio.com/docs/taskrouter/api/events#event-callbacks) and summarizes the information inside the callback events and stores the data long-term inside a Postgres Database.

Secondarily, this application provides a framework for running cron-like tasks on a schedule so you can query this summarized information and push it to [Twilio Sync](https://www.twilio.com/sync). You can subscribe to Sync data inside [Twilio Flex](https://www.twilio.com/flex) to build near real-time dashboards.

Here is an example of what you could build using this application:

![Realtime Dashboard](https://indigo-bombay-5783.twil.io/assets/realtime-dashboard.png)

We can do really cool things, like calculate your contact center's capacity utilization on a given channel, or even calculate service level of your incoming tasks in real-time. Split them up by channel, calculate average response times, or simply tally up incoming tasks.

This application is intended to be a launching point, where you and your team will take its foundations and make it your own. Reveal whatever metric you like, as long as you can capture the data, you can show it!

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/johnfischelli/twilio-taskrouter-realtime-analytics/tree/master)

*Note: If you do deploy this application to Heroku, or some other production environment, don't forget to run your [database migrations](#run-the-database-migrations).*

### Built With
- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/)
- [Postgres](https://www.postgresql.org/) - long term storage for summarized information
- [Redis](https://redis.io/) - datastore for jobs to be processed
- [node-resque](https://github.com/taskrabbit/node-resque) - async jobs and scheduling
- [Sequelize](http://docs.sequelizejs.com/) - Promise Based ORM for Node.js
- Twilio :heart:

---

## Next Steps
- [Quick Start](#quick-start)
- [Make Commands](#make-commands)
- [Database Details](#database-details)
- [Proccessing Event Callbacks](#processing-event-callbacks)

---

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/install/) - If you're on a Mac, we recommend you install Docker Desktop for Mac.
- [ngrok](https://ngrok.com/) - This will help you expose your local development environment to the Twilio Taskrouter Event Callbacks.
- Xcode Command Line Tools
  - `$ xcode-select --install`

#### Setup The Envrionment

After cloning the repository:

`$ cp config/development.env.example config/development.env`

In your new `config/development.env` file, please enter the 5 following Twilio Account credentials.

```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TR_WORKSPACE_SID=
TWILIO_SYNC_SERVICE_SID=
TWILIO_CHAT_SERVICE_SID=
```
*Note: The `config/development.env.example` file is already configured for local docker development in terms of the database and redis connections. You just need to specify your Twilio account credentials.*

The `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` credentials can be retrieved from the [Twilio Console](https://www.twilio.com/console).

The `TR_WORKSPACE_SID` can be retrieved from the [TaskRouter section](https://www.twilio.com/console/taskrouter/workspaces) of the Twilio Console.

The `TWILIO_SYNC_SERVICE_SID` can be retrieved from the [Sync section](https://www.twilio.com/console/sync/services) of the Twilio Console.

The `TWILIO_CHAT_SERVICE_SID` can be retrieved from the [Programmable Chat section](https://www.twilio.com/console/chat/dashboard) of the Twilio Console.

#### Run The Application Locally

```
$ make buildrun
> [ lots of output ]
```
*Note: this application makes use of a Makefile to alias some common docker commands, use `$ make help` for more information or review the docs on the [Make Commands](#make-commands).*

Once the output finishes the application will be running in the background. You can use this [command to view logs](#viewing-application-logs) if you wish.

#### Run The Database Migrations

```
$ make bashapp
> [ you are now SSH'ed into the main application container running in docker ]
$ npx sequelize db:migrate
> [ output from sequelize cli, letting you know if migrations were run successfully ]
```
You may exit the SSH session after you've successfully run migrations.

#### Setup ngrok

Follow [ngrok's instructions](https://ngrok.com/download) about how to install and setup ngrok on your machine.

To expose this application to the public web:

`$ ngrok http 3000`. This will expose the 3000 port on your machine (by default where the application runs) to the internet. Ngrok will return to you a public URL similar to:

`http://<random>.ngrok.io`

#### Update TaskRouter Event Callbacks

Next, we need to tell TaskRouter how to send the Event Callbacks to the application thats running in docker on your machine. Take the ngrok URL and navigate to your workspace's settings:

https://www.twilio.com/console/taskrouter/workspaces/\<Workspace Sid\>/settings.

Scroll down to the "Event Callbacks" section and enter the ngrok URL into the "Event Callback URL".

`http://<random>.ngrok.io/ingress`

*Note: we added the /ingress to the ngrok URL - by default the web server with this application is listening for events from TaskRouter at this URI.*

#### Generate some events!

The easiest way to confirm everything is working is to actually generate some TaskRouter Event Callbacks, and one of the easiest ways to do that is to use Twilio Flex, and answer tasks, or move workers online/offline.

You'll see the database start to fill up with information. Happy Building!

## Make Commands

This application uses docker-compose and docker for local development - to help with some common commands we've employed a Makefile. You can review it for the specific commands to be run.

##### Building Containers
The `make buildrun` command will build the docker containers and the application. It is not necessary to run this command every time you want to boot the application. If you make a change at the container level and need to rebuild the containers, you can use this command. Additionally, if you make any changes to the NPM dependencies it is recommended that you re-run: `make buildrun`.

##### Stopping Containers
To bring the docker containers down you can run `make down`.

##### Starting Containers
To bring the docker containers back up without rebuilding them: `make run`.

##### Viewing Application Logs
If you wish to view the container logs while the application is running: `make logs.tail`. This is useful to view while the application is running. We recommend keeping this up in a terminal window as you work with the application.

##### Command line access to the main app container
If you need command line access to the main app container you can run `make bashapp`.

## Database Details

We're utilizing a promise-based Node.js ORM for Postgres called [Sequelize](http://docs.sequelizejs.com/). In addition to making it easy to interact with the database, Sequelize also provides us a way to create database migration files, so the schema of the database can be version controlled.

### Running Migrations
To run the migrations, first shell into the main app container when the project is running in docker with `make bashapp`.

Once you're in, you will run `$ npx sequelize db:migrate`. This will run all the migrations and the database will be setup. Review the [Sequelize Docs about migrations](http://docs.sequelizejs.com/manual/migrations.html#running-migrations) for more information, like how to undo the migrations if necessary, or how to create new migrations.

### Database Structure
While this application is intended to be a starting point, meaning you can modify the database structure however you wish, we will explain what it ships with out-of-the-box.

#### Tables

---

##### Events
The Events table stores all the raw events as they are seen from Twilio. This is particularly useful if you find you need to debug why a task or worker is in a certain state. You can review the Events table for all events relating to a task or worker.

```
    Column    |           Type           | Collation | Nullable |               Default
--------------+--------------------------+-----------+----------+--------------------------------------
 id           | integer                  |           | not null | nextval('"Events_id_seq"'::regclass)
 accountSid   | character varying(255)   |           |          |
 workspaceSid | character varying(255)   |           |          |
 eventType    | character varying(255)   |           |          |
 data         | jsonb                    |           |          |
 createdAt    | timestamp with time zone |           | not null |
 updatedAt    | timestamp with time zone |           | not null |
 taskSid      | character varying(255)   |           |          |
```

##### Tasks

The Tasks table, is the main table consisting of a single record for every task. It functions very much like a state machine. Each record of a Task is updated as the Task in TaskRouter moves through its lifecycle.

As you can see from the schema below, there is a lot of information about a task that would be useful to store long-term. Such as the workerName/Sid of the Worker who handled the task, what channel the task was on, what were its attributes, when it was created, how many reservations were created for it, etc.

```
          Column           |           Type           | Collation | Nullable |           Default
---------------------------+--------------------------+-----------+----------+------------------------------
 sid                       | character varying(255)   |           | not null |
 accountSid                | character varying(255)   |           |          |
 workspaceSid              | character varying(255)   |           |          |
 workerSid                 | character varying(255)   |           |          |
 workerName                | character varying(255)   |           |          |
 taskQueueSid              | character varying(255)   |           |          |
 taskQueueName             | character varying(255)   |           |          |
 taskQueueTargetExpression | character varying(255)   |           |          |
 taskChannelUniqueName     | character varying(255)   |           |          |
 taskAssignmentStatus      | character varying(255)   |           |          |
 age                       | integer                  |           |          |
 taskCreated               | integer                  |           |          |
 taskPriority              | integer                  |           |          |
 taskAttributes            | jsonb                    |           |          |
 answeredIn                | integer                  |           |          |
 acwStart                  | integer                  |           |          |
 totalTime                 | integer                  |           |          |
 withinSLA                 | boolean                  |           |          |
 createdAt                 | timestamp with time zone |           | not null |
 updatedAt                 | timestamp with time zone |           | not null |
 direction                 | character varying(255)   |           |          | 'inbound'::character varying
 reservationCount          | integer                  |           |          | 0
 agentMessageCount         | integer                  |           |          | 0
 clientMessageCount        | integer                  |           |          | 0
 agentTotalResponseTime    | integer                  |           |          | 0
 clientTotalResponseTime   | integer                  |           |          | 0
 ucProcessingTime          | integer                  |           |          | 0
 twilioRoutingTime         | double precision         |           |          | 0
 agentAcceptanceTime       | integer                  |           |          | 0
 agentFirstResponseTime    | integer                  |           |          | 0
 totalAcceptanceTime       | integer                  |           |          | 0
 lastReservationCreated    | integer                  |           |          | 0
 lastReservationAccepted   | integer                  |           |          | 0
```
##### Workers

Similar to the Tasks table, the Workers table also functions like a state machine, maintaining the state of each worker, one record per worker, as workers are changing their status.

```
          Column          |           Type           | Collation | Nullable | Default
--------------------------+--------------------------+-----------+----------+---------
 accountSid               | character varying(255)   |           | not null |
 workspaceSid             | character varying(255)   |           | not null |
 workerSid                | character varying(255)   |           | not null |
 workerName               | character varying(255)   |           | not null |
 currentActivity          | character varying(255)   |           | not null |
 currentActivitySid       | character varying(255)   |           | not null |
 currentActivityAvailable | boolean                  |           |          | false
 previousActivity         | character varying(255)   |           | not null |
 previousActivitySid      | character varying(255)   |           | not null |
 timeInPreviousActivity   | integer                  |           | not null |
 workerAttributes         | jsonb                    |           |          |
 createdAt                | timestamp with time zone |           | not null |
 updatedAt                | timestamp with time zone |           | not null |
```
##### WorkerChannels

The WorkerChannels table allows us to cache each Worker's capacity and availablity on a given task channel. This data, combined with the state machine of the Workers table, allows us to calculate what the contact center's capacity is on any given channel.

Additionally, this table also acts like a state machine and is updated whenever a worker's capacity, or availability on a channel is changed.

```
        Column         |           Type           | Collation | Nullable | Default
-----------------------+--------------------------+-----------+----------+---------
 sid                   | character varying(255)   |           | not null |
 workerSid             | character varying(255)   |           |          |
 taskChannelUniqueName | character varying(255)   |           |          |
 taskChannelSid        | character varying(255)   |           |          |
 available             | boolean                  |           |          |
 configuredCapacity    | integer                  |           |          |
 createdAt             | timestamp with time zone |           | not null |
 updatedAt             | timestamp with time zone |           | not null |
```
## Processing Event Callbacks

### Overview

Let's look at how we handle the HTTP Event Callbacks from TaskRouter from a technical perspective.

By default the application is listening to incoming requests at the route: `/ingress`.

*NOTE: this can be changed by editing the `src/server.js` file.*

If you look at the implementation in `src/server.js` of the `/ingress` route, you can see that immediately we turn the incoming request body into JSON and enqueue a job using [node-resque](https://github.com/taskrabbit/node-resque) to be worked.

`return resque.queue.enqueue('ingress', 'ingress_job', JSON.stringify(req.body))`

This Ingress Job is the starting point for all the event processing the application does. To investigate the details of what the ingress_job does, see `src/resque_jobs/ingress_job.js`.

### Jobs

All of the event processing is organized into jobs spawning from the `src/resque_jobs/ingress_job.js`.

We gain a big advantages by making all of the event processing asynchronous to the incoming HTTP request that spawned it.

The code to recieve the incoming HTTP request from Twilio is really simple, and unlikely to crash or have bugs. This means we can recieve a lot of events from Twilio, both really fast and with confidence that we won't fail to queue them up for work later.

Because our web server isn't bothering to do the work of connecting to the database, just recording events for us to process later, we make scaling a bit easier. We already know that TaskRouter instances with lots of workers doing lots of work will make lots of events, and its going to be easier to handle that volume by only worrying about connecting to redis and recording some JSON to be processed later.

### Upsert Strategy

Unfortunately, given that HTTP is not a particularly robust system for ensuring that every message is delivered, its possible to miss a message. Even thought events tend to happen in a specific order, for example, you'd always expect to see a `task.created` event before you see a `reservation.created event`. But in reality, its possible you may not see a `task.created` event at all, or that the event arrives after the `reservation.created` event.

In order to protect against these eventualities, we harnessed two strategies. First, we utilize a feature of postgres and always perform [upserts](http://www.postgresqltutorial.com/postgresql-upsert/). If we didn't do this, and the implementation of our `reservation.created` callback was trying to load a task with a certain sid (which didn't exist because we missed the `task.created` callback) our `reservation.created` job would fail.

Instead, with an upsert, we don't have to assume that the record of the task already exists in our database, when we see the `task.created` or the `reservation.created` event callbacks, they both contain a lot of data about the task (some of it repeated) and we can just perform an upsert in either case. The end result is as accurate a picture of the task as we could possibly get.

Secondly, most of the fields in the "Tasks" table are nullable. We'd love to have the best data possible, and enforcing those constraints on the database would help guard against incomplete records, but in this case we actually think some data is better than no data. This means, regardless of the order of the callback events, and regardless of which ones we are able to process we'll collect absolutely as much data about the tasks in your workspace as possible.

### Job Details

#### ingress.job

File: `src/resque_jobs/ingress_job.js`

This job is enqueued with every HTTP callback event from Twilio.

First, it records in the [Events](#events) table a record of the original event we received from Twilio. One key to note here is that we extract the taskSid (if it exists) and write it into a column in the Events table. This can really make debugging easier, if your "Task" table seems to be out of sync with TaskRouter, you can inspect the events on a given task and make sure you recorded events like the task being completed, etc.

Second, it enqueues one of a number of other tasks based on the incoming event from Twilio.

#### reservation.created

File: `src/resque_jobs/reservation_created.js`

This job is enqueued when the ingress job processes a `reservation.created` callback event.

This job updates the task's taskAssignmentStatus to `reserved` and records the timestamp of the last reservation that was created for the task (we use this later in some calculations).

#### reservation.accepted

File: `src/resque_jobs/reservation_accepted.js`

This job is enqueued when the ingress job processes a `reservation.accepted` callback event.

This job updates the task's taskAssignmentStatus to `assigned` and records other interesting information like the worker who is currently working this task. We can also capture the age of the task when this event was fired and understand how long it took for someone to actually answer the task.