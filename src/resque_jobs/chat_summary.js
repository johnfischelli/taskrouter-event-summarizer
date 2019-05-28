const path         = require("path"),
      fs           = require('fs'),
      Task         = require(path.resolve(__dirname+'/../models/index')).Task,
      resqueDriver = require('../lib/resque_driver'),
      twilio       = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

module.exports = {
  queue: "chat.summary",
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
            let channelSid = attributes.channelSid;
            twilio.chat.services(process.env.TWILIO_CHAT_SERVICE_SID).channels(channelSid).messages.list().then(async (messages) => {
                let agentCount = 0;
                let clientCount = 0;
                let agentResponseTime = 0;          //Total time for agent to respond to each msg.
                let clientResponseTime = 0;         //Total time for the client to respond to each msg.
                let firstClientMessageTime = 0;     //Used to being Agent response time
                let lastClientMessageTime = 0;      //Used to calculate Agent Response Time
                                                        //(Agent Message - Last Clint time = Response Time)
                let agentFirstResponseTime = 0;     //Used for SLA
                let firstAgentMessageTime = 0;      //Used to begin Client Response Time
                let lastAgentMessageTime = 0;       //Use to Calculate Clinet Response Time

                // loop through each message in the conversation transcript
                await messages.forEach(message => {

                    // determine if the message was sent from the agent or from the client
                    // the thinking here is that if we detect realpage or twilio in the message.from field its from the agent
                    // the value of the from in an agent field could be something like: jfischelli_40twilio_2Ecom
                    // or mike.brennan_40twilio_2Ecom
                    if(message.from.match(/_2E|twilio/gmi)) {

                        // this was an agent message so increment its count
                        agentCount++;
                        lastAgentMessageTime = (message.dateCreated.getTime() / 1000);

                        // if this is the first agent message
                        // we need to record its time stamp into a new field because its how we will calculate SLA
                        if(firstAgentMessageTime == 0){
                            firstAgentMessageTime = message.dateCreated.getTime() / 1000;
                            agentFirstResponseTime = (message.dateCreated.getTime() / 1000) - task.taskCreated;
                        }

                        // if the agent message is the first in the conversation the lastClientMessage time will be zero and we'll skip
                        // it in this iteration. only after we see our first client message are we interested in summing up agent response times
                        if (lastClientMessageTime !== 0) {

                            if (firstClientMessageTime == 0) {
                                firstClientMessageTime = task.lastReservationAccepted;
                                agentResponseTime += (message.dateCreated.getTime() / 1000) - firstClientMessageTime;
                            } else {
                                agentResponseTime += (message.dateCreated.getTime() / 1000) - lastClientMessageTime;
                            }
                            // set lastClientMessage back to 0
                            lastClientMessageTime = 0;
                        }
                    } else {
                        // assume this is a client message and increment
                        clientCount++;

                        // record the last timestamp of the last client message we saw
                        lastClientMessageTime = (message.dateCreated.getTime() / 1000);
                        if (lastAgentMessageTime !== 0) {
                            clientResponseTime += (message.dateCreated.getTime() / 1000) - lastAgentMessageTime;
                            // set lastClientMessage back to 0
                            lastAgentMessageTime = 0;
                        }
                    }

                })

                task.agentFirstResponseTime = agentFirstResponseTime;
                task.agentTotalResponseTime = agentResponseTime;
                task.clientTotalResponseTime = clientResponseTime;
                task.agentMessageCount = agentCount;
                task.clientMessageCount = clientCount;
                task.save(async () => {
                    return true;
                });
            }).catch(err => {
                console.log(err);
                throw new Error(err);
            })
        });

    }
  }
}
