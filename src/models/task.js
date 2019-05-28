'use strict';
module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define('Task', {
    sid: { type: DataTypes.STRING, primaryKey: true, unique: true },
    accountSid: DataTypes.STRING,
    workspaceSid: DataTypes.STRING,
    workerSid: DataTypes.STRING,
    workerName: DataTypes.STRING,
    taskQueueSid: DataTypes.STRING,
    taskQueueName: DataTypes.STRING,
    taskQueueTargetExpression: DataTypes.STRING,
    taskChannelUniqueName: DataTypes.STRING,
    taskAssignmentStatus: DataTypes.STRING,
    age: DataTypes.INTEGER,
    taskCreated: DataTypes.INTEGER,
    taskPriority: DataTypes.INTEGER,
    taskAttributes: DataTypes.STRING,
    answeredIn: DataTypes.INTEGER,
    acwStart: DataTypes.INTEGER,
    totalTime: DataTypes.INTEGER,
    withinSLA: DataTypes.BOOLEAN,
    direction: DataTypes.STRING,
    reservationCount: DataTypes.INTEGER,
    agentMessageCount: DataTypes.INTEGER,
    clientMessageCount: DataTypes.INTEGER,
    agentTotalResponseTime: DataTypes.INTEGER,
    clientTotalResponseTime: DataTypes.INTEGER,
    ucProcessingTime: DataTypes.INTEGER,
    twilioRoutingTime: DataTypes.FLOAT,
    agentAcceptanceTime: DataTypes.INTEGER,
    agentFirstResponseTime: DataTypes.INTEGER,
    totalAcceptanceTime: DataTypes.INTEGER,
    lastReservationCreated: DataTypes.INTEGER,
    lastReservationAccepted: DataTypes.INTEGER
  }, {});
  Task.associate = function(models) {
    // associations can be defined here
  };
  return Task;
};