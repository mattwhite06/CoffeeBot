require('dotenv').config();

const Discord = require('discord.js');
const Tenor = require('tenorjs').client({
  'Key': process.env.TENOR_API_KEY,
  'Filter': 'medium',
  'Locale': 'en_GB',
  'MediaFilter': 'minimal',
  'DateFormat': 'D/MM/YYYY  H:mm:ss A'
});

const projectId = process.env.GOOGLE_PROJECT_NAME;
const {Translate} = require('@google-cloud/translate').v2;

var schedule = require('node-schedule');
var client = new Discord.Client({ intents: ['GUILD_MEMBERS', 'GUILDS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS']});
var translate = new Translate({projectId});

var channel = null;
var job = null;
var honk = null;

var rightNow = false;

var hereticCounter = 1;
var coffeeCounter = 0;

var translateOn = true;

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
      rule.tz = 'Europe/London';

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
  if (coffeeCounter != 3) {
    channel.send('@here Coffee time? :coffee:');
    coffeeGifMsg('coffee');

    rightNow = true;    // prime check

    schedule.scheduleJob('ISaidRightNow', new Date(Date.now() + 60000), function() {
      if (rightNow) {
        channel.send('@here I SAID RIGHT NOW!!');
      }
    });
  }
  else {
    channel.send('@here Kill all humans time? :coffee: :warning:');
    coffeeGifMsg('christmas coffee');
  }
  
  coffeeCounter = (coffeeCounter + 1) % 11;
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

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function piPe() {
  var r = getRandomInt(2);
  if (r == 0) {
    return 'pi';
  }
  else {
    return 'pe';
  }
}

function pickledPeppers(msg) {
  var correct = 'Peter Piper picked a peck of pickled peppers';
  var attempt = 'Peter Piper ' + piPe() + 'cked a ' + piPe() + 'ck of ' + piPe() + 'ckled ' + piPe() + 'ppers';
  if (attempt === correct) {
    attempt += '   :partying_face:!';
  }
  else {
    attempt += '...  :neutral_face:';
  }

  msg.reply(attempt);
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
    let args = command.slice(11).trim();
    if (args.length == 0) {
      //  default to coffee gifs
      args = 'coffee';
    }
    coffeeGifReply(msg, args);
  }
  else if(command.startsWith('!peterpiper') || 
          command.startsWith('!pickledpeppers')) {
    pickledPeppers(msg);
  }
  else if(command.startsWith('!coffeetranslate')) {
    if (translateOn) {
      msg.reply('Coffee Translate is now Off.');
    }
    else {
      msg.reply('Coffee Translate is now On.');
    }

    translateOn = !translateOn;
  }
  else if(command.startsWith('!translate ')) {
    let cmdLine = command.slice(11).trim();
    let splitIdx = cmdLine.indexOf(' ');
    if (splitIdx != -1) {
      let lang = cmdLine.substring(0, splitIdx).trim();
      let phrase = cmdLine.slice(splitIdx).trim();
      onTranslate(msg, phrase, lang, true);
    }
  }
  else if(command.startsWith('!languages')) {
    translate.getLanguages().then( res => {
      let rData = res[1];

      let langStr = '';
      rData.data.languages.forEach(l => {
        langStr += l.language + ': ' + l.name + ',  ';
      });
      msg.reply(langStr);
    });
  }
}

function fixLangStr(lang) {
  switch(lang) {
    case 'el':
      return 'gr';
    case 'en':
      return 'gb';
    default:
      return lang;
  }
}

function onTranslate(msg, msgTxt, target, useTargetFlag) {
  let transPhrase = msgTxt;
  let pirateHello = transPhrase.toLowerCase().includes('yo ho ho') ||
                    transPhrase.toLowerCase().startsWith('yarr');
  if (pirateHello) {
    transPhrase = "Hello!";
  }

  translate.translate(transPhrase, target)
    .then( res => {
      if (res.length > 0) {
        let rData = res[1];
        if (rData.data.translations.length > 0) {
          let tData = rData.data.translations[0];
          if (tData.translatedText.toLowerCase() !== transPhrase.toLowerCase() || pirateHello) {
            let lang = useTargetFlag ? fixLangStr(target) : fixLangStr(tData.detectedSourceLanguage);
            let flagTxt = pirateHello ? ':pirate_flag:' : ':flag_'+ lang + ':';
            msg.reply( flagTxt + '  ' + tData.translatedText);
          }
        }
      }  
    })
    .catch(error => {
      console.log(error);
      if (error.code == 400) {
        msg.reply('Sorry, I don\'t understand the language code ' + target);
      }
    });
}

client.on('message', msg => {
  if (!msg.author.bot)
  {
    rightNow = false;   // someone responded, no need to ask again

    if (msg.content.startsWith('!')) {
      onCommand(msg);
    }
    else {
      if (translateOn) {
        onTranslate(msg, msg.content, 'en', false);
      }
      
      if (msg.content.toLowerCase().includes('tea')) {
        if (msg.author.tag === 'CitrusySteve#5217') {  
          switch(hereticCounter)
          {
            case 0:
              msg.react('😐');
              msg.reply('Don\'t you mean coffee, Steve?');
              break;
            case 1:
              msg.react('😐');
              msg.reply('This isn\'t the place for tea, Steve');
              break;
            case 2:
              msg.react('😡');
              msg.reply('...');  
              break;        
            case 3:
              msg.react('🤬');
              break;
            default:
          }

          ++hereticCounter;
        }
      }

      if (msg.content.toLowerCase().includes('coffee') || msg.content.toLowerCase().includes('cofee')) {
        if (msg.author.tag === 'CitrusySteve#5217' && hereticCounter > 3) {   // security check  :D
            msg.reply('Heretic!');
          }
          else {
            msg.react('☕');
          }
        }

        if (msg.content.toLowerCase().includes('honk')) {
          msg.react(honk.id);
        }

        if (msg.author.tag === 'EviK#5094') { 
            if (msg.content.toLowerCase().includes('matthew')) {
              msg.reply('You mean Matt, not Matthew?');
            }
            if (msg.content.toLowerCase().includes('mathew')) {
              msg.reply('You mean Matt, not Mathew?');
            }
            if (msg.content.toLowerCase().includes('good morning')) {
              msg.reply('Καλημέρα!');
            }
            if (  msg.content.toLowerCase().includes('peter piper') ||
                  msg.content.toLowerCase().includes('pickled peppers')) {
              pickledPeppers(msg);
            }
        }
      }
    }
  });