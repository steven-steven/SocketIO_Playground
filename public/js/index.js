var socket = io(); //initiate request to server. 
socket.on("connect",function(){
    console.log("Connected to server");

});
socket.on("disconnect", function(){
    console.log("Disconnected to server");
});
socket.on('newMessage', function(msg){
    console.log("Appending");
    var li = $('<li></li>');
    li.text(`${msg.from}: ${msg.text}`);
    $('#messages_list').append(li);
})


$(document).ready(function() {
    $("#message-form").submit( function (e){
        e.preventDefault();     //prevent default submit process (add querystring ?..)
        
        socket.emit("createMessage", {
            from:"User",
            text: $('[name=message]').val()
        }, function(){  //acknowledgement
            
        });
    });
});
