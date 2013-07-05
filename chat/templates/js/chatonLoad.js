/*#######################################################################
Globals vars
########################################################################*/
var nicks = [];

var media_url = 'rtmfp://stratus.rtmfp.net/d1e1e5b3f17e90eb35d244fd-c711881365d9/';

Date.prototype.toRelativeTime = function(now_threshold) {
  var delta = new Date() - this;

  now_threshold = parseInt(now_threshold, 10);

  if (isNaN(now_threshold)) {
    now_threshold = 0;
  }

  if (delta <= now_threshold) {
    return 'Just now';
  }

  var units = null;
  var conversions = {
    millisecond: 1, // ms    -> ms
    second: 1000,   // ms    -> sec
    minute: 60,     // sec   -> min
    hour:   60,     // min   -> hour
    day:    24,     // hour  -> day
    month:  30,     // day   -> month (roughly)
    year:   12      // month -> year
  };

  for (var key in conversions) {
    if (delta < conversions[key]) {
      break;
    } else {
      units = key; // keeps track of the selected key over the iteration
      delta = delta / conversions[key];
    }
  }

  // pluralize a unit when the difference is greater than 1.
  delta = Math.floor(delta);
  if (delta !== 1) { units += "s"; }
  return [delta, units].join(" ");
};

util = {
  urlRE: /https?:\/\/([-\w\.]+)+(:\d+)?(\/([^\s]*(\?\S+)?)?)?/g, 

  //  html sanitizer 
  toStaticHTML: function(inputHtml) {
    inputHtml = inputHtml.toString();
    return inputHtml.replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;");
  }, 

  //pads n with zeros on the left,
  //digits is minimum length of output
  //zeroPad(3, 5); returns "005"
  //zeroPad(2, 500); returns "500"
  zeroPad: function (digits, n) {
    n = n.toString();
    while (n.length < digits) 
      n = '0' + n;
    return n;
  },

  //it is almost 8 o'clock PM here
  //timeString(new Date); returns "19:49"
  timeString: function (date) {
    var minutes = date.getMinutes().toString();
    var hours = date.getHours().toString();
    return this.zeroPad(2, hours) + ":" + this.zeroPad(2, minutes);
  },

  //does the argument only contain whitespace?
  isBlank: function(text) {
    var blank = /^\s*$/;
    return (text.match(blank) !== null);
  }
};

/*#######################################################################
Globals Functions
########################################################################*/
function getFlashMovie(movieName) {
            var isIE = navigator.appName.indexOf("Microsoft") != -1;
            return (isIE) ? window[movieName] : document[movieName];
}

function onCreationComplete(event) {
    if (event.objectID == "video1") {
        var url = media_url + "?publish=" + stream;
          getFlashMovie("video1").setProperty("src", url);
  }       
}

function onPropertyChange(event) {
    if (event.property == "nearID") {
      if (event.objectID == "video1") {
        //document.getElementById("nearID1").value = event.newValue;
        CONFIG.nearID = event.newValue;
        //alert(CONFIG.nearID);
        jQuery.post("/setNearID/", {nearid: CONFIG.nearID, idusu: CONFIG.id}, function (data) {
        }, "json");
      }
    }
}
function publicarVideo(){
    getFlashMovie('video1').setProperty('src', media_url + '?publish=' + CONFIG.id);
}
//used to keep the most recent messages visible
function scrollDown () {
  //window.scrollBy(0, 100000000000000000);
  var div = document.getElementById('log');
  h = div.scrollHeight;
  div.scrollTop = h;
  $("#entry").focus();
}
//Show chat
function showChat (nick) {
  $("#entry").focus();
  scrollDown();
}

//we want to show a count of unread messages when the window does not have focus
function updateTitle(){
  if (CONFIG.unread) {
    document.title = "(" + CONFIG.unread.toString() + ") node chat";
  } else {
    document.title = "node chat";
  }
}

function updateUptime () {
  if (starttime) {
    $("#uptime").text(starttime.toRelativeTime());
  }
}

function updateRSS () {
  var bytes = parseInt(rss);
  if (bytes) {
    var megabytes = bytes / (1024*1024);
    megabytes = Math.round(megabytes*10)/10;
    $("#rss").text(megabytes.toString());
  }
}

//inserts an event into the stream for display
//the event may be a msg, join or part type
//from is the user, text is the body and time is the timestamp, defaulting to now
//_class is a css class to apply to the message, usefull for system events
function addMessage (from, text, time, _class) {
  if (text === null)
    return;

  if (time == null) {
    // if the time is null or undefined, use the current time.
    time = new Date();
  } else if ((time instanceof Date) === false) {
    // if it's a timestamp, interpret it
    time = new Date(time);
  }

  //every message you see is actually a table with 3 cols:
  //  the time,
  //  the person who caused the event,
  //  and the content
  var messageElement = $(document.createElement("table"));

  messageElement.addClass("message");
  if (_class)
    messageElement.addClass(_class);

  // sanitize
  text = util.toStaticHTML(text);

  // If the current user said this, add a special css class
  var nick_re = new RegExp(CONFIG.nick);
  if (nick_re.exec(text))
    messageElement.addClass("personal");

  // replace URLs with links
  text = text.replace(util.urlRE, '<a target="_blank" href="$&">$&</a>');

  var content = '<tr>'
              //+ '  <td class="date">' + util.timeString(time) + '</td>'
              +'<td class="nick" style="font-size:11px;"><b>'+util.toStaticHTML(from)+ ':</b></td>'
              +'<td class="msg-text" style="font-size:10.5px;">'+text+'</td>'
              + '</tr>'
              ;
  messageElement.html(content);

  //the log is the stream that we view
  $("#log").append(messageElement);

  //always view the most recent message when it is added
  scrollDown();
}

//handles another person joining chat
function userJoin(nick, timestamp) {
  //put it in the stream.
  //addMessage(nick, "joined", timestamp, "join");
  //if we already know about this user, ignore it
  for (var i = 0; i < nicks.length; i++)
    if (nicks[i] == nick) return;
  //otherwise, add the user to the list
  nicks.push(nick);
  //update the UI
  updateUsersLink();

  //Agregar a mi lista de Usuarios
  //addTodos(nick);
}

function userUnion(msg){
  //Conectado con alguien mensaje
  $("#connectUnion").html(msg);
  //addMessage(nick, "Union", timestamp, "union");
  //if we already know about this user, ignore it
  //for (var i = 0; i < nicks.length; i++)
    //if (nicks[i] == nick) return;
  //otherwise, add the user to the list
  //nicks.push(nick);
  //update the UI
  //updateUsersLink();
  //Agregar a mi lista de Usuarios
  //addTodos(nick);
}

function addTodos(nick){
  $("#todos").append("<a href='"+nick+"'>"+nick+"</a><br>");
}

//get a list of the users presently in the room, and add it to the stream
function who () {
  jQuery.get("/who/", {}, function (data, status) {
    if (status != "success") return;
    nicks = data.nicks;
    //outputUsers();
  }, "json");
}

//updates the users link to reflect the number of active users
function updateUsersLink ( ) {
  var t = nicks.length.toString() + "";
  //if (nicks.length != 1) t += "s";
  $("#usersLink").text(t);
}


//add a list of present chat members to the stream
function outputUsers () {
  var nick_string = nicks.length > 0 ? nicks.join(", ") : "(none)";
  addMessage("Users ", nick_string, new Date(), "notice");
  return false;
}

//handles someone leaving
function userPart(nick, timestamp) {
  //put it in the stream
  //addMessage(nick, "left", timestamp, "part");
  //remove the user from the list
  for (var i = 0; i < nicks.length; i++) {
    if (nicks[i] == nick) {
      nicks.splice(i,1)
      break;
    }
  }
  //update the UI
  updateUsersLink();
}

var transmission_errors = 0;
var first_poll = true;

function longPoll(data){
  //CONFIG.connectUnion = 1;
    /*if(transmission_errors > 5){
        alert("Error de transmision");
        return;
    }*/
    if (data && data.rss) {
        rss = data.rss;
        updateRSS();
    }
    if(data && data.messages){
        //Recorrdio a los mensajes
        for(var i=0; i< data.messages.length; i++){
            //Aqui esta la clave!!
            var message = data.messages[i];
             //track oldest message so we only request newer messages from server
            if (message.timestamp > CONFIG.last_message_time)
                CONFIG.last_message_time = message.timestamp;

            //Dispatch new messages to ther appropriate handlers
            switch(message.type){
                case "msg":
                    if(!CONFIG.focus){
                        CONFIG.unread++;
                    }
                    //Actualizamos los id CONFIG de cada navegador
                    //if(message.nick_next == CONFIG.id)
                      //CONFIG.id_next = message.id_nick;

                    /*if (CONFIG.id == message.nick_next)
                      CONFIG.id_next = message.id_nick;
                    else{
                      if(message.id_nick == CONFIG.id || message.nick_next == CONFIG.id)
                        CONFIG.id_next = message.nick_next;
                      else
                        CONFIG.id_next = message.id_nick;
                    }*/

                    //Si el Id_mext nos conierne morstramos el mensaje
                    if(message.id_nick == CONFIG.id || message.nick_next == CONFIG.id){
                      addMessage(message.nick, message.text, message.timestamp);
                      //CONFIG.connectUnion = 1;
                    }
                    /*else{
                        CONFIG.connectUnion = 0;
                    }*/
                    break;
                case "join":
                    userJoin(message.nick, message.timestamp);
                    break;

                case "part":
                    userPart(message.nick, message.timestamp);
                    break;

                case "union":
                    //Actualizamos los idCONFIG de cada navegador, para que
                    //cada quien diriga su MSJ con su cada cual
                    //alert("Llega ID"+message.id_nick+"Llega NextID "+message.nick_next);
                    if (CONFIG.id == message.nick_next){
                        //Se ejecuta quien recibe el boton next
                        CONFIG.id_next = message.id_nick;
                        CONFIG.farID = message.nearid;
                        param =  media_url + '?play=' + CONFIG.id_next + '&farID=' + CONFIG.farID;
                        //alert(param);
                        getFlashMovie('video2').setProperty('src', param);  
                      }
                      else{
                        if(message.id_nick == CONFIG.id || message.nick_next == CONFIG.id){
                          //Se ejecuta quien dio el boton 'next'
                          CONFIG.id_next = message.nick_next;
                        }
                        else
                          CONFIG.id_next = 0;
                      }
                      //alert("Mi ID:"+CONFIG.id+" mi nextID "+ CONFIG.id_next);
                    //userUnion(message.nick, message.timestamp);
                    if(CONFIG.id_next == 0 || CONFIG.id_next == CONFIG.id){
                      msg = "No conectado";
                      //Quitar la camara 2
                      //alert(1);
                      getFlashMovie('video2').setProperty('src', null);
                    }
                    else
                      msg = "Conectado con un usuario";

                    userUnion(msg);
                    break;
            }
        }
         //update the document title to include unread message count if blurred
        //updateTitle();
        //only after the first request for messages do we want to show who is here
        if (first_poll) {
          first_poll = false;
          who();
        }
    }
  //alert(CONFIG.connectUnion);
    (CONFIG.id_next == 0) ? idEnv = CONFIG.id : idEnv = CONFIG.id_next;
    //make another request
    $.ajax({ cache: false
           , type: "POST"
           , url: "/recv/"
           , dataType: "json"
           , data: { 
                  since: CONFIG.last_message_time, 
                  id: CONFIG.id,
                  id_next: idEnv,
                  connectionUnion: CONFIG.connectUnion
                  }
           , error: function () {
              //Error
               //addMessage("", "Long poll error. Conectando...", new Date(), "error");
               transmission_errors += 1;
               //don't flood the servers on error, wait 10 seconds before retrying
               setTimeout(longPoll, 10*1000);
             }
           , success: function (data) {
               transmission_errors = 0;
               //if everything went well, begin another request immediately
               //the server will take a long time to respond
               //how long? well, it will wait until there is another message
               //and then it will return it to us and close the connection.
               //since the connection is closed when we get data, we longPoll again
               longPoll(data);
             }
      });
}

//submit a new message to the server
function send(msg) {
  if (CONFIG.debug === false) {
    // XXX should be POST
    // XXX should add to messages immediately
    (CONFIG.id_next == 0) ? idEnv = CONFIG.id : idEnv = CONFIG.id_next;
    jQuery.post("/send/", {id: CONFIG.id, text: msg, id_next: idEnv}, 
      function (data) { }, "json");
  }
}

/*#######################################################################
init
########################################################################*/
$(document).ready(function() {
     //submit new messages when the user hits enter if the message isnt blank
      $("#entry").keypress(function (e) {
        if (e.keyCode != 13 /* Return */) return;
        var msg = $("#entry").attr("value").replace("\n", "");
        if (!util.isBlank(msg)) send(msg);
        $("#entry").attr("value", ""); // clear the entry field.
      });

    /*On connect*/
    //Show chat
    showChat(CONFIG.nick);
    userUnion("No conectado");
    //listen for browser events so we know to update the document title
    //$(window).bind("blur", function() {
       // CONFIG.focus = false;
        //updateTitle();
    //});

    //$(window).bind("focus", function() {
        //CONFIG.focus = true;
        //CONFIG.unread = 0;
        //updateTitle();
    //});
    //updateRSS();
    //updateUptime();
    // update the daemon uptime every 10 seconds
    //setInterval(function () {
      //updateUptime();
    //}, 10*1000);
    // remove fixtures
    $("#log table").remove();
    //begin listening for updates right away
    //interestingly, we don't need to join a room to get its updates
    //we just don't show the chat stream to the user until we create a session
    longPoll();

    //if we can, notify the server that we're going away.
    $(window).unload(function () {
        //alert("Unload");
      jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });

    //Jugemos a la ruleta
    //Evento que se ejecuta quien dios click a 'next'
    $("#nextUsu").click(function(){
      //Restablecer variables
      (CONFIG.id_next == 0) ? idEnv = CONFIG.id : idEnv = CONFIG.id_next;
      $.ajax({
        cache:false,
        type:'POST',
        dataType:'json',
        url:'/sala/',
        data: {
              id: CONFIG.id, id_next:idEnv, since:CONFIG.last_message_time, 
              nearid: CONFIG.nearID
            },
        error: function(){
          alert("Error connecting to server");
        },
        success: function (data){
          //Asignamos con quien estare 'conectado' 
          //alert(data.farID);
          param =  media_url + '?play='+data.id_next+'&farID=' + data.farID;
          getFlashMovie('video2').setProperty('src', param);  
          if(data.status != 0){
            CONFIG.id_next = data.id_next;
            CONFIG.connectUnion = 1;
          }else{
            CONFIG.id_next = 0;
            CONFIG.connectUnion = 0;
          }
          //alert("ID next" + CONFIG.id_next + " Status :"+ data.status );
        }
      });
      return false;
      first_poll = true;
      longPoll();
    });


    /**********************************
    Controlando salida de los usuarios
    ************************************/
    $("#inicio").click(function(){
        jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });
    $("#salas").click(function(){
        jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });
    $("#acerca").click(function(){
        jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });
    $("#contacto").click(function(){
        jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });
    $("#priv").click(function(){
        jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });
    $("#terminos").click(function(){
        jQuery.post("/part/", {id: CONFIG.id}, function (data) { }, "json");
    });
});

