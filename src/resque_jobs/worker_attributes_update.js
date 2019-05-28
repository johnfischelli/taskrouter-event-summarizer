const path          = require("path"),
      fs            = require('fs'),
      Worker        = require(path.resolve(__dirname+'/../models/index')).Worker;

module.exports = {
  queue: "worker.attributes.update",
  job: {
    perform: async (json) => {
      const data   = JSON.parse(json);
      Worker.upsert({
        accountSid: data.AccountSid,
        workspaceSid: data.WorkspaceSid,
        workerSid: data.WorkerSid,
        workerName: data.WorkerName,
        currentActivity: data.WorkerActivityName,
        currentActivitySid: data.WorkerActivitySid,
        previousActivity: data.WorkerPreviousActivityName,
        previousActivitySid: data.WorkerPreviousActivitySid,
        timeInPreviousActivity: data.WorkerTimeInPreviousActivity,
        workerAttributes: JSON.parse(data.WorkerAttributes)
      }, { returning: true }).then((worker, created) => {
        return true;
      });
    }
  }
}
