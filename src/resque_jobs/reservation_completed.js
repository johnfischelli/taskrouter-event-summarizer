const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task;

module.exports = {
  queue: "reservation.completed",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: async (json) => {
      const data   = JSON.parse(json);

      Task.upsert({
        sid: data.TaskSid,
        taskQueueSid: data.TaskQueueSid,
        taskQueueName: data.TaskQueueName,
        taskQueueTargetExpression: data.TaskQueueTargetExpression,
        taskAssignmentStatus: data.TaskAssignmentStatus,
        age: data.TaskAge,
        taskAttributes: data.TaskAttributes,
        workerName: data.WorkerName,
        workerSid: data.WorkerSid,
        totalTime: data.TaskAge,
      });
    }
  }
}
