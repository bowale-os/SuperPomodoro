// ===========================
// Auth & Session Data Startup
// ===========================

// On page load, check session authentication & prompt if needed
window.addEventListener('load', async function() {
    // Fetch sessions; redirect to login if unauthorized
    const response = await fetch('/api/sessions');
    if (response.status === 401) {
        window.location.href = '/login';
        return;
    }

    // Retrieve active session from local storage
    const sessionRaw = sessionStorage.getItem('currentSession');
    const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;

    // If session exists, prompt user to start or dismiss
    if (currentSession && Object.keys(currentSession).length > 0) {
        let mainDiv = document.getElementById('emptyState');
        mainDiv.innerHTML = `
            <div id="sessionPrompt" class="session-prompt">
                <div class="prompt-content">
                    <div class="prompt-icon">⏰</div>
                    <h3>Use your Saved Session?</h3>
                    <p>You have an unstarted study session. Would you like to start it now?</p>
                    <div class="prompt-actions">
                        <button class="prompt-btn primary" onclick="StartSession()">Start Session</button>
                        <button class="prompt-btn secondary" onclick="dismissSavedSession()">Dismiss</button>
                    </div>
                </div>
            </div>
        `;
    }
});


// ===========================
// Form Conditional Input Logic
// ===========================

// Show/hide long break input based on shouldRepeat selection
document.addEventListener('DOMContentLoaded', function() {
    const shouldRepeatSelect = document.getElementById('shouldRepeat');
    const longBreakGroup = document.getElementById('longBreakGroup');

    // Toggle long break field visibility
    function toggleLongBreakGroupInput() {
        if (shouldRepeatSelect.value === 'yes') {
            longBreakGroup.style.display = '';
        } else {
            longBreakGroup.style.display = 'none';
        }
    }

    // Initial toggle & change listener
    toggleLongBreakGroupInput();
    shouldRepeatSelect.addEventListener('change', toggleLongBreakGroupInput);
});


// ===========================
// Session Lifecycle Functions
// ===========================

// Start a session (called from prompt)
async function StartSession() {
    // Get current session from storage
    const sessionRaw = sessionStorage.getItem('currentSession');
    const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;

    // API call: mark session as started
    const response = await fetch(`api/sessions/${currentSession._id}/start`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
    });

    if (response.ok) {
        const result = await response.json();
        console.log('Session started:', result);
    } else {
        const error = await response.json();
        console.error('Failed to start session:', error);
    }

    // Create then execute the study/break plan
    makeSessionPlan();
    const sessionPlan = JSON.parse(sessionStorage.getItem("sessionPlan"));
    executeSessionPlan(sessionPlan);
}

// Build the list of (study/break/long break) segments for the session
function makeSessionPlan() {
    let sessionPlan = [];
    let sessionData = JSON.parse(sessionStorage.getItem('currentSession'));

    // Build study/break cycles
    for (let i = 0; i < sessionData.numCycles; i++) {
        sessionPlan.push({ type: 'Study', minutes: sessionData.studyMins });
        if (i < sessionData.numCycles - 1) {
            sessionPlan.push({ type: 'Break', minutes: sessionData.breakMins });
        }
    }

    // Add long break if repeating
    if (sessionData.shouldRepeat === true) {
        sessionPlan.push({ type: 'Long Break', minutes: sessionData.longBreakMins });
    }

    sessionStorage.setItem('sessionPlan', JSON.stringify(sessionPlan));
}

// Run through the study/break/long break session plan
async function executeSessionPlan(sessionPlan) {
    const sessionRaw = sessionStorage.getItem('currentSession');
    const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;
    let current = 0;

    async function nextSegment() {
        const next = sessionPlan[current + 1] || null;
        if (current < sessionPlan.length) {
            displayCountdown(sessionPlan[current], nextSegment, next);
            current++;
        } else {
            // Session finished: patch as completed
            try {
                const response = await fetch(`api/sessions/${currentSession._id}/complete`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const result = await response.json();
                    console.log('Session was completed:', result);
                    document.getElementById('emptyState').innerHTML = "<div style='font-size:2rem'>Session complete! 🎉</div>";
                } else {
                    const error = await response.json();
                    console.error('Failed to store session as completed:', error);
                }
            } catch (err) {
                console.error('Network or code error:', error);
            }
        }
    }
    nextSegment();
}


// =========================
// UI Event & Modal Handlers
// =========================

// Create session - invoked from modal form
async function createSession() {
    const mainDiv = document.getElementById('emptyState');
    mainDiv.classList.add('hidden');
    const btn = document.getElementById('createSessionBtn');
    btn.classList.add('button--loading');

    try {
        // Collect values from the form / modal
        const sessionName = document.getElementById('sessionName').value;
        const studyMins = parseInt(document.getElementById('studyMins').value);
        const breakMins = parseInt(document.getElementById('breakMins').value);
        const numCycles = parseInt(document.getElementById('numCycles').value);
        const shouldRepeat = document.getElementById('shouldRepeat').value === 'yes';
        const longBreakMins = shouldRepeat ? parseInt(document.getElementById('longBreakMins').value) : null;

        // Compose session object
        const sessionData = { sessionName, studyMins, breakMins, numCycles, shouldRepeat, longBreakMins };
        console.log(sessionData);
        const sessionJson = JSON.stringify(sessionData);

        // API: send session to backend
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: sessionJson
        });
        const data = await response.json();
        console.log("About to save:", sessionData);

        // Save created session to storage and clean up modal
        sessionStorage.setItem('currentSession', JSON.stringify(data));
        alert(`session data was saved to session storage`);
        closeSessionModal();
        window.location.reload(); // (optional: manual page refresh)

    } catch (err) {
        alert(`Your session was not created. See the error message: ${err}`);
    }
}

function dismissSavedSession(){
    sessionStorage.setItem('currentSession', null);
    window.location.reload();
}

// ==========================
// Utility API/Event Handlers
// ==========================

// Helper: Get a break idea from backend
async function getBreakIdea() {
    const response = await fetch(`api/breakideas/`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    const breakIdea = await response.json();
    console.log(breakIdea);
    return breakIdea;
}

// Helper: display timer/countdown UI for study/break/long break
async function displayCountdown(segment, onComplete, nextSegment) {
    let breakIdea = null;
    if (segment.type === 'Break' || segment.type === 'Long Break') {
        breakIdea = await getBreakIdea();
    }

    // Get session and timer setup
    const sessionRaw = sessionStorage.getItem('currentSession');
    const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;
    let time = segment.minutes * 60;
    const countdownDisplay = document.getElementById('emptyState');
    let timer;

    // Helper: API call to stop session
    async function stopTimer() {
        const response = await fetch(`api/sessions/${currentSession._id}/cancel`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
            const result = await response.json();
            console.log('Session was cancelled:', result);
            clearInterval(timer);
            countdownDisplay.innerHTML = `${segment.type} stopped!`;
        } else {
            const error = await response.json();
            console.error('Failed to cancel session:', error);
        }
    }

    // Helper: skip to next segment
    function skipSegment() {
        clearInterval(timer);
        if (typeof onComplete === 'function') onComplete();
    }

    // Render timer and controls UI
    function render(breakIdea) {
        // Display break suggestion if applicable
        if (segment.type === 'Break' || segment.type === 'Long Break') {
            const aside = document.getElementById('aside');
            aside.innerHTML = (breakIdea && breakIdea.suggestion) ? breakIdea.suggestion : '';
        } else {
            aside.innerHTML = ``;
        }

        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        let nextHtml = nextSegment ? `
            <div style="margin-top:16px;font-size:1.08rem;color:#667eea;">
                Next: <b>${nextSegment.type}</b> – ${nextSegment.minutes} min
            </div>` : '';

        countdownDisplay.innerHTML = `
            <div style="font-size:2.6rem;margin-bottom:10px">${segment.type}: ${minutes}:${seconds.toString().padStart(2, '0')}</div>
            <div style="margin-top:14px">
                <button onclick="window._stopCountdown && window._stopCountdown()" class="control-btn" style="margin-right:8px;">Stop</button>
                <button onclick="window._skipCountdown && window._skipCountdown()" class="control-btn primary">Skip</button>
            </div>
            ${nextHtml}
        `;
    }

    // Expose segment control globally so UI can access them
    window._stopCountdown = stopTimer;
    window._skipCountdown = skipSegment;

    // Initial render, then start timer interval for countdown
    render(breakIdea);
    timer = setInterval(() => {
        time--;
        render(breakIdea);
        if (time < 0) {
            clearInterval(timer);
            if (typeof onComplete === 'function') onComplete();
        }
    }, 1000);
}


// ============================
// Modal/Session UI Management
// ============================

// Open study session modal
function openSessionModal() {
    document.getElementById('sessionModal').style.display = 'flex';
}

// Close study session modal & reset form
function closeSessionModal() {
    document.getElementById('sessionModal').style.display = 'none';
    document.getElementById('sessionForm').reset();
}

// Close modal when clicking outside modal content
document.addEventListener('click', (e) => {
    const modal = document.getElementById('sessionModal');
    if (e.target === modal) {
        closeSessionModal();
    }
});

// Close modal using Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSessionModal();
    }
});

// =====================
// Misc Utility/Styling
// =====================

// Cycle through available countdown font
function cycleFont() {
    fontOptions.forEach(font => countdownDisplay.classList.remove(font));
    currentFontIndex = (currentFontIndex + 1) % fontOptions.length;
    countdownDisplay.classList.add(fontOptions[currentFontIndex]);
    const fontNames = ['Comfortaa', 'Orbitron', 'Fredoka', 'Nunito'];
    document.getElementById('fontBtn').textContent = `🎨 ${fontNames[currentFontIndex]}`;
}

// Start a new session -- opens modal
function createNewSession() {
    openSessionModal();
}

// =====================
// Logout Function
// =====================

// API call to log out user
async function logout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        if (response.ok) {
            window.location.href = '/login';
        } else {
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Network error during logout.');
    }
}

// ===========================
// Initialization
// (Commented legacy code)
// ===========================

// timeLeft = parseInt(countdownDisplay.value) * 60;
// updateDefaultTimes();
// updateTimerDisplay();

