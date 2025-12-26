// server/index.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import * as roomManager from './roomManager.js';

const app = express();
const server = createServer(app);

// Allow CORS for local development
const io = new Server(server, {
    maxHttpBufferSize: 50 * 1024 * 1024, // 50MB
    cors: {
        origin: "*", // Adjust in production
        methods: ["GET", "POST"]
    }
});

const PORT = 3001;

io.on('connection', (socket) => {
    // console.log('Client connected:', socket.id);

    // --- Teacher Events ---
    socket.on('create_room', () => {
        const code = roomManager.createRoom(socket.id);
        socket.join(code);
        socket.emit('room_created', code);
    });

    socket.on('toggle_attention', ({ code, enabled }) => {
        if (roomManager.setAttentionMode(code, enabled)) {
            io.to(code).emit('attention_mode_change', enabled);
        }
    });

    socket.on('kick_student', ({ code, studentId }) => {
        if (roomManager.kickStudent(code, studentId)) {
            // Notify student they are kicked
            io.to(studentId).emit('kicked');
            io.sockets.sockets.get(studentId)?.leave(code);

            // Notify teacher of update
            const state = roomManager.getRoomState(code);
            socket.emit('room_state_update', state);
        }
    });

    socket.on('request_model', ({ studentId }) => {
        // Forward request to student
        io.to(studentId).emit('request_model');
    });

    socket.on('student_model_data', ({ thumbnails, dataset }) => {
        // We assume the sender is a student in a room, and we need to find the teacher.
        // For simplicity in this demo, we broadcast to the room's teacher (who created it).
        // Since we don't track "teacher socket" explicitly in roomManager for lookup,
        // we can relay to the room code, but alert only the teacher client.

        // Better: Pass `code` in the event or find it.
        const code = Array.from(socket.rooms).find(r => r.length === 6);
        if (code) {
            // This assumes teacher is in the room.
            // We emit a special event that only the teacher dashboard/lab will care about.
            // Or specifically target the room creator if we tracked them.
            // For now, broadcast to room, client filters by `isTeacher`.
            io.to(code).emit('student_featured_data', {
                studentName: socket.data.name || "Student", // We didn't save name on socket.data, will fix in roomManager if needed
                thumbnails,
                dataset
            });
        }
    });

    // --- Student Events ---
    socket.on('join_room', ({ code, name }) => {
        const result = roomManager.joinRoom(code, socket.id, name);
        if (result) {
            socket.join(code);
            socket.emit('joined_room', { code, attentionMode: result.attentionMode });

            // Notify teacher
            const roomData = roomManager.getRoomState(code);
            // We need to find the teacher's socket ID or just broadcast to room "teacher" channel if we had one.
            // But currently the teacher is IN the room too.
            // Let's optimize: Teacher listens to 'room_state_update'
            io.to(code).emit('room_state_update', roomData);
        } else {
            socket.emit('error', 'Invalid Room Code');
        }
    });

    socket.on('update_status', ({ status, metrics }) => {
        const room = roomManager.updateStudentStatus(socket.id, status, metrics);
        // If successful, we strictly want to notify the TEACHER, but broadcasting to room is okay for now.
        // Ideally, we'd send only to teacher to save bandwidth.
        if (room) {
            // Find code roughly
            // This is a bit inefficient, better to store code on socket
            // For demo:
            const code = Array.from(socket.rooms).find(r => r.length === 6);
            if (code) {
                io.to(code).emit('room_state_update', roomManager.getRoomState(code));
            }
        }
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
        const result = roomManager.leaveRoom(socket.id);
        if (result && !result.isTeacher) {
            io.to(result.code).emit('room_state_update', roomManager.getRoomState(result.code));
        }
    });
});

server.listen(PORT, () => {
    console.log(`Classroom Server running on port ${PORT} `);
});
