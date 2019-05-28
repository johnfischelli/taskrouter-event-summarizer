const path         = require("path"),
      fs           = require('fs'),
      Task         = require(path.resolve(__dirname+'/../models/index')).Task,
      redisDriver  = require('../lib/redis_driver'),
      resqueDriver = require('../lib/resque_driver');

module.exports = {
  queue: "task.deleted",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: async (json) => {
      const data    = JSON.parse(json);
      const resque  = await resqueDriver.getQueue();

      Task.upsert({
        sid: data.TaskSid,
        accountSid: data.AccountSid,
        workspaceSid: data.WorkspaceSid,
        taskQueueSid: data.TaskQueueSid,
        taskQueueName: data.TaskQueueName,
        taskQueueTargetExpression: data.TaskQueueTargetExpression,
        taskAssignmentStatus: data.TaskAssignmentStatus,
        age: data.TaskAge,
        totalTime: data.TaskAge,
        taskPriority: data.TaskPriority,
        taskAttributes: data.TaskAttributes
      }, { returning: true }).then(async (result) => {
        await resque.queue.enqueue('sync.workspace.active.tasks', 'sync_workspace_active_tasks');
        await redisDriver.release(resque.client);
        return true;
      });
    }
  }
}
