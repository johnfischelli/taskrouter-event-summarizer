const path          = require("path"),
      fs            = require('fs'),
      WorkerChannel = require(path.resolve(__dirname+'/../models/index')).WorkerChannel,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
      redisDriver   = require('../lib/redis_driver'),
      resqueDriver  = require('../lib/resque_driver');

module.exports = {
  queue: "worker.capacity.update",
  job: {
    perform: async (json) => {
      const data   = JSON.parse(json);

      twilio.taskrouter.workspaces(process.env.TR_WORKSPACE_SID)
      .workers(data.WorkerSid)
      .workerChannels
      .list()
      .then(channels => {
        channels.forEach(channel => {
          WorkerChannel.upsert({
            sid: channel.sid,
            workerSid: data.WorkerSid,
            taskChannelUniqueName: channel.taskChannelUniqueName,
            taskChannelSid: channel.taskChannelSid,
            available: channel.available,
            configuredCapacity: channel.configuredCapacity
          }).then(async () => {
            if (!data.hasOwnProperty('SkipCapSync') || !data.SkipCapSync) {
              const resque  = await resqueDriver.getQueue();
              await resque.queue.enqueue('sync.workspace.capacity', 'sync_workspace_capacity');
              await redisDriver.release(resque.client);
              return true;
            }
          })
        })
      });
    }
  }
}