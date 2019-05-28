const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task,
      redisDriver  = require('../lib/redis_driver'),
      resqueDriver  = require('../lib/resque_driver');

module.exports = {
  queue: "task.sla",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: async (json) => {
      const resque  = await resqueDriver.getQueue();
      const data    = JSON.parse(json);
      Task.findOne({ where: { sid: data.TaskSid }}).then(async (task) => {
        /**
          @TODO: support calculating SLA by TaskQueue
        **/
        task.withinSLA = true;

        if (task.answeredIn > 15) {
          task.withinSLA = false;
        }

        await task.save().then(async (task) => {
          data.ServiceLevel = "No";
          if (task.withinSLA) {
            data.ServiceLevel = "OK";
          }
          // trigger a task to update task attributes and tell WFO Service Level was met
          await resque.queue.enqueue('task.sla.wfo', 'task_sla_wfo', JSON.stringify(data));
          await redisDriver.release(resque.client);
          return true;
        });
      }).catch(err => {
        throw new Error(err);
      });
    }
  }
}
