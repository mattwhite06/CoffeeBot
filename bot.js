require('dotenv').config();

const Discord = require('discord.js');
const Tenor = require('tenorjs').client({
  'Key': process.env.TENOR_API_KEY,
  'Filter': 'medium',
  'Locale': 'en_GB',
  'MediaFilter': 'minimal',
  'DateFormat': 'D/MM/YYYY  H:mm:ss A'
});


var schedule = require('node-schedule');
var client = new Discord.Client();

var channel = null;
var job = null;
var honk = null;

var rightNow = false;

client.on('ready', () => 
{
    console.log('Logged in as ' + client.user.tag + '!');

    channel = client.channels.cache.find( channel => channel.name == 'general');
    if (channel != null)
    {
      var rule = new schedule.RecurrenceRule();
      rule.dayOfWeek = [1, 2, 3, 4, 5]; // Mon-Fri
      rule.hour = 15;
      rule.minute = 0;

      job = schedule.scheduleJob('CoffeeTimeReminder', rule, function() {
          coffeeTime();
        });

      if (job == null)
      {
        console.log('Failed to start CoffeeTimeReminder job.');
        client.destroy();
        return;
      }
    
      client.user.setActivity(', Waiting...', { type: 'WATCHING' });
      honk = client.emojis.cache.find( emoji => emoji.name == 'honk');
    }
  });

client.login(process.env.DISCORD_TOKEN);

function coffeeTime() {
  channel.send('@here Coffee time? :coffee:');
  coffeeGifMsg('coffee');
  rightNow = true;    // prime check

  schedule.scheduleJob('ISaidRightNow', new Date(Date.now() + 60000), function() {
    if (rightNow) {
      channel.send('@here I SAID RIGHT NOW!!');
    }
  });
}

function coffeeGifReply(msg, args) {
  Tenor.Search.Random(args, 1).then(Results => {
      Results.forEach(Post => {
          msg.reply(Post.url);
        });
      }).catch(console.error());
}

function coffeeGifMsg(args) {
  if (channel != null)
  {
    Tenor.Search.Random(args, 1).then(Results => {
        Results.forEach(Post => {
          channel.send(Post.url);
          });
        }).catch(console.error());
  }
}

function onCommand(msg) {
  var command  = msg.content.toLowerCase();
  if (command.startsWith('!coffeetime')) {
    if (job != null) {
      msg.reply('The next scheduled CoffeeTime is ' + job.nextInvocation());
    }
    else {
      msg.reply('There is currently no next scheduled CoffeeTime...   PANIC!');
    }
  }
  else if(command.startsWith('!coffeenow')) {
    coffeeTime();
  }
  else if(command.startsWith('!coffeegif')) {
    var args = command.slice(11).trim();
    if (args.length == 0) {
      //  default to coffee gifs
      args = 'coffee';
    }
    coffeeGifReply(msg, args);
  }
}

client.on('message', msg => {
  if (!msg.author.bot)
  {
    rightNow = false;   // someone responded, no need to ask again

    if (msg.content.startsWith('!')) {
      onCommand(msg);
    }
    else {
        if (msg.content.toLowerCase().includes('coffee')) {
          if (msg.author.tag === 'CitrusySteve#5217') {   // security check  :D
              msg.reply('Heretic!');
          }
          else {
            msg.react('☕');
          }
        }

        if (msg.content.toLowerCase().includes('honk')) {
          msg.react(honk.id);
        }

        if (msg.author.tag === 'EviK#5094')
        { 
            if (msg.content.toLowerCase().includes('matthew'))
            {
              msg.reply('You mean Matt, not Matthew?');
            }
            if (msg.content.toLowerCase().includes('mathew'))
            {
              msg.reply('You mean Matt, not Mathew?');
            }
        }
      }
    }
  });