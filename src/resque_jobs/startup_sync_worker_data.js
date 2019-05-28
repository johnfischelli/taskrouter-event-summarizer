const path          = require("path"),
      fs            = require('fs'),
      Worker        = require(path.resolve(__dirname+'/../models/index')).Worker,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
      redisDriver  = require('../lib/redis_driver'),
      resqueDriver  = require('../lib/resque_driver');

module.exports = {
  queue: "startup.sync.worker.data",
  job: {
    perform: async () => {
      const resque  = await resqueDriver.getQueue();

      let incr = 0;

      twilio.taskrouter.workspaces(process.env.TR_WORKSPACE_SID)
      .workers
      .each({
        callback: (worker) => {
          // upsert the record of the worker
          Worker.upsert({
            accountSid: worker.accountSid,
            workspaceSid: worker.workspaceSid,
            workerSid: worker.sid,
            workerName: worker.friendlyName,
            currentActivity: worker.activityName,
            currentActivitySid: worker.activitySid,
            currentActivityAvailable: worker.available,
            previousActivity: '',
            previousActivitySid: '',
            timeInPreviousActivity: 0,
            workerAttributes: worker.attributes
          }, { returning: true }).then(async (result) => {
            // trigger a capacity update on this worker so that we cache their channels
            // this is expensive and we could be doing this for a lot of workers, so lets just slow this down
            await resque.queue.enqueueIn((incr * 2000),'worker.capacity.update', 'worker_capacity_update', JSON.stringify({
              WorkerSid: worker.sid,
              SkipCapSync: true
            }));
            incr++;
          });
        },
        done: async () => {
          await redisDriver.release(resque.client);
          return true;
        }
      })
    }
  }
}