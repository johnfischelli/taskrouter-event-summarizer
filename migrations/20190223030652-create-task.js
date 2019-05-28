'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Tasks', {
      sid: {
        allowNull: false,
        primaryKey: true,
        unique: true,
        type: Sequelize.STRING
      },
      accountSid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      workspaceSid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      workerSid: {
        type: Sequelize.STRING
      },
      workerName: {
        type: Sequelize.STRING
      },
      taskQueueSid: {
        allowNull: false,
        type: Sequelize.STRING
      },
      taskQueueName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      taskQueueTargetExpression: {
        allowNull: false,
        type: Sequelize.STRING
      },
      taskChannelUniqueName: {
        allowNull: false,
        type: Sequelize.STRING
      },
      taskAssignmentStatus: {
        allowNull: false,
        type: Sequelize.STRING
      },
      age: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      taskCreated: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      taskPriority: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      taskAttributes: {
        allowNull: false,
        type: Sequelize.JSONB
      },
      answeredIn: {
        type: Sequelize.INTEGER
      },
      acwStart: {
        type: Sequelize.INTEGER
      },
      totalTime: {
        type: Sequelize.INTEGER
      },
      withinSLA: {
        type: Sequelize.BOOLEAN
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
    return queryInterface.dropTable('Tasks');
  }
};