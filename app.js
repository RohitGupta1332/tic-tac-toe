import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        credentials: true
    }
});

app.use(express.static(path.resolve("./public")));

let rooms = {};

io.on("connection", (socket) => {
    console.log(`${socket.id} connected`);

    // Join room event
    socket.on('join', ({ roomId }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { users: [] };
        }
        const room = rooms[roomId];

        if (room.users.length < 2) {
            const symbol = room.users.length === 0 ? 'X' : 'O';

            room.users.push({ id: socket.id, symbol });

            socket.join(roomId);
            console.log(`${socket.id} joined room ${roomId} as ${symbol}`);

            socket.emit('symbol', symbol);

            io.to(roomId).emit('message', {id: socket.id, message: `Player ${symbol} has joined!`});
        } else {
            //display message if room is full
            socket.emit('roomFull', `Room ${roomId} is full. You cannot join.`);
        }
    });

    // Handle moves from a client
    socket.on('move', ({ roomId, index, symbol }) => {
        socket.to(roomId).emit('move', { index, symbol });
    });

    // Handle winner announcement
    socket.on('winner', ({ roomId, winner }) => {
        console.log(`Winner in room ${roomId}: Player ${winner}`);
        io.to(roomId).emit('winner', winner);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        for (let roomId in rooms) {
            rooms[roomId].users = rooms[roomId].users.filter(user => user !== socket.id);
            if (rooms[roomId].users.length === 0) {
                delete rooms[roomId];
            }
        }
    });
});


server.listen(3000, () => {
    console.log("Server is running on port 3000");
});
