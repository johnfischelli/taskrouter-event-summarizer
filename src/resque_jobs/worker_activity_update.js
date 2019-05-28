const path          = require("path"),
      fs            = require('fs'),
      Worker        = require(path.resolve(__dirname+'/../models/index')).Worker,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
      redisDriver  = require('../lib/redis_driver'),
      resqueDriver  = require('../lib/resque_driver');

module.exports = {
  queue: "worker.activity.update",
  job: {
    perform: async (json) => {
      const data   = JSON.parse(json);
      const resque  = await resqueDriver.getQueue();

      // first, we need to know if the activity the worker is moving into
      // allows the worker to be available or not
      // the only way to do that is to use the TaskRouter REST API
      twilio.taskrouter.workspaces(data.WorkspaceSid)
      .activities(data.WorkerActivitySid)
      .fetch()
      .then(activity => {
        // update the data object for upsertion
        data.currentActivityAvailable = false;
        if (activity.available) {
          data.currentActivityAvailable = true;
        }

        // upsert the record of the worker
        Worker.upsert({
          accountSid: data.AccountSid,
          workspaceSid: data.WorkspaceSid,
          workerSid: data.WorkerSid,
          workerName: data.WorkerName,
          currentActivity: data.WorkerActivityName,
          currentActivitySid: data.WorkerActivitySid,
          currentActivityAvailable: data.currentActivityAvailable,
          previousActivity: data.WorkerPreviousActivityName,
          previousActivitySid: data.WorkerPreviousActivitySid,
          timeInPreviousActivity: data.WorkerTimeInPreviousActivity,
          workerAttributes: JSON.parse(data.WorkerAttributes)
        }, { returning: true }).then(async (result) => {
          if (result[1] == true) {
            // trigger a capacity update on this worker so that we cache their channels
            await resque.queue.enqueue('worker.capacity.update', 'worker_capacity_update', JSON.stringify(data));
          }
          // recalculate the workspace's capacity
          await resque.queue.enqueue('sync.workspace.capacity', 'sync_workspace_capacity');
          await redisDriver.release(resque.client);
          return true;
        });
      })
    }
  }
}