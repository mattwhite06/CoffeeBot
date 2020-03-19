// Run dotenv
require('dotenv').config();

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => 
{
    console.log(`Logged in as ${client.user.tag}!`);
    setInterval(tick, 1000 * 60);
});

client.login(process.env.DISCORD_TOKEN);

client.on('message', msg => {
    if (msg.content === 'ping') {
      msg.reply('coffee!!');
    }
  });

function tick()
{
    coffeeTime();
}

function coffeeTime()
{
    client.channels.get("General").send("TEST");
}
