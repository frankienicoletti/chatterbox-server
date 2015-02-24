$(document).ready(function(){
  var latestMessageDate;
  var currentRoom = "main room";
  var roomHolder = {};
  var userObj = {
    username:'',
    friends: {}
  };
  //set up init function to execute on load
  var init = function(latestDate,roomName,user){ // gets all messages currently found in server
    // console.log("currentRoom is ", currentRoom);
    // console.log("latestDate is ", latestDate);
    if( !userObj.username ){
      var temp = prompt('Select a username');

      userObj.username = sanitize(temp);
      $('.this-user').text(userObj.username);
    }
    var dataOptions = {
      order:'-createdAt',
      // where: { createdAt:{ $gte :{"__type":"Date","iso":"2015-02-17T20:06:47.133Z"}}}
    };
    if( latestDate ) {
      //console.log('latestDate is',latestDate);
      dataOptions.where = {createdAt:{$gt:{"__type":"Date","iso":""+ latestDate +""}}};
      if ( roomName && roomName !== "main room"){
      dataOptions.where.roomname = {"$in": [sanitize(roomName)]};
      }
    } else if (roomName && roomName !== "main room"){
      dataOptions.where = {roomname:{"$in": [sanitize(roomName)]}};
    }

    // if( roomName === "main room" || roomName === "Main room" ) {
    //   delete dataOptions["where"];
    // }
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'GET',
      data: dataOptions,
      //contentType: 'application/json',
      dataType: 'json',
      success: function (data) {
        displayMessagesAndRooms(data);
        //set rooms
      },
      error: function (data) {
        console.error(data,' failed');
      }
    });
  };

  var sanitize = function(str) {
    if( str === undefined ) { return ""; }
    var mapObj = {
       '&':'&amp;',
       '<':'&lt;',
       '>':'&gt;',
       '"':'&quot;',
       "'":'&#x27;',
       '/':'&#x2F;'
    };
    // if(currentRoom !== "main room"){
    //   debugger;
    // }
    str = str.replace(/[&<>"'\/]/g, function(matched){
      return mapObj[matched];
    });
    return str;
  };

  var nextMessageDiv = function(nextMessageObj) {
    var $newMessage = $("<div></div>");
    if(nextMessageObj.username){
      var sanitizedUsername = sanitize(nextMessageObj.username);
    }
    if(nextMessageObj.text){
      var sanitizedText = sanitize(nextMessageObj.text);
    }
    var messageText = "<p><a class='message-user'>"+sanitizedUsername+"</a>" +  "   <span class='message-date'>" +nextMessageObj.createdAt+"</span><br><span class='message-text'>" + sanitizedText +"</span></p>";
    var parsedMessage = $.parseHTML(messageText);
    return $newMessage.html(parsedMessage);
  };

  var newMessageIterator = function(arrayOfData) {
    //iterates from end of array to get newest messages
    //put contents of obj data into a div for future appendage
    var $divHolder = $("<div></div>");
      arrayOfData = arrayOfData.reverse();
      _.each(arrayOfData,function(messageObj,index){
        var thisMessage = nextMessageDiv(messageObj);
        $divHolder.append(thisMessage);
        //add new rooms to roomHolder
        var thisRoom = messageObj.roomname;
        if( !roomHolder[thisRoom] && thisRoom !== undefined && thisRoom !== null && thisRoom.length > 0 ) {
          roomHolder[thisRoom] = thisRoom;
          var newOption = $('<option></option>');
          $(newOption).attr('name', thisRoom).val(thisRoom).text(thisRoom);
          $('.room-select').append(newOption);
        }
      });
    return $divHolder;
  };

  //display messages from the ajax call, will display new messages only if
  //there are already existing message
  var displayMessagesAndRooms = function(obj){
    var arrayOfData = obj.results;
    var length = arrayOfData.length;
    var $divHolder = newMessageIterator(arrayOfData);
    var divHolderContents = $divHolder.html();
    $('.message_display').append(divHolderContents);
    if( arrayOfData[0] ) {
      //console.log("arrayOfData true", arrayOfData[length-1]);
      latestMessageDate = arrayOfData[length-1].createdAt;
      //console.log("latestMessageDate is ", latestMessageDate);
    } else {
      //console.log("arrayOfData false", arrayOfData[0]);
    }
    if( $('.message_display').children().length === 0 ) {
      $('.message_display').text('Sorry, no messages to display');
    }
    //set event listener on users in the message list (to be able to friend)
    wrapperForFriend();
  };



  //setting up functionality for submitting a message

  //button to update messages
  // display new messages


  var submitMessage = function(){
    //Get the contents of text in message
    //validate or escape characters
    //get current date, user and room name, encode into a message object
    //
    clearInterval(interval);
    var userMessage = sanitize($('#message').val());
    if( $('input').val() !== "" ) {
      var currentRoom = sanitize($('input').val());
      console.log("currentRoom is ", currentRoom);
    }
    var message = {
      'username': userObj.username,
      'text': userMessage,
      'roomname': currentRoom,
    };
    $.ajax({
      url: 'https://api.parse.com/1/classes/chatterbox',
      type: 'POST',
      data: JSON.stringify(message),
      contentType: 'application/json',
      success: function (data) {
        console.log('Submit is ',data);
        //init(latestMessageDate, currentRoom);
        interval();
      },
      error: function (data) {
        console.error(data,' failed');
        interval();
      }
    });
  };

  var selectRoom = function(roomName) {
    //display messages for roomname only with ajax call
    //
    //set currentRoom to roomname
    latestMessageDate = null;
    init(latestMessageDate,roomName);
    currentRoom = roomName;
  };

  var friendOrUnfriend = function(username) {
    //add username to friend list
    if( !userObj.friends[username] ) { userObj.friends[username] = true; }
    else { userObj.friends[username] = !userObj.friends[username] }
    //bold friends
    $('.message-user').each(function(elem) {
      if( username === $(this).text() ) {
        if( userObj.friends[username] === true ) {
          $(this).addClass('bold-user');
        } else {
          $(this).removeClass('bold-user');
        }
      }
    });
  };

  var wrapperForFriend = function() {
    $(".message-user").on('click', function() {
      var userToFriend = $(this).text();
      friendOrUnfriend(userToFriend);
    });
  };


  $('.update').on('click',function(){
    // console.log("got here");
    init(latestMessageDate);
  });

  $('.submit').on('click',function(){
    submitMessage();
  });

  $('.room-select').change(function(){
    var selected = $('.room-select').find(":selected").attr('name');
    // console.log('selected is',selected);
     $('.message_display').html('');
    selectRoom(selected);
  });


  init();

  var interval = function(){
    setInterval(function() {
    init(latestMessageDate, currentRoom);
  }, 100)};

});

// friend property stores objects
// click a username
// popup/dropdown menu appears, asks "Add friend?"
// if "yes" is clicked post to server:
//  ajax call, adds clicked username to object pointed to by friend property
//
