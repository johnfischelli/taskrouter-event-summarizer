'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Workers', {
      accountSid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      workspaceSid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      workerSid: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.STRING
      },
      workerName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      currentActivity: {
        allowNull: false,
        type: Sequelize.STRING
      },
      currentActivitySid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      currentActivityAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      previousActivity: {
        allowNull: false,
        type: Sequelize.STRING
      },
      previousActivitySid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      timeInPreviousActivity: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      workerAttributes: {
        type: Sequelize.JSONB
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable('Workers');
  }
};