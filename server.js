const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const PeerServer = require('peer').ExpressPeerServer;
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;
const rooms = {}; // in-memory room storage

// Serve public directory
app.use(express.static(path.join(__dirname, 'public')));

// Create PeerJS server
const peerServer = PeerServer(server, { path: '/peer' });

// Generate random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Manage room connections
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        rooms[roomCode] = { users: [], mic: null };
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (roomCode) => {
        if (rooms[roomCode]) {
            socket.join(roomCode);
            socket.emit('roomJoined', roomCode);
            socket.to(roomCode).emit('userJoined', socket.id);
        } else {
            socket.emit('roomError', 'Room does not exist');
        }
    });

    socket.on('requestMic', (roomCode) => {
        if (rooms[roomCode].mic === null) {
            rooms[roomCode].mic = socket.id; // assign mic
            socket.emit('micGranted');
        } else {
            socket.emit('micDenied', 'One microphone per room enforced.');
        }
    });

    socket.on('disconnect', () => {
        for (const roomCode of Object.keys(rooms)) {
            if (rooms[roomCode].mic === socket.id) {
                rooms[roomCode].mic = null; // free the mic
            }
            socket.to(roomCode).emit('userLeft', socket.id);
        }
        console.log('Client disconnected');
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});