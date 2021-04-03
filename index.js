var Discord = require('discord.js');
var config = require('./config.json');
var songsData = require('./songs.json');
var categories = songsData.categories;
var songs = getSongsFromData(categories);
var commandsData = require('./commands.json');
commandsData = commandsData.commands;
var bot = new Discord.Client();
const { Player } = require("discord-music-player");
const player = new Player(bot);
bot.player = player;
let commands = commandsData.map(c => c.command);
let descriptions = commandsData.map(c => c.description);

bot.on('guildCreate', guild => {
  const channel = guild.channels.cache.find(channel => channel.type === 'text' && channel.permissionsFor(guild.me).has('SEND_MESSAGES'))
  channel.send("Thanks for inviting me")
})

bot.on("ready", () => {
  console.log("I am ready to Play with DMP 🎶");
});

bot.player.on('songAdd',  (message, queue, song) =>
    message.channel.send(`**${song.name}** has been added to the queue!`))
    .on('songFirst',  (message, song) =>
        message.channel.send(`**${song.name}** is now playing!`));

bot.on('message', async (message) => {
  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(getKeyWord('!help', message.content)){
    let content = message.content.split(" ")[1];
    if(commands.includes(content)){
      let description = descriptions[commands.indexOf(content)];
      message.channel.send(`The ${content} command: \n ${description}`);
    }else{
      message.channel.send("Command not found for " + content + ". \n Type `$help` to see all command names");
    }

    return;
  }

  if(command == "play"){
    console.log("playing");
    let song = await bot.player.play(message, args.join(' '));
        
    // If there were no errors the Player#songAdd event will fire and the song will not be null.
    if(song)
        console.log(`Started playing ${song.name}`);
    return;
  }

  if(getKeyWord(('!search'), message.content)){
    console.log("searching")
    message.channel.send(listSearchResults(soundSearch(message.content)));
    return;
  }

  if(getKeyWord('!sound', message.content)){
    let content = message.content.split(" ")[1];
    let contentArray = message.content.split(" ");
    let refinedContent = contentArray.slice(1, contentArray.length);
    content = refinedContent.join(" ");
    // check all songs - compile early
    if(matchSongByName(content)){
      console.log("playing");
      if(bot.player.isPlaying(message)) {
        console.log("add to queue")
        let song = await bot.player.addToQueue(message, args.join(' '));
        if(song) console.log(`Added ${song.name} to the queue`);
        return;
    } else {
        let song = await bot.player.play(message, args.join(' '));
        if(song) console.log(`Started playing ${song.name}`);
        return;
     }
    }
    // check categories - compile early
    if(matchCategoryByName(content)){
      message.channel.send(listCategorySongs(content));
      return;
    }
    message.channel.send("Command not found for " + content + ". \n Type `$help` to see all command names");
    return;
  }

  let song;
  switch(command){
    
    case 'help':
      message.channel.send(listCommands());
    break;

    case 'categories':
      message.channel.send(listCategories());
    break;

    case 'pause':
      song = client.player.pause(message);
      if(song){
        message.channel.send(`${song.name} was paused!`);
      }  
    break;


    case 'resume':
      song = client.player.resume(message);
      if(song){
        message.channel.send(`${song.name} was resumed!`);
      }  
    break;
  
    case 'play':
      // playCommand(message);
      if(bot.player.isPlaying(message)) {
        console.log("add to queue")
        let song = await bot.player.addToQueue(message, args.join(' '));
        if(song) console.log(`Added ${song.name} to the queue`);
        break;
    } else {
        let song = await bot.player.play(message, args.join(' '));
        if(song) console.log(`Started playing ${song.name}`);
        break;
     }

  }
});


bot.login(config.token);

// Helper Functions

async function playCommand(message){
  if(bot.player.isPlaying(message)) {
    console.log("add to queue")
    let song = await bot.player.addToQueue(message, args.join(' '));

    // If there were no errors the Player#songAdd event will fire and the song will not be null.
    if(song)
        console.log(`Added ${song.name} to the queue`);
    return;
} else {
    let song = await bot.player.play(message, args.join(' '));

    // If there were no errors the Player#songAdd event will fire and the song will not be null.
    if(song)
        console.log(`Started playing ${song.name}`);
    return;
}
}

function getKeyWord(keyword, command){
  let split = command.split(" ");
  if(split[0] == keyword && split.length > 1){
    return true;
  }

  return false;
}

function getSongsFromData(data){
  let songs = [];
  data.forEach((category) => {
    Array.prototype.push.apply(songs,category.songs); 
  })
  return songs;
}

// lowercase and remove emoji for user song and category name input
// this makes searching for the category or song more accurate and efficent
function purifyInput(input){
  let removeEmojiString = input.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '');
  let lowercase = removeEmojiString.replace(/\s/g, "").toLowerCase();
  return lowercase;
}

function getSongsForCategory(category){

}

function listCategories(){
  let text = "Categories:";
  categories.forEach((category) => {text = text.concat(` \n\n ${category.emoji}  ${category.name}`)})
  text = text.concat("\n\n To see songs within a category type `$song [category_name]");
  return text;
}

function listCommands(){
  let text = "Here is a list of my commands: ";
  commands.forEach((command) => { text = text.concat(` \n ${command}`)});
  text = text.concat(" \n \n You can send `$help [command name]` to get info on a specific command!")
  return text;
}


function soundSearch(input){
  let soundContent = input.split(" ")[1];
  let contentArray = input.split(" ");
  let refinedContent = contentArray.slice(1, contentArray.length);
  soundContent = refinedContent.join(" ");
  let purifiedSoundContent = purifyInput(soundContent);
  const filteredSounds = songs.filter(song => {
    return (
      song.name.toLowerCase().includes(purifiedSoundContent) ||
      song.name.toLowerCase().includes(purifiedSoundContent)
    );
  });
  return [filteredSounds, soundContent]
}

function listSearchResults(searchResultOutput){
  let text = `Search Results for ${searchResultOutput[1]}: \n`;
  let results = searchResultOutput[0];
  results.forEach((result) => {
    text = text.concat(`- ${result.name} \n`);
  })
  text = text.concat("\n To play a specific sound type: \n `$sound [sound_name]` \n or \n `$sound [category_name] [sound_index]`");
  return text;
}

function listCategorySongs(content){
  let matchedCategory = matchCategoryByName(content);
  let text = `${matchedCategory.emoji}  Sounds for ${matchedCategory.name} category: `;
  let count = 1;
  matchedCategory.songs.forEach((song) => {text = text.concat(` \n\n ${count})  ${song.name}`); count++})
  text = text.concat("\n\n To play a specific sound type: \n `$sound [sound_name]` \n or \n `$sound [category_name] [sound_index]`");
  return text;
}

function matchSongByName(title){
  let purifiedTitle = purifyInput(title);
  for(let song of songs){
    let purifiedSongName = purifyInput(song.name);
    if(purifiedSongName == purifiedTitle){
      return true;
    }
  }
  return false;
}

function matchCategoryByName(name){
  let purifiedInput = purifyInput(name);

  for(let category of categories){
    let categoryName = category.name.toLowerCase();
    if(categoryName == purifiedInput){
      return category;
    }
  }

  return false;
}

