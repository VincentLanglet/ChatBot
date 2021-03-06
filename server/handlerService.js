var chatService    = require('../server/chatService');
var weatherService = require('../server/weatherService');
var userService    = require('../server/userService');

var availableStatus = ['chat', 'météo'];

/**
 * @param {object} entry
 * @param {object} event
 */
function handleMessage(entry, event) {
  var senderId = event.sender.id;

  if (!userService.isUserKnown(senderId)) {
    handleFirstMessage(entry, event);
  } else {
    var user    = userService.getUser(senderId);
    var message = event.message;

    if (!handleQuickCase(senderId, message)) {
      switchCase(user.status, senderId, message);
    }
  }
}

/**
 * @param {object} entry
 * @param {object} event
 */
function handleFirstMessage(entry, event) {
  var timeOfEvent = entry.time;
  var senderId    = event.sender.id;

  userService.addUser(senderId, {
    id: senderId,
    createdAt: timeOfEvent,
    status: 'chat'
  });

  chatService.sendTextMessage(senderId, 'Bonjour', function() {
    handleMessage(entry, event);
  });
}

/**
 * @param {int}    senderId
 * @param {object} message
 *
 * @returns boolean
 */
function handleQuickCase(senderId, message) {
  if (typeof message.text !== 'string') {
    return false;
  }

  var arrayOfMessage = message.text.split(' ');

  if (arrayOfMessage.length > 1) {
    var action = arrayOfMessage[0].toLowerCase();
    var status = arrayOfMessage[1].toLowerCase();

    switch (action) {
      case 'service':
        // Remove action and status
        arrayOfMessage.splice(0, 2);

        switchCase(status, senderId, { text: arrayOfMessage.join(' ') });

        return true;
      case 'statut':
        if (availableStatus.indexOf(status) !== -1) {
          userService.changeUserStatus(senderId, status);
          chatService.sendTextMessage(senderId, 'Nouveau statut "' + status + '"');
        } else {
          chatService.sendTextMessage(senderId, 'Le statut "' + status + '" est inconnu');
        }

        return true;
    }
  }

  return false;
}

/**
 * @param {string} status
 * @param {int}    senderId
 * @param {object} message
 */
function switchCase(status, senderId, message) {
  switch (status) {
    case 'chat':
      chatService.handleChatCase(senderId, message);
      break;
    case 'météo':
      weatherService.handleWeatherCase(senderId, message);
      break;
    default:
      chatService.sendTextMessage(senderId, 'Le statut "' + status + '" est inconnu');
  }
}

module.exports = {
  handleMessage: handleMessage
};
