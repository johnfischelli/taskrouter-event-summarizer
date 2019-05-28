const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task,
      sync          = require(path.resolve(__dirname+'/../helpers/twilio/sync'));

module.exports = {
  queue: "sync.workspace.active.tasks",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: () => {
      Task.findAll({
        where: {
          taskAssignmentStatus: ['pending', 'reserved', 'assigned', 'wrapping']
        }
      }).then(async (tasks) => {

        let data = {
          default: 0,
          voice: 0,
          chat: 0,
          sms: 0,
          video: 0,
          custom1: 0,
          custom2: 0,
          custom3: 0,
          custom4: 0,
          custom5: 0
        };

        await tasks.forEach((task) => {
          data[task.taskChannelUniqueName]++;
        })

        console.log('workspaceActiveTaskCount', data);

        sync.createOrUpdateSyncDoc('workspaceActiveTaskCount', data).then(() => {
          return true;
        });

      });
    }
  }
}