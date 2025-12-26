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
            socket.emit('room_state_update', state);
        }
    });

    socket.on('request_model', ({ studentId }) => {
        // Forward request to student
        io.to(studentId).emit('request_model');
    });

    socket.on('student_model_data', ({ thumbnails, dataset }) => {
        // Find the room code and student name
        const code = Array.from(socket.rooms).find(r => r.length === 6);
        if (code) {
            const roomState = roomManager.getRoomState(code);
            if (roomState) {
                // Find student name from room state
                const student = roomState.students.find((s: any) => s.id === socket.id);
                const studentName = student?.name || "Student";
                
                // Emit to room (teacher will filter)
                io.to(code).emit('student_featured_data', {
                    studentName,
                    thumbnails,
                    dataset
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
