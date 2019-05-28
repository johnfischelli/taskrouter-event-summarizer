const path         = require("path"),
      fs           = require('fs'),
      Event        = require(path.resolve(__dirname+'/../models/index')).Event,
      redisDriver  = require('../lib/redis_driver'),
      resqueDriver = require('../lib/resque_driver');

module.exports = {
  queue: "ingress",
  job: {
    perform: async (json) => {
      const resque  = await resqueDriver.getQueue();
      const data    = JSON.parse(json);
      Event.create({
        accountSid: data.AccountSid,
        workspaceSid: data.WorkspaceSid,
        eventType: data.EventType,
        data: data,
        taskSid: data.TaskSid || null }).then(async (event) => {
        switch(event.eventType) {
          case 'reservation.created':
              setTimeout(async () => {
                await resque.queue.enqueue('reservation.created', 'reservation_created', JSON.stringify(data));
              }, 250);
          break;
          case 'reservation.accepted':
            await resque.queue.enqueue('reservation.accepted', 'reservation_accepted', JSON.stringify(data));
          break;
          case 'reservation.completed':
            await resque.queue.enqueue('reservation.completed', 'reservation_completed', JSON.stringify(data));
          break;
          case 'task.canceled':
            await resque.queue.enqueue('task.canceled', 'task_canceled', JSON.stringify(data));
          break;
          case 'task.completed':
            await resque.queue.enqueue('task.completed', 'task_completed', JSON.stringify(data));
          break;
          case 'task.created':
            await resque.queue.enqueue('task.created', 'task_created', JSON.stringify(data));
          break;
          case 'task.deleted':
            await resque.queue.enqueue('task.deleted', 'task_deleted', JSON.stringify(data));
          break;
          case 'task.updated':
            await resque.queue.enqueue('task.updated', 'task_updated', JSON.stringify(data));
          break;
          case 'task.wrapup':
            await resque.queue.enqueue('task.wrapup', 'task_wrapup', JSON.stringify(data));
          break;
          case 'worker.activity.update':
            await resque.queue.enqueue('worker.activity.update', 'worker_activity_update', JSON.stringify(data));
          break;
          case 'worker.attributes.update':
            await resque.queue.enqueue('worker.attributes.update', 'worker_attributes_update', JSON.stringify(event));
          break;
          case 'worker.capacity.update':
            await resque.queue.enqueue('worker.capacity.update', 'worker_capacity_update', JSON.stringify(data));
          break;
          case 'worker.channel.availability.update':
            await resque.queue.enqueue('worker.channel.availability.update', 'worker_channel_availability_update', JSON.stringify(data));
          break;
        }
        await redisDriver.release(resque.client);
        return true;
      });
    }
  },
}
