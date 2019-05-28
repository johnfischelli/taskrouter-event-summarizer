const path          = require("path"),
      fs            = require('fs'),
      Worker        = require(path.resolve(__dirname+'/../models/index')).Worker,
      WorkerChannel = require(path.resolve(__dirname+'/../models/index')).WorkerChannel,
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  queue: "sync.workspace.capacity",
  plugins: ['Retry'],
  pluginOptions: {
    Retry: {
      retryLimit: 10,
      retryDelay: 3000
    }
  },
  job: {
    perform: () => {
      WorkerChannel.findAll({
        include: [
          {
            model: Worker,
            where: { currentActivityAvailable: true }
          }
        ]
      }).then(async (channels) => {

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

        await channels.forEach((channel) => {
          data[channel.taskChannelUniqueName] += parseInt(channel.configuredCapacity);
        })

        console.log('workspaceCapacity', data);

        await twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
        .documents('workspaceCapacity')
        .fetch()
        .then(doc => {
          updateDoc(twilio, doc, data).then(() => {
            return true;
          })
        })
        .catch(err => {
          createDoc(twilio, data).then(() => {
            return true;
          })
        });
      })
    }
  }
}

function updateDoc(twilio, doc, data) {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
    .documents('workspaceCapacity')
    .update({data: data})
    .then(document => {
      resolve(document);
    }).catch(err => {
      reject(err);
    })
  })
}

function createDoc(twilio, data) {
  return new Promise((resolve, reject) => {
    twilio.sync.services(process.env.TWILIO_SYNC_SERVICE_SID)
    .documents
    .create({data: data, ttl: 3600, uniqueName: 'workspaceCapacity'})
    .then(document => {
      resolve(document);
    }).catch(err => {
      reject(err);
    })
  })
}