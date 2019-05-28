const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task;

module.exports = {
  queue: "task.wrapup",
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
        accountSid: data.AccountSid,
        workspaceSid: data.WorkspaceSid,
        taskQueueSid: data.TaskQueueSid,
        taskQueueName: data.TaskQueueName,
        taskQueueTargetExpression: data.TaskQueueTargetExpression,
        taskAssignmentStatus: data.TaskAssignmentStatus,
        age: data.TaskAge,
        taskPriority: data.TaskPriority,
        taskAttributes: data.TaskAttributes,
        workerName: data.WorkerName,
        workerSid: data.WorkerSid,
        acwStart: data.TaskAge
      }, { returning: true }).then(async (result) => {
        let task = result[0];
        if (task.taskAssignmentStatus != 'completed') {
          task.taskAssignmentStatus = data.TaskAssignmentStatus;
          task.save((task) => {
            return true;
          });
        } else {
          return true;
        }
      });
    }
  }
}
