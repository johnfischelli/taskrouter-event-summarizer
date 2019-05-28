const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  queue: "task.acw.wfo",
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
      const taskSid = data.TaskSid;

      Task.findOne({ where: { sid: data.TaskSid }}).then((task) => {
        twilio.taskrouter.workspaces(data.WorkspaceSid)
        .tasks(taskSid)
        .fetch()
        .then(trTask => {
          let attributes = JSON.parse(trTask.attributes);
          attributes.conversation = attributes.conversation || {};
          attributes.conversation = Object.assign(attributes.conversation, {
            wrap_up_time: (task.totalTime - task.acwStart)
          });

          twilio.taskrouter.workspaces(data.WorkspaceSid)
          .tasks(taskSid)
          .update({
            attributes: JSON.stringify(attributes)
          })
          .then(() => {
            return true;
          });
        });
      }).catch(err => {
        throw new Error(err);
      });
    }
  }
}
