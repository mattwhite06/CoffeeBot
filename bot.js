require('dotenv').config();

const Discord = require('discord.js');
var schedule = require('node-schedule');
var client = new Discord.Client();
var channel = null;

client.on('ready', () => 
{
    console.log(`Logged in as ${client.user.tag}!`);

    channel = client.channels.cache.find( channel => channel.name == "general");
    if (channel != null)
    {
      var rule = new schedule.RecurrenceRule();
      rule.dayOfWeek = schedule.Range(1,5); // Mon-Fri
      rule.hour = 15;
      rule.minute = 0;

      var j = schedule.scheduleJob(rule, function() {
          channel.send("Coffee time? :coffee:");
        });
      channel.send("CoffeeBot reporting for coffee reminding duty! :coffee:");
    }
  });

client.login(process.env.DISCORD_TOKEN);

client.on('message', msg => {
    if (!msg.author.bot)
    {
      if (msg.content.includes('coffee')) {
        msg.react('☕');
     }
    }
  });