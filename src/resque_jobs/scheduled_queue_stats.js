const path          = require("path"),
      fs            = require('fs'),
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
      sync          = require(path.resolve(__dirname+'/../helpers/twilio/sync'));

module.exports = {
  queue: "scheduled.queue.stats",
  job: {
    perform: async () => {
      const tr = twilio.taskrouter.workspaces(process.env.TR_WORKSPACE_SID);

      tr.taskQueues.each((taskQueue) => {
        let tqSid = taskQueue.sid;
        tr.taskQueues(tqSid).statistics().fetch()
        .then((stats) => {
          let data = {
            cumulative: stats.cumulative,
            realtime: stats.realtime
          };
          sync.retrieveSyncMap('taskQueueStats').then((map) => {
            sync.createOrUpdateSyncMapItem(map.sid, taskQueue.friendlyName, data)
            .then(() => {
              return true;
            })
          })
        })
      })
    }
  }
}
