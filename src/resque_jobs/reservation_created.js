const path          = require("path"),
      fs            = require('fs'),
      Task        = require(path.resolve(__dirname+'/../models/index')).Task;

module.exports = {
  queue: "reservation.created",
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

      Task.upsert({
        sid: data.TaskSid,
        age: data.TaskAge,
        taskAssignmentStatus: data.TaskAssignmentStatus,
        lastReservationCreated: data.Timestamp
      } , { returning: true })
      .then(async (result) => {
        let task = result[0];
        task.reservationCount = task.reservationCount + 1;
        if (task.twilioRoutingTime == 0) {
          let twilioRouting = parseInt(data.TimestampMs) - (task.taskCreated * 1000);
          task.twilioRoutingTime = (twilioRouting/1000);
        }
        task.save((task) => {
          return true;
        });
      });
    }
  }
}
