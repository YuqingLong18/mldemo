
import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:3001";
const NUM_STUDENTS = 50;

// Get room code from command line args
const roomCode = process.argv[2];

if (!roomCode) {
    console.error("Please provide a room code. Usage: node scripts/stress_test.js <ROOM_CODE>");
    process.exit(1);
}

console.log(`Starting stress test with ${NUM_STUDENTS} students joining room ${roomCode}...`);

const STATUSES = ['idle', 'collecting', 'training', 'predicting', 'clustering'];
const NAMES = [
    "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy",
    "Kevin", "Liam", "Mike", "Nina", "Oscar", "Peggy", "Quinn", "Rupert", "Sybil", "Ted",
    "Ursula", "Victor", "Walter", "Xavier", "Yvonne", "Zelda"
];

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomMetrics() {
    return {
        samples: Math.floor(Math.random() * 100),
        accuracy: Math.random() > 0.5 ? 0.8 + Math.random() * 0.2 : 0,
        k: 3,
        converged: Math.random() > 0.8
    };
}

// Create clients
for (let i = 0; i < NUM_STUDENTS; i++) {
    const socket = io(SERVER_URL);
    const name = `${getRandomItem(NAMES)}_${i + 1}`;

    socket.on("connect", () => {
        // Join room
        socket.emit("join_room", { code: roomCode, name });
    });

    socket.on("joined_room", () => {
        // Start behavior loop
        setInterval(() => {
            const status = getRandomItem(STATUSES);
            const metrics = getRandomMetrics();

            socket.emit("update_status", { status, metrics });
        }, 2000 + Math.random() * 3000); // Update every 2-5 seconds
    });

    socket.on("kicked", () => {
        console.log(`${name} was kicked!`);
        socket.disconnect();
    });
}

console.log(`${NUM_STUDENTS} clients spawned. Press Ctrl+C to stop.`);
