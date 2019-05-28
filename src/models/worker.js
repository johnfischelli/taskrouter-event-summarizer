'use strict';
module.exports = (sequelize, DataTypes) => {
  const Worker = sequelize.define('Worker', {
    accountSid: DataTypes.STRING,
    workspaceSid: DataTypes.STRING,
    workerSid: { type: DataTypes.STRING, primaryKey: true, unique: true },
    workerName: DataTypes.STRING,
    currentActivity: DataTypes.STRING,
    currentActivitySid: DataTypes.STRING,
    currentActivityAvailable: DataTypes.BOOLEAN,
    previousActivity: DataTypes.STRING,
    previousActivitySid: DataTypes.STRING,
    timeInPreviousActivity: DataTypes.INTEGER,
    workerAttributes: DataTypes.JSONB
  }, {});
  Worker.associate = function(models) {
    Worker.hasMany(models.WorkerChannel, { foreignKey: 'workerSid', sourceKey: 'workerSid' });
  };
  return Worker;
};