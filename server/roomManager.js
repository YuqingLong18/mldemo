// server/roomManager.js

/**
 * Manages classroom state.
 * Structure:
 * rooms = {
 *   "ROOMCODE": {
 *     teacherId: "socketId",
 *     attentionMode: false,
 *     students: {
 *       "socketId": { name: "Alice", status: "idle", metrics: {} }
 *     }
 *   }
 * }
 */
const rooms = new Map();

// Helper to generate 6-char code
function generateRoomCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    do {
        code = "";
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (rooms.has(code));
    return code;
}

export function createRoom(teacherSocketId) {
    const code = generateRoomCode();
    rooms.set(code, {
        teacherId: teacherSocketId,
        attentionMode: false,
        students: new Map()
    });
    return code;
}

export function joinRoom(code, studentSocketId, studentName) {
    const room = rooms.get(code);
    if (!room) return null;

    // Prevent duplicate names in same room if possible, or just append ID
    room.students.set(studentSocketId, {
        name: studentName,
        status: 'idle',
        metrics: {}
    });
    return { code, attentionMode: room.attentionMode };
}

export function leaveRoom(socketId) {
    // Find which room this socket is in (inefficient but safe for small scale)
    for (const [code, room] of rooms.entries()) {
        if (room.teacherId === socketId) {
            // Teacher left - destroy room? For now, keep it alive brefly or destroy.
            rooms.delete(code);
            return { code, isTeacher: true };
        }
        if (room.students.has(socketId)) {
            room.students.delete(socketId);
            return { code, isTeacher: false };
        }
    }
    return null;
}

export function getRoomState(code) {
    const room = rooms.get(code);
    if (!room) return null;

    // Convert Map to Array for JSON
    const students = Array.from(room.students.entries()).map(([id, data]) => ({
        id,
        ...data
    }));

    return {
        code,
        attentionMode: room.attentionMode,
        students
    };
}

export function updateStudentStatus(socketId, status, metrics) {
    for (const room of rooms.values()) {
        if (room.students.has(socketId)) {
            const student = room.students.get(socketId);
            student.status = status || student.status;
            student.metrics = metrics || student.metrics;
            return room; // Return room to notify teacher
        }
    }
    return null;
}

export function setAttentionMode(code, enabled) {
    const room = rooms.get(code);
    if (room) {
        room.attentionMode = enabled;
        return true;
    }
    return false;
}

export function kickStudent(code, studentId) {
    const room = rooms.get(code);
    if (room && room.students.has(studentId)) {
        room.students.delete(studentId);
        return true;
    }
    return false;
}
