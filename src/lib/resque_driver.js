const  NodeResque = require('node-resque'),
             path = require("path"),
               fs = require('fs'),
     redisDriver  = require('./redis_driver');

const connectWithRetries = require('./connect_with_retries');

// Load up all the resque_jobs files
const jobs = {};
const queues = [];
const resqueJobsPath = path.resolve(__dirname, "../resque_jobs/");

fs.readdirSync(resqueJobsPath).forEach(function(file) {
  if (/\.js/.test(file)) {
    let job_object = require(resqueJobsPath + '/' + file);
    if (job_object.job && job_object.queue && job_object.job.perform) {
      let job_name = file.replace('.js', '');
      jobs[job_name] = job_object.job;
      queues.push(job_object.queue);
    } else {
      console.log(`ResqueJob file ${file} is not properly configured. Skipping.`);
    }
  }
});

let connectionStore = {};
connectionStore.redisPool = redisDriver;

//  ===========================
//  = Returns a worker object =
//  ===========================
exports.getWorker = () => {
  return new Promise((resolve, reject) => {
    redisDriver.acquire().then(async (client) => {
      const worker = new NodeResque.Worker({
        connection: {redis: client },
        queues: queues,
        timeout: 1000
      }, jobs);

      connectionStore.worker = worker;
      connectionStore.workerRedisClient = client;

      await connectWithRetries(worker.connect.bind(worker), 100, 10).catch((err) => {
        if (required) {
          console.error(`FATAL: Could not conect to Postgres.`, err)
          process.kill(process.pid, 'SIGTERM')
          reject()
        } else {
          console.error(`WARNING: Could not conect to Postgres.`, err)
          reject()
        }
      });

      resolve({worker: worker, client: client})
    })
  })
}

//  ===========================
//  = Returns a scheduler object =
//  ===========================
exports.getScheduler = () => {
  return new Promise((resolve, reject) => {
    redisDriver.acquire().then(async (client) => {
      const scheduler = new NodeResque.Scheduler({
        connection: { redis: client },
        timeout: 250
      });

      connectionStore.scheduler = scheduler;
      connectionStore.schedulerRedisClient = client;

      await connectWithRetries(scheduler.connect.bind(scheduler), 100, 10).catch((err) => {
        if (required) {
          console.error(`FATAL: Could not conect to Postgres.`, err)
          process.kill(process.pid, 'SIGTERM')
          reject();
        } else {
          console.error(`WARNING: Could not conect to Postgres.`, err)
          reject();
        }
      });

      resolve({scheduler: scheduler, client: client});
    });
  })
}

//  ==========================
//  = Returns a Queue object =
//  ==========================
exports.getQueue = () => {
  return new Promise((resolve, reject) => {
    redisDriver.acquire().then(async (client) => {
      const queue = new NodeResque.Queue({ connection: {redis: client} }, jobs);
      queue.on('error', function (error) { console.log(error) });

      connectionStore.queue = queue;
      connectionStore.queueRedisClient = client;

      await connectWithRetries(queue.connect.bind(queue), 100, 10).catch((err) => {
        if (required) {
          console.error(`FATAL: Could not conect to Postgres.`, err)
          process.kill(process.pid, 'SIGTERM')
          reject();
        } else {
          console.error(`WARNING: Could not conect to Postgres.`, err)
          reject();
        }
      });

      resolve({queue: queue, client: client});
    });
  })
}

//  =====================
//  = Shutdown Function =
//  =====================
exports.shutdown = async () => {
  if (connectionStore.queue) {
    await connectionStore.queue.end();
    connectionStore.redisPool.release(connectionStore.queueRedisClient);
  }

  if (connectionStore.worker) {
    await connectionStore.worker.end();
    connectionStore.redisPool.release(connectionStore.workerRedisClient);
  }

  if (connectionStore.scheduler) {
    await connectionStore.scheduler.end();
    connectionStore.redisPool.release(connectionStore.schedulerRedisClient);
  }

  connectionStore.redisPool.drain().then(() => {
    connectionStore.redisPool.clear();
  })
}

