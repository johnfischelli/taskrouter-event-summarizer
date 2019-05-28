'use strict';

const Sequelize = require('sequelize');

const cols = [
  {
    name: 'accountSid',
    type: Sequelize.STRING,
  },
  {
    name: 'workspaceSid',
    type: Sequelize.STRING,
  },
  {
    name: 'workerSid',
    type: Sequelize.STRING,
  },
  {
    name: 'workerName',
    type: Sequelize.STRING,
  },
  {
    name: 'taskQueueSid',
    type: Sequelize.STRING,
  },
  {
    name: 'taskQueueName',
    type: Sequelize.STRING,
  },
  {
    name: 'taskQueueTargetExpression',
    type: Sequelize.STRING,
  },
  {
    name: 'taskChannelUniqueName',
    type: Sequelize.STRING,
  },
  {
    name: 'taskAssignmentStatus',
    type: Sequelize.STRING,
  },
  {
    name: 'age',
    type: Sequelize.INTEGER,
  },
  {
    name: 'taskCreated',
    type: Sequelize.INTEGER,
  },
  {
    name: 'taskPriority',
    type: Sequelize.INTEGER,
  },
  {
    name: 'taskAttributes',
    type: Sequelize.JSONB,
  },
  {
    name: 'answeredIn',
    type: Sequelize.INTEGER,
  },
  {
    name: 'acwStart',
    type: Sequelize.INTEGER,
  },
  {
    name: 'totalTime',
    type: Sequelize.INTEGER,
  },
  {
    name: 'withinSLA',
    type: Sequelize.BOOLEAN,
  }
];

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await asyncForEach(cols, async (col) => {
        await queryInterface.changeColumn("Tasks", col.name, {
          type: col.type,
          allowNull: true
        });
      })
      return Promise.resolve();
    } catch(e) {
      return Promise.reject();
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await asyncForEach(cols, async (col) => {
        await queryInterface.changeColumn("Tasks", col.name, {
          type: col.type,
          allowNull: false
        });
      })
      return Promise.resolve();
    } catch(e) {
      return Promise.reject();
    }
  }
};
