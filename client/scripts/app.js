var username = "";
var app = {
  server: "http://127.0.0.1:3000/classes/messages",
  friends: {},
  rooms: {},
  init: function(){
    $('body').append('<div class="rooms" id="roomSelect"></div>');
    $('body').append('<div class="messages" id="chats"></div>');
    app.fetch();
  },
  send: function(message){
    console.log('message is ', message);
    var context = this;
    var msg = {
      'username': username,
      'text': message,
      'roomname': 'lobby',
      'updatedAt': new Date().toISOString()
    };
    $.ajax({
      url: context.server,
      type: 'POST',
      data: JSON.stringify(msg),
      contentType: 'application/json',
      success: function (data) {
        console.log('chatterbox: Message sent');
        app.fetch();
      },
      error: function (data) {
        console.error('chatterbox: Failed to send message');
      }
    });
  },
  fetch: function() {
    var context = this;
    $.ajax({
      url: context.server,
      type: 'GET',
      contentType: 'application/json',
      //data: "order=-createdAt",
      success: function (data) {
        console.log('chatterbox: Message received');
        context.readMessages(data);

      },
      error: function (data) {
        // see: https://developer.mozilla.org/en-US/docs/Web/API/console.error
        console.error('chatterbox: Failed to get message');
      }
    });
  },
  clearMessages: function() {
    $(".messages").empty();
  },
  addMessage: function(message){
    if (!message['updatedAt']) {
      message['updatedAt'] = new Date().toISOString();
    }
    if (!message['roomname']) {
      message['roomname'] = 'lobby';
    }
    message['roomname'] = _.escape(message['roomname']);
    if (!this.rooms[message['roomname']]){
      this.addRoom(message['roomname']);
    }
    if (this.rooms[message['roomname']].indexOf(message) === -1) {
      this.rooms[message['roomname']].push(message);
    }
    var msgBox =  $('<div></div>').addClass("message");
    if (message['username'] in this.friends){
      msgBox.addClass("friend");
    }
    //var user = $().add("<span>").addClass("user").text(message['username']);
    var user = $('<span class="user"></span>').text(message['username']);
    var context = this;
    user.on('click',function(){
      context.friends[message['username']] = true;
      $(".message:contains('"+message['username']+"')").addClass("friend");
    });
    msgBox.append(user);
    //msgBox.append($().add("<span>").addClass("time").text(message['updatedAt']));
    var updated = $('<span class="time"></span>').text(message['updatedAt']);
    msgBox.append(updated);
    //msgBox.append($().add("<p>").addClass("msgText").text(message['text']));
    var msgText = $('<p class="msgText"></p>').text(message['text']);
    msgBox.append(msgText);
    $(".messages").append(msgBox);
  },
  readMessages: function(messageObj, addRoom) {
    addRoom = addRoom || false;
    var messages = messageObj['results'];
    if (addRoom) {
      this.addMessage(messages[0]);
    }
    for (var i = 0; i < messages.length ; i++){
      this.addMessage(messages[i]);
    }
  },
  getUserName: function(URL) {
    var start = URL.search("username") + 9;
    return URL.slice(start);
  },
  addRoom: function(roomname) {
    var context = this;
    if (!this.rooms[roomname]) {
      this.rooms[roomname] = [];
      var roomBox = $("#roomSelect");
      var room = $().add("<span>").addClass("roomButton").attr('id',roomname).text(roomname);
      roomBox.append(room);
      room.on('click',function(room){
        var array = context.rooms[roomname];
        context.clearMessages();
        context.readMessages({'results':array}, true);
      });
    }
  }
};


$(document).ready(function() {
  username = prompt('Enter username');
  console.log("prompt test");
  app.init();
  $('#submit').on('click', function(e) {
    e.preventDefault();
    var msg = $('#text').val();
    app.send(msg);
    $('#text').val("");
  });
});







