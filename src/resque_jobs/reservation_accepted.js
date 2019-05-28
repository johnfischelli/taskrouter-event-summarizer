const path          = require("path"),
      fs            = require('fs'),
      Task        = require(path.resolve(__dirname+'/../models/index')).Task,
      redisDriver = require('../lib/redis_driver'),
      resqueDriver = require('../lib/resque_driver');

module.exports = {
  queue: "reservation.accepted",
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
        answeredIn: data.TaskAge,
        lastReservationAccepted: data.Timestamp
      } , { returning: true })
      .then(async (result) => {
        let task = result[0];

        await resque.queue.enqueue('task.sla', 'task_sla', JSON.stringify(data));
        await redisDriver.release(resque.client);

        task.agentAcceptanceTime = ((data.Timestamp - task.lastReservationCreated) === data.Timestamp) ? 1 : (data.Timestamp - task.lastReservationCreated);
        task.totalAcceptanceTime = data.Timestamp - task.taskCreated;
        task.save();
        return true;
      })
    }
  }
}
