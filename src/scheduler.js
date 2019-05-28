const schedule = require('node-schedule');
const resqueDriver = require('./lib/resque_driver');

//  ==================
//  = Start Function =
//  ==================
async function start() {
  const resque = await resqueDriver.getQueue();
  resqueDriver.getScheduler().then((resolved) => {
    let scheduler = resolved.scheduler;
    // Handle scheduler events
    scheduler.on('start', () => { console.log(`scheduler started on ${new Date().toString()}`) });
    scheduler.on('reEnqueue', (queue, job, plugin) => { console.log(`reEnqueue job (${plugin}) ${queue} ${JSON.stringify(job)}`) });
    scheduler.on('failure', (queue, job, failure) => { console.log(`job failure ${queue} ${JSON.stringify(job)} >> ${failure}`) });
    // scheduler.on('end', () => { console.log('scheduler ended') });
    // scheduler.on('cleaning_scheduler', (scheduler, pid) => { console.log(`cleaning old scheduler ${scheduler}`) });
    // scheduler.on('poll', (queue) => { console.log(`scheduler polling ${queue}`) });
    // scheduler.on('ping', (time) => { console.log(`scheduler check in @ ${time}`) });
    // scheduler.on('pause', () => { console.log('scheduler paused') });

    scheduler.on('job', function(queue, job) {
      console.log("Starting job %j", job.class);
    });

    scheduler.on('success', function(queue, job, result) {
      console.log("Finished job %j", job.class);
    });

    // prevents the scheduler from crashing in the event of a disconnect
    scheduler.on('error', function(error, queue, job) {
      console.log("Error performing job %j", job.class);
    });

    scheduler.start();

    schedule.scheduleJob('59 * * * * *', async () => {
      let length = await resque.queue.length('sync.check.workspace.tasks');
      if (length >= 1) {
        console.log(`did not schedule sync.check.workspace.tasks because there are already ${length} waiting`);
        return false;
      }
      resque.queue.enqueue('sync.check.workspace.tasks', 'sync_check_workspace_tasks');
    })

    // schedule.scheduleJob('30 * * * * *', async () => {
    //   let length = await resque.queue.length('sync.workspace.capacity');
    //   if (length >= 1) {
    //     console.log(`did not schedule sync.workspace.capacity because there are already ${length} waiting`);
    //     return false;
    //   }
    //   resque.queue.enqueue('sync.workspace.capacity', 'sync_workspace_capacity');
    // })

    // schedule.scheduleJob('30 * * * * *', async () => {
    //   let length = await resque.queue.length('sync.workspace.active.tasks');
    //   if (length >= 1) {
    //     console.log(`did not schedule sync.workspace.active.tasks because there are already ${length} waiting`);
    //     return false;
    //   }
    //   resque.queue.enqueue('sync.workspace.active.tasks', 'sync_workspace_active_tasks');
    // })

    // schedule.scheduleJob('0,15,30,45 * * * * *', async () => {
    //   let length = await resque.queue.length('scheduled.queue.stats');
    //   if (length >= 1) {
    //     console.log(`did not schedule scheduled.queue.stats because there are already ${length} waiting`);
    //     return false;
    //   }
    //   resque.queue.enqueue('scheduled.queue.stats', 'scheduled_queue_stats');
    // })

    // schedule.scheduleJob('0,15,30,45 * * * * *', async () => {
    //   let length = await resque.queue.length('scheduled.daily.stats');
    //   if (length >= 1) {
    //     console.log(`did not schedule scheduled.daily.stats because there are already ${length} waiting`);
    //     return false;
    //   }
    //   resque.queue.enqueue('scheduled.daily.stats', 'scheduled_daily_stats');
    // })
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
