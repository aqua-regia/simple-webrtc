var connection = new WebSocket("ws://localhost:9090")
var loginButton = document.querySelector('#loginButton')
var connectButton = document.querySelector('#connectButton')
var loginText = document.querySelector('#loginText')
var connectText = document.querySelector('#connectText')
var messageText = document.querySelector('#messageText')
var messageButton = document.querySelector('#messageButton')
var dataButton = document.querySelector('#dataButton')

var myChannel = null
var myConnection = null
var myName = null
var meChannelCreator = false

var toName = null

var iceServersList = [{url:'stun:stun01.sipphone.com'},
    {url:'stun:stun.ekiga.net'},
    {url:'stun:stun.fwdnet.net'},
    {url:'stun:stun.ideasip.com'},
    {url:'stun:stun.iptel.org'},
    {url:'stun:stun.rixtelecom.se'},
    {url:'stun:stun.schlund.de'},
    {url:'stun:stun.l.google.com:19302'},
    {url:'stun:stun1.l.google.com:19302'},
    {url:'stun:stun2.l.google.com:19302'},
    {url:'stun:stun3.l.google.com:19302'},
    {url:'stun:stun4.l.google.com:19302'},
    {url:'stun:stunserver.org'},
    {url:'stun:stun.softjoys.com'},
    {url:'stun:stun.voiparound.com'},
    {url:'stun:stun.voipbuster.com'},
    {url:'stun:stun.voipstunt.com'},
    {url:'stun:stun.voxgratia.org'},
    {url:'stun:stun.xten.com'},
    {
        url: 'turn:numb.viagenie.ca',
        credential: 'muazkh',
        username: 'webrtc@live.com'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=udp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    },
    {
        url: 'turn:192.158.29.39:3478?transport=tcp',
        credential: 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
        username: '28224511:1379330808'
    }]

// ################# web socket methods #################################
function send(message){
    connection.send(JSON.stringify(message))
}

connection.onmessage = function(message){
    messageData = message.data
    _handle_message = true
    try{
        var data = JSON.parse(messageData)
    }
    catch(e){
        console.log(messageData)
        _handle_message = false
    }
    if(_handle_message == true){
        type = data.type
        switch (type){

            // handling web socket response
            case "login":
                status = data.success
                if(String(status) != String(true)){
                    console.log("oops... try a different/valid username")
                }
                else{
                    var configuration = {
                        'iceServers': iceServersList
                    }
                    // myConnection = new RTCPeerConnection(configuration) || new mozRTCPeerConnection(configuration) || new webkitRTCPeerConnection(configuration) || new msRTCPeerConnection(configuration)
                    myConnection = new RTCPeerConnection()
                    console.log("RTCPeerConnection object was created") 

                    // ################ setting event handlers function on peer connection object ###############
                    myConnection.onicecandidate = function(event){
                        if(event.candidate){
                            console.log("ice candidate found, sending to remote peer", event.candidate)
                            send({type: "candidate", candidates: event.candidate, from: myName, to: toName})
                        }
                    }

                    myConnection.ondatachannel = function(event){
                        meChannelCreator = false
                        myChannel = event.channel
                        myChannel.onmessage = function(event){
                            console.log("message on myChannel:-", event.data)
                            messageText.value(event.data)
                        }
                    }

                    myConnection.onpeeridentity = function(event){
                        console.log("")
                    }
                }
                break
            case "offer":
                from = data.from
                to = data.to
                toName = to
                remoteDescription = data.data

                //  set connection properties with success and failure callbacks using promise #############
                myConnection.setRemoteDescription(remoteDescription).then(function() {
                    console.log("offer set remote description success")
                    myConnection.createAnswer({offerToReceiveAudio: true}).then(function(answer){
                        console.log("offer able to create answer sdp")
                        myConnection.setLocalDescription(answer).then(function(){
                            console.log("offer set local description with created answer success")
                        }).catch(function(error){
                            console.log("offer set local description with created answer failure, error is:-", JSON.stringify(error))
                        })
                        send({type: "answer", from: myName, to: from, answer: answer})

                        myConnection.ondatachannel = function(event){
                            meChannelCreator = false
                            myChannel = event.channel
                            myChannel.onmessage = function(event){
                                console.log("message on myChannel:-", event.data)
                                messageText.value(event.data)
                            }
                        }

                    }).catch(function(error){
                        console.log('offer unable to create answer sdp, error is:-', error)
                }).catch(function(error){
                    console.log("unable to create ")
                })
            }).catch(function(error){
                console.log("offer unable to set remote descripton, error is:-", JSON.stringify(error))
            })
                break
            case "answer":
                remoteDescription = data.data
                myConnection.setRemoteDescription(remoteDescription).then(function(){
                    console.log("answer set remote descrption with got answer success")
                }).catch(function(error){
                    console.log("unable to set remote description with got answer, error is:-", JSON.stringify(error))
                })

                myConnection.ondatachannel = function(event){
                    meChannelCreator = false
                    myChannel = event.channel
                    myChannel.onmessage = function(event){
                        console.log("message on myChannel:-", event.data)
                        messageText.value(event.data)
                    }
                }

                break
            case "candidate":
                console.log("removed ice candidates from remote peer, adding ice candidates")
                candidate = data.data
                console.log("recieved ice candidates are ", candidate)
                myConnection.addIceCandidate(candidate).then(function(){
                    console.log('add ice candidates success')
                }).catch(function(error){
                    console.log('unable to add ice candidates, error is:-', error)
                })
                break
            case "leave":
                break
        }
    }
}

// ############### ui buttons handling

function handleLogin(event){
    name = loginText.value
    myName = name
    send({type: "login", from: name})
}

function handleConnect(event){
    name = connectText.value
    toName = name
    myConnection.createOffer(function(offer){
            send({type: "offer", offer: offer, from: myName, to: name})
            myConnection.setLocalDescription(offer)
        },
        function(error){
            console.log("unable to create offer, error :-", error)
    }, {offerToReceiveAudio: true})
}

function handleMessage(event){
    var message = messageText.value
    myChannel.send(message)
}

function handleDataChannel(event){
    myConnection.ondatachannel = null
    myChannel = myConnection.createDataChannel("myDataChannel")
    
    myChannel.onerror = function(error){
        console.log("unable to open data channgel, error is:- ", error)
    }
    myChannel.onmessage = function(event){
        message = event.data
        console.log("message###", message, '###')
    }

    myChannel.onopen = function(){
        console.log("data channel opened")
    }
}


// ############# event listeners #################
loginButton.addEventListener('click', handleLogin)
connectButton.addEventListener('click', handleConnect)
messageButton.addEventListener('click', handleMessage)
dataButton.addEventListener('click', handleDataChannel)

