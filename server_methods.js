/*
 *Function used to check wether a specific word needs a space in front of given word
 */
function needSpace(story, word) {
 	if(story.length === 0)
 		return false;

  word.replace(new RegExp('\"', 'g'), '"');

 	if(['.','!','?',',',':',';',')'].includes(word.charAt(0)))
 	return false;

 	if(story.endsWith('('))
 		return false;

 	if((story.match('"') || []).length%2 == 1 && word.startsWith('"'))
 		return false;

 	if((story.match('"') || []).length%2 == 1 && story.endsWith('"'))
 		return false;

 	return true;
}

function padWord(gameStatus, word){
 	let story = gameStatus.story;
 	if(needSpace(story, word))
 		return " " + word
 	return word;
}

function isBanned(gameStatus, word){
 	let story = gameStatus.story;
 	let bannedStrings = gameStatus.bannedStrings;
 	for (let i = 0; i < bannedStrings.length; i++) {
 		let string = story + word;
 		if(string.toUpperCase().indexOf(bannedStrings[i].toUpperCase()) !== -1)
 			return true;
 	}
 	return false;
}

function continueStory(gameStatus) {
  gameStatus.story += padWord(gameStatus, mostPopular(gameStatus.votingResult));
}

function mostPopular(map) {
  if(!map || !Object.keys(map).length) return "";
  let word = Object.keys(map).reduce((a, b) => map[a] > map[b] ? a : b);
  console.log('Word "' + word + '" was chosen');
  return word;
}

function addWordToVoting(gameStatus, uuid, word){
 	let story = gameStatus.story;
 	if(isBanned(gameStatus, word))
 		return;
 	gameStatus.votingQueue[uuid] = word;
}

function voteFor(gameStatus, uuid, id){
  let options = Object.keys(gameStatus.votingResult);
  if(uuid in gameStatus.votingQueue && gameStatus.votingQueue[uuid] === id) {
    return; //already voted for the same number
  } else if (id < 0 || id >= options.length) {
    return; //id too small / too big
  } else {
    gameStatus.votingResult[options[id]]++;
    if(uuid in gameStatus.votingQueue)
      gameStatus.votingResult[options[gameStatus.votingQueue[uuid]]]--;
    gameStatus.votingQueue[uuid] = id;
  }
}

function continueGame(gameStatus, switchStatus) {
  if(!switchStatus.scheduled) {
    console.log("Scheduling next game state switch");
    switchStatus.scheduled = true;
    setTimeout(function(gameStatus, switchStatus){
      toggle(gameStatus); switchStatus.scheduled = false;
    }, switchStatus.waitTime*1000, gameStatus, switchStatus);
    switchStatus.nextSwitch = Date.now() + switchStatus.waitTime*1000;
  }
}

function switchAble(gameStatus, switchStatus) {
  return (gameStatus.voting && Object.keys(gameStatus.votingQueue).length >= switchStatus.minimumVotes) ||
        (!gameStatus.voting && Object.keys(gameStatus.votingQueue).length >= switchStatus.minimumWords);
}

function toggle(gameStatus) {
  gameStatus.voting ^= true;
  if(gameStatus.voting) { //submitting is over
    for(let word of Object.values(gameStatus.votingQueue)) {
      if(!(word in gameStatus.votingResult))
        gameStatus.votingResult[word] = 0;
    }
    gameStatus.votingQueue = {};
  } else { //voting is over
    continueStory(gameStatus);
    reset(gameStatus, false);
  }
  console.log("Toggled game status. voting: " +
    (gameStatus.voting ? "true" : "false"));
}

function reset(gameStatus, hard) {
  if(hard){
    gameStatus.story = "";
    gameStatus.bannedStrings = {};
  }
  gameStatus.votingQueue = {};
  gameStatus.votingResult = {};
  gameStatus.voting = false;
}

module.exports = {
 	"needSpace": needSpace,
 	"padWord": padWord,
 	"isBanned": isBanned,
  "continueStory": continueStory,
  "mostPopular": mostPopular,
 	"addWordToVoting": addWordToVoting,
  "voteFor": voteFor,
  "continueGame": continueGame,
  "switchAble": switchAble,
  "toggle": toggle,
  "reset": reset
};
