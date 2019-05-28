const path         = require("path"),
      fs           = require('fs'),
      Task         = require(path.resolve(__dirname+'/../models/index')).Task,
      redisDriver = require('../lib/redis_driver'),
      resqueDriver = require('../lib/resque_driver');

module.exports = {
  queue: "task.completed",
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
        age: data.TaskAge,
        taskAssignmentStatus: data.TaskAssignmentStatus,
        taskAttributes: data.TaskAttributes,
        workerName: data.WorkerName,
        workerSid: data.WorkerSid,
        totalTime: data.TaskAge
      } , { returning: true })
      .then(async (result) => {
        let task = result[0];
        await resque.queue.enqueue('sync.workspace.active.tasks', 'sync_workspace_active_tasks');
        if(task.taskChannelUniqueName == 'chat' || task.taskChannelUniqueName == 'sms') {
          await resque.queue.enqueue('chat.summary', 'chat_summary', task.sid);
        }
        if(task.taskChannelUniqueName == 'voice') {
          await resque.queue.enqueue('voice.summary', 'voice_summary', task.sid);
        }
        await redisDriver.release(resque.client);
        return true;
      });
    }
  }
}
