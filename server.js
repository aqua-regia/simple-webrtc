// simple node js signalling server based on websockets

var WebSocketServer = require('ws').Server

// start a server at port 9000
var wss = new WebSocketServer({port: 9090})

var allUsers = {}

function sendTo(connection, message){
    connection.send(JSON.stringify(message))
}

function sendResponse(connection, type, success, msg){
    if(success == false){
        sendTo(connection, {type: type, success: false, msg: msg})
    }
    else{
        sendTo(connection, {type: type, success: true})
    }
}


wss.on('close', function(connection){
    console.log("Closed called for:- ", connection)
    delete allUsers[connection.name]

    if(connection.otherName){
        console.log("Disconnecting from ", connection.otherName)
        var otherConnection = allUsers[connection.otherName]
        otherConnection.otherName = null
        if(otherConnection != null){
            sendTo(otherConnection, {type: "leave"})
        }
    }
})

wss.on('connection', function(connection){
    console.log("User connected:-", connection)
    connection.send("Hello from server...")

    connection.on('message', function(message){
        var data = {}
        try{
            data = JSON.parse(message)
        }catch(e){
            console.log("Invalid Json:- ", message)
            data = {}
        }
        switch(data.type){
            case "login": 
                from = data.from
                if (allUsers[from]){
                    sendResponse(connection, "login", false, "User already logged in.")
                }
                else{
                    connection.from = data.from
                    allUsers[from] = connection
                    sendResponse(connection, "login", true)
                }
                break
    
            case "offer":
                from = data.from
                to = data.to
                offer = data.offer
                toConnection = allUsers[to]
                sendTo(toConnection, {type: "offer", from: from, to: to, data: offer})
                connection.send("offer send to ", to)
                allUsers[from].otherName = to
                break
    
            case "answer":
                from = data.from
                to = data.to
                answer = data.answer
                toConnection = allUsers[to]
                sendTo(toConnection, {type: "answer", from: from, to: to, data: answer})
                connection.send("answer send to ", to)
                connection.otherName = to
                break
    
            case "candidate":
                from = data.from
                to = data.to
                candidates = data.candidates
                toConnection = allUsers[to]
                console.log("from to candidates toConnection are ", from, to, candidates,toConnection)
                sendTo(toConnection, {type: "candidate", from: from, to: to, data: candidates})
                connection.send("connection send to ", candidates)
                break
            case "leave":
                from = data.from
                to = data.to
                fromConnection = allUsers[from]
                fromConnection.otherName = null
                toConnection = allUsers[to]
                sendTo(toConnection, {type: "leave"})
                break
            default:
                console.log("Invalid type for:- ", message)
        }
    })
})