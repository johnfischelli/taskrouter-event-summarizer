'use strict';
module.exports = (sequelize, DataTypes) => {
  const WorkerChannel = sequelize.define('WorkerChannel', {
    sid: { type: DataTypes.STRING, primaryKey: true, unique: true },
    workerSid: DataTypes.STRING,
    taskChannelUniqueName: DataTypes.STRING,
    taskChannelSid: DataTypes.STRING,
    available: DataTypes.BOOLEAN,
    configuredCapacity: DataTypes.INTEGER
  }, {});
  WorkerChannel.associate = function(models) {
    WorkerChannel.belongsTo(models.Worker, { foreignKey: 'workerSid', targetKey: 'workerSid' });
  };
  return WorkerChannel;
};