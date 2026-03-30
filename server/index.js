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

const PORT = process.env.PORT || 3015;

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
            if (state) {
                io.to(socket.id).emit('room_state_update', state);
            }
        }
    });

    socket.on('request_model', ({ studentId }) => {
        // Forward request to student
        io.to(studentId).emit('request_model');
    });

    socket.on('student_model_data', (payload) => {
        // Find the room code and student name
        const code = Array.from(socket.rooms).find(r => r.length === 6);
        if (code) {
            const roomState = roomManager.getRoomState(code);
            if (roomState) {
                // Find student name from room state
                const student = roomState.students.find((s) => s.id === socket.id);
                const studentName = student?.name || "Student";
                
                // Emit to room (teacher will filter)
                io.to(code).emit('student_featured_data', {
                    studentId: socket.id,
                    studentName,
                    ...payload
                });
            }
        }
    });

    // --- Student Events ---
    socket.on('join_room', ({ code, name }) => {
        const result = roomManager.joinRoom(code, socket.id, name);
        if (result) {
            socket.join(code);
            socket.emit('joined_room', { code, attentionMode: result.attentionMode });

            // Notify teacher only
            const roomData = roomManager.getRoomState(code);
            if (roomData) {
                io.to(result.teacherId).emit('room_state_update', roomData);
            }
        } else {
            socket.emit('error', 'Invalid Room Code');
        }
    });

    socket.on('update_status', ({ status, metrics }) => {
        const room = roomManager.updateStudentStatus(socket.id, status, metrics);
        if (room) {
            const code = Array.from(socket.rooms).find(r => r.length === 6);
            if (code) {
                const roomState = roomManager.getRoomState(code);
                if (roomState) {
                    io.to(room.teacherId).emit('room_state_update', roomState);
                }
            }
        }
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
        const result = roomManager.leaveRoom(socket.id);
        if (result && !result.isTeacher) {
            const roomState = roomManager.getRoomState(result.code);
            if (roomState && result.teacherId) {
                io.to(result.teacherId).emit('room_state_update', roomState);
            }
        }
    });
});

server.listen(PORT, () => {
    console.log(`Classroom Server running on port ${PORT} `);
});
