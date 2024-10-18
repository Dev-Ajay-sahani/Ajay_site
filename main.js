// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzJt2KXfs5DC8Mh1rF-4SECgBxY7VhnZc",
  authDomain: "no-fap-streak-counter.firebaseapp.com",
  projectId: "no-fap-streak-counter",
  storageBucket: "no-fap-streak-counter.appspot.com",
  messagingSenderId: "160726515239",
  appId: "1:160726515239:web:ea115e57ee1bea59b69802",
  measurementId: "G-BTNPSSTNTT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Initialize streaks, logs, and graph data
const streaks = {
    user1: 0,
    user2: 0
};
const logs = {
    user1: [],
    user2: []
};
const graphsData = {
    user1: [],
    user2: []
};

const graphs = {
    user1: null,
    user2: null
};

// Update the display
function updateDisplay() {
    document.getElementById('user1Streak').textContent = `Streak: ${streaks.user1} days`;
    document.getElementById('user2Streak').textContent = `Streak: ${streaks.user2} days`;

    document.getElementById('user1Log').innerHTML = logs.user1.length > 0 ? logs.user1.join('<br>') : 'No logs yet.';
    document.getElementById('user2Log').innerHTML = logs.user2.length > 0 ? logs.user2.join('<br>') : 'No logs yet.';
}

// Increment the streak
async function incrementStreak(user) {
    streaks[user]++;
    const currentTime = new Date().toLocaleString();
    logs[user].push(`[${currentTime}] Streak incremented: ${streaks[user]} days`);
    graphsData[user].push(streaks[user]); // Update graph data

    await setDoc(doc(db, "streaks", user), {
        streak: streaks[user],
        logs: logs[user],
        graphData: graphsData[user]
    });

    updateDisplay();
    updateGraph(user);
}

// Reset the streak
async function resetStreak(user) {
    streaks[user] = 0;
    logs[user].push(`[${new Date().toLocaleString()}] Streak reset to 0`);
    graphsData[user] = []; // Reset graph data
    
    await setDoc(doc(db, "streaks", user), {
        streak: streaks[user],
        logs: logs[user],
        graphData: graphsData[user]
    });

    updateDisplay();
    updateGraph(user);
}

// Clear logs
function clearLogs(user) {
    logs[user] = [];
    updateDisplay();
}

// Clear graph data
function clearGraph(user) {
    graphsData[user] = [];
    updateGraph(user);
}

// Load initial data from Firestore
async function loadData() {
    const docRef1 = doc(db, "streaks", "user1");
    const docRef2 = doc(db, "streaks", "user2");

    const docSnap1 = await getDoc(docRef1);
    const docSnap2 = await getDoc(docRef2);

    if (docSnap1.exists()) {
        streaks.user1 = docSnap1.data().streak;
        logs.user1 = docSnap1.data().logs;
        graphsData.user1 = docSnap1.data().graphData;
    }

    if (docSnap2.exists()) {
        streaks.user2 = docSnap2.data().streak;
        logs.user2 = docSnap2.data().logs;
        graphsData.user2 = docSnap2.data().graphData;
    }

    updateDisplay();
    updateGraph('user1');
    updateGraph('user2');
}

// Update the graph
function updateGraph(user) {
    const ctx = document.getElementById(`${user}Graph`).getContext('2d');

    if (graphs[user]) {
        graphs[user].destroy(); // Destroy previous graph if it exists
    }

    graphs[user] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: graphsData[user].map((_, index) => index + 1), // Create labels for each day
            datasets: [{
                label: 'Streak Days',
                data: graphsData[user],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Increment Count'
                    }
                }
            }
        }
    });
}

// Add functions to the window object for global access
window.incrementStreak = incrementStreak;
window.resetStreak = resetStreak;
window.clearLogs = clearLogs;
window.clearGraph = clearGraph;

// Call loadData to fetch the initial data
loadData();
