const path          = require("path"),
      fs            = require('fs'),
      Task          = require(path.resolve(__dirname+'/../models/index')).Task,
      Op            = require(path.resolve(__dirname+'/../models/index')).Sequelize.Op,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  queue: "sync.check.workspace.tasks",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: () => {
      let currentWorkspaceTasks = [];

      // retrieve a list of tasks from TR API
      twilio.taskrouter.workspaces(process.env.TR_WORKSPACE_SID).tasks.list().then(async (tasks) => {
        // push them into an array of this format
        // [ 'WTxxxxxxxxx' : 'assigned' ]
        await tasks.forEach((task) => {
          currentWorkspaceTasks[task.sid] = task.assignmentStatus;
        });

        await syncCurrentTaskStatuses(currentWorkspaceTasks).then(async () => {
          await cleanUpOldTasks(currentWorkspaceTasks).then(() => {
            return true;
          });
        });

      });
    }
  }
}

function syncCurrentTaskStatuses(currentWorkspaceTasks) {
  return new Promise((resolve, reject) => {
    // Retrieve all relevant task records from our database using the keys in the currentWorkspaceTasks array
    Task.findAll({
      where: {
        sid: {
          [Op.in] : Object.keys(currentWorkspaceTasks)
        }
      }
    }).then(async (tasks) => {
      // loop through each task returned, update its status according to the status in the API
      if (!tasks.length) {
        console.log(`skipping sync.check.workspace.tasks because there are no tasks to sync.`);
        return resolve();
      }
      await tasks.forEach(async (task) => {
        if (task.taskAssignmentStatus !== currentWorkspaceTasks[task.sid]) {
          console.log(`syncing task sid: ${task.sid} to status: ${currentWorkspaceTasks[task.sid]}`);
          task.taskAssignmentStatus = currentWorkspaceTasks[task.sid];
          await task.save();
        } else {
          console.log(`skipped syncing task sid: ${task.sid} to ${currentWorkspaceTasks[task.sid]} because its already ${task.taskAssignmentStatus}`);
        }
      })
      resolve();
    });
  })
}

function cleanUpOldTasks(currentWorkspaceTasks) {
  return new Promise((resolve, reject) => {
    Task.findAll({
      where: {
        [Op.and]: [
          {
            sid: {
              [Op.notIn] : Object.keys(currentWorkspaceTasks)
            }
          },
          {
            taskAssignmentStatus: {
              [Op.notIn] : ['completed', 'canceled']
            }
          }
        ]
      }
    }).then(async (tasks) => {
      if (!tasks.length) {
        console.log(`skipping cleanupOldTasks because there are no tasks to cleanup`);
        return resolve();
      }
      await tasks.forEach(async (task) => {
        console.log(`syncing task sid: ${task.sid} to status: completed because it no longer exists in Twilio`);
        task.taskAssignmentStatus = 'completed';
        await task.save();
      })
      return resolve();
    })
  })
}