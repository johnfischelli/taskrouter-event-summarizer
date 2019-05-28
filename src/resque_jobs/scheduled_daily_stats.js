const path          = require("path"),
      fs            = require('fs'),
      db            = require(path.resolve(__dirname+'/../models/index')),
      twilio        = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN),
      sync          = require(path.resolve(__dirname+'/../helpers/twilio/sync'));

 const DailyData =  {
        AgentMessageCount: 0,
        AgentTotalResponseTime: 0,
        AverageAgentResponseTime: 0,
        SlaChatPercentage: 0,
        TotalChatMessages: 0,
        ChatServiceCount: 0,
        VoiceServiceCount: 0,
        SlaVoicePercentage: 0,
        TotalVoiceMessages: 0,
        TotalAgentsAvailable: 0
      };

module.exports = {
  queue: "scheduled.daily.stats",
  job: {
    perform: async () => {
      let sql = "\
        select sum(\"agentTotalResponseTime\") as \"agentTotalResponseTime\",\
        sum(\"agentMessageCount\") as \"agentMessageCount\",\
        (cast(sum(\"agentTotalResponseTime\") as decimal)/NULLIF(sum(\"agentMessageCount\"), 0)) as \"averageAgentResponseTime\"\
        from \"Tasks\"\
        where \"taskChannelUniqueName\" = \'chat'\
      ";

      await db.sequelize.query(sql).then(([results, metadata]) => {

        DailyData.AgentMessageCount = parseInt(results[0].agentMessageCount);
        DailyData.AgentTotalResponseTime = parseFloat(results[0].agentTotalResponseTime).toPrecision(2);
        DailyData.AverageAgentResponseTime = parseFloat(results[0].averageAgentResponseTime).toPrecision(2);

      });

      let sql2 = "\
      select count(*)  as \"TotalMessages\" from \"Tasks\"\
      where \"taskChannelUniqueName\" = \'chat'\
      ";

      await db.sequelize.query(sql2).then(([results, metadata]) => {

        DailyData.TotalChatMessages = parseInt(results[0].TotalMessages);

      });

      let sql3 = "\
      with cte as (select sid, \"taskChannelUniqueName\", sum(\"ucProcessingTime\" + \"agentFirstResponseTime\") as \"TotalResponse\"\
      from \"Tasks\"\
      where \"taskChannelUniqueName\" = 'chat' group by sid, \"taskChannelUniqueName\")\
      select count(*) as \"ServiceCount\" from cte where \"TotalResponse\" < 30\
      and \"taskChannelUniqueName\" = 'chat'\
      ";
      await db.sequelize.query(sql3).then(([results, metadata]) => {
        DailyData.ChatServiceCount = parseInt(results[0].ServiceCount);

        if(DailyData.TotalChatMessages > 0)
        {
          DailyData.SlaChatPercentage = (parseFloat((DailyData.ChatServiceCount / DailyData.TotalChatMessages) * 100).toPrecision(4));
        }

      });


      let sql5 = "\
      select count(*)  as \"TotalMessages\" from \"Tasks\"\
      where \"taskChannelUniqueName\" = \'voice'\
      ";

      await db.sequelize.query(sql5).then(([results, metadata]) => {

        DailyData.TotalVoiceMessages = parseInt(results[0].TotalMessages);

      });

      let sql4 = "\
      with cte as (select sid, \"taskChannelUniqueName\", sum(\"ucProcessingTime\" + \"agentFirstResponseTime\") as \"TotalResponse\"\
      from \"Tasks\"\
      where \"taskChannelUniqueName\" = 'voice' group by sid, \"taskChannelUniqueName\")\
      select count(*) as \"ServiceCount\" from cte where \"TotalResponse\" < 25\
      and \"taskChannelUniqueName\" = 'voice'\
      ";
      await db.sequelize.query(sql4).then(([results, metadata]) => {
        DailyData.VoiceServiceCount = parseInt(results[0].ServiceCount);

        if(DailyData.TotalVoiceMessages > 0)
        {
          DailyData.SlaVoicePercentage = (parseFloat((DailyData.VoiceServiceCount / DailyData.TotalVoiceMessages) * 100).toPrecision(4));
        }

      });

      let sql6 = "\
      select count(*) as \"TotalAvailableAgents\" from \"Workers\" where \"currentActivityAvailable\" = true";

      await db.sequelize.query(sql6).then(([results, metadata]) => {
        DailyData.TotalAgentsAvailable = parseInt(results[0].TotalAvailableAgents);

      });

      sync.createOrUpdateSyncDoc('DailyDashboard',DailyData).then(() => {
        return true;
      });

    }
  }
}
