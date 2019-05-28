const path         = require("path"),
      fs           = require('fs'),
      Task         = require(path.resolve(__dirname+'/../models/index')).Task,
      twilio       = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  queue: "voice.summary",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: async (taskSid) => {
      Task.findOne({ where: { sid: taskSid }}).then((task) => {
          let attributes = task.taskAttributes;
          task.agentFirstResponseTime = task.lastReservationAccepted - task.taskCreated;
          task.save(() => {
            return true;
          });
      });
    }
  }
}
