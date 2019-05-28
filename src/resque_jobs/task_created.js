const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task,
      redisDriver  = require('../lib/redis_driver'),
      resqueDriver  = require('../lib/resque_driver');

module.exports = {
  queue: "task.created",
  job: {
    perform: async (json) => {
      const data   = JSON.parse(json);
      const resque  = await resqueDriver.getQueue();
      const taskAtts = JSON.parse(data.TaskAttributes);

      let channel = data.TaskChannelUniqueName;

      // this allows us to support sms/whatsapp/messenger/etc - the TR callback sees them all as chats
      if (taskAtts.hasOwnProperty('channelType') && taskAtts.channelType != 'web') {
        channel = taskAtts.channelType;
      }

      Task.upsert({
        sid: data.TaskSid,
        accountSid: data.AccountSid,
        workspaceSid: data.WorkspaceSid,
        taskQueueSid: data.TaskQueueSid,
        taskQueueName: data.TaskQueueName,
        taskQueueTargetExpression: data.TaskQueueTargetExpression,
        taskChannelUniqueName: channel,
        taskAssignmentStatus: data.TaskAssignmentStatus,
        age: data.TaskAge,
        taskCreated: data.TaskDateCreated,
        taskPriority: data.TaskPriority,
        taskAttributes: data.TaskAttributes,
        direction: taskAtts.hasOwnProperty('direction') ? taskAtts.direction : 'inbound'
      }, { returning: true }).then(async (result) => {
        await resque.queue.enqueue('sync.workspace.active.tasks', 'sync_workspace_active_tasks');
        await redisDriver.release(resque.client);
        return true;
      });
    }
  }
}
