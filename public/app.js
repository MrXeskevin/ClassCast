// Import PeerJS and Socket.io
const Peer = require('peer');
const socket = io();

const userId = Math.random().toString(36).substring(7);
const peer = new Peer(userId);

let localStream;
let currentRoom = 'home';

// Get DOM elements
const homeScreen = document.getElementById('home');
const micScreen = document.getElementById('mic');
const speakerScreen = document.getElementById('speaker');
const connectionStatus = document.getElementById('connection-status');
const muteButton = document.getElementById('mute-button');

let isMuted = false;

// Manage screen visibility
function switchScreen(screen) {
    homeScreen.style.display = 'none';
    micScreen.style.display = 'none';
    speakerScreen.style.display = 'none';
    screen.style.display = 'block';
}

// Handle incoming connections
peer.on('call', call => {
    call.answer(localStream);
    call.on('stream', remoteStream => {
        const remoteAudio = document.getElementById('remote-audio');
        remoteAudio.srcObject = remoteStream;
        remoteAudio.play();
    });
});

// Signaling
socket.on('user-joined', userId => {
    console.log('User joined: ' + userId);
});

// Join a room
function joinRoom(room) {
    socket.emit('join-room', room, userId);
    currentRoom = room;
    switchScreen(micScreen);
}

// Mute/Unmute toggle
muteButton.addEventListener('click', () => {
    if (isMuted) {
        localStream.getAudioTracks()[0].enabled = true;
        muteButton.innerHTML = 'Mute';
    } else {
        localStream.getAudioTracks()[0].enabled = false;
        muteButton.innerHTML = 'Unmute';
    }
    isMuted = !isMuted;
});

// Get user media
navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    localStream = stream;
    // Switch to the home screen after getting the media stream
    switchScreen(homeScreen);
}).catch(err => {
    console.error('Failed to get local stream', err);
});
