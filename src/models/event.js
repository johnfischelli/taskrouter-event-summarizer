'use strict';
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    accountSid: DataTypes.STRING,
    workspaceSid: DataTypes.STRING,
    eventType: DataTypes.STRING,
    data: DataTypes.JSONB,
    taskSid: DataTypes.STRING
  }, {});
  Event.associate = function(models) {
    // associations can be defined here
  };
  return Event;
};