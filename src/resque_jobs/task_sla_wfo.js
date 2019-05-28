const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  queue: "task.sla.wfo",
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
      const serviceLevel = data.ServiceLevel;
      const taskSid = data.TaskSid;

      twilio.taskrouter.workspaces(data.WorkspaceSid)
      .tasks(taskSid)
      .fetch()
      .then(task => {
        let attributes = JSON.parse(task.attributes);
        attributes.conversations = attributes.conversations || {};
        attributes.conversations = Object.assign(attributes.conversations, {
          service_level: data.ServiceLevel
        });

        twilio.taskrouter.workspaces(data.WorkspaceSid)
        .tasks(taskSid)
        .update({
          attributes: JSON.stringify(attributes)
        }).then(() => {
          return true;
        });
      }).catch(err => {
        throw new Error(err);
      });
    }
  }
}
