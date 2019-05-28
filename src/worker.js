const resqueDriver = require('./lib/resque_driver');

//  ==================
//  = Start Function =
//  ==================
async function start() {
  resqueDriver.getWorker().then((resolved) => {
    let worker = resolved.worker;
    // Handle worker events
    worker.on('start', () => { console.log('worker started') });
    worker.on('reEnqueue', (queue, job, plugin) => { console.log(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`) });
    worker.on('failure', (queue, job, failure) => { console.log(`job failure ${queue} ${JSON.stringify(job)} >> ${failure}`) });
    // worker.on('end', () => { console.log('worker ended') });
    // worker.on('cleaning_worker', (worker, pid) => { console.log(`cleaning old worker ${worker}`) });
    // worker.on('poll', (queue) => { console.log(`worker polling ${queue}`) });
    // worker.on('ping', (time) => { console.log(`worker check in @ ${time}`) });
    // worker.on('pause', () => { console.log('worker paused') });

    worker.on('job', function(queue, job) {
      console.log("Starting job %j", job.class);
    });

    worker.on('success', function(queue, job, result) {
      console.log("Finished job %j", job.class);
    });

    // prevents the worker from crashing in the event of a disconnect
    worker.on('error', function(error, queue, job) {
      console.log("Error performing job %j", job.class);
    });

    worker.start();
  });
}

//  =====================
//  = Shutdown Function =
//  =====================
async function shutdown () {
  console.log('    ### RECEIVED SHUTDOWN SIGNAL ###.   ');
  await resqueDriver.shutdown();
  console.log('Worker is now ready to exit, bye bye...');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
