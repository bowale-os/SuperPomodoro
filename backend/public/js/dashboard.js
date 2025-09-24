
        window.onload = async function() {
        const response = await fetch('/api/sessions');
        if (response.status === 401) {
            window.location.href = '/login';
            return;
        }

        const sessionRaw = sessionStorage.getItem('currentSession');
        const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;

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
                            <button class="prompt-btn secondary" onclick="dismissSessionPrompt()">Dismiss</button>
                        </div>
                    </div>
                </div>
            `;
        }
    }


    async function StartSession(){
        // Parse currentSession inside the function!
        const sessionRaw = sessionStorage.getItem('currentSession');
        const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;
        const response = await fetch(`api/sessions/${currentSession._id}/start`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Session started:', result);
        } else {
            const error = await response.json();
            console.error('Failed to start session:', error);
        }
        makeSessionPlan()
        const sessionPlan = JSON.parse(sessionStorage.getItem("sessionPlan"));
        executeSessionPlan(sessionPlan);
    }


function makeSessionPlan() {
    let sessionPlan = [];
    let sessionData = JSON.parse(sessionStorage.getItem('currentSession'));

    // Add cycles (Study + Break, but no break after last study)
    for (let i = 0; i < sessionData.numCycles; i++) {
        sessionPlan.push({ type: 'Study', minutes: sessionData.studyMins });
        if (i < sessionData.numCycles - 1) {
            sessionPlan.push({ type: 'Break', minutes: sessionData.breakMins });
        }
    }

    // If repeating, add a Long Break at the end
    if (sessionData.shouldRepeat === true) {
        sessionPlan.push({ type: 'Long Break', minutes: 30 });
    }

    sessionStorage.setItem('sessionPlan', JSON.stringify(sessionPlan));
}





async function executeSessionPlan(sessionPlan) {
    const sessionRaw = sessionStorage.getItem('currentSession');
    const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;
 
    let current = 0;
    async function nextSegment() {
    const next = sessionPlan[current + 1] || null; // 👈 this defines next!
    if (current < sessionPlan.length) {
        displayCountdown(sessionPlan[current], nextSegment, next); // pass next segment info!
        current++;
    } else {
        //SESSION COMPLETE: CALL PATCH API
        try{
            const response = await fetch(`api/sessions/${currentSession._id}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Session was completed:', result);
                document.getElementById('emptyState').innerHTML = "<div style='font-size:2rem'>Session complete! 🎉</div>";    

            } else {
                const error = await response.json();
                console.error('Failed to store session as completed:', error);
            }
        }catch (err) {
            console.error('Network or code error:', error);
        }
    }
    }
    nextSegment();
}


function displayCountdown(segment, onComplete, nextSegment) {
    const sessionRaw = sessionStorage.getItem('currentSession');
    const currentSession = sessionRaw ? JSON.parse(sessionRaw) : null;
 
    let time = segment.minutes * 60;
    const countdownDisplay = document.getElementById('emptyState');
    let timer;

    // Helper to stop the timer and optionally go to next segment
    async function stopTimer() {
        const response = await fetch(`api/sessions/${currentSession._id}/cancel`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
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

    function skipSegment() {
        clearInterval(timer);
        if (typeof onComplete === 'function') onComplete();
    }

    function render() {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        let nextHtml = '';
        if (nextSegment) {
            nextHtml = `
                <div style="margin-top:16px;font-size:1.08rem;color:#667eea;">
                  Next: <b>${nextSegment.type}</b> – ${nextSegment.minutes} min
                </div>`;
        }

        countdownDisplay.innerHTML = `
            <div style="font-size:2.6rem;margin-bottom:10px">${segment.type}: ${minutes}:${seconds.toString().padStart(2, '0')}</div>
            <div style="margin-top:14px">
                <button onclick="window._stopCountdown && window._stopCountdown()" class="control-btn" style="margin-right:8px;">Stop</button>
                <button onclick="window._skipCountdown && window._skipCountdown()" class="control-btn primary">Skip</button>
            </div>
            ${nextHtml}
        `;
    }

    // Expose control functions globally for button onclick use
    window._stopCountdown = stopTimer;
    window._skipCountdown = skipSegment;

    render(); // Update UI first frame
    timer = setInterval(() => {
        time--;
        render();
        if (time < 0) {
            clearInterval(timer);
            if (typeof onComplete === 'function') onComplete();
        }
    }, 1000);
}





// DOM elements
//createsession function
// Create session from modal
async function createSession(){
    mainDiv = document.getElementById('emptyState');
    mainDiv.classList.add('hidden');
    const btn = document.getElementById('createSessionBtn');
    btn.classList.add('button--loading');
    try {
        const sessionName = document.getElementById('sessionName').value;
        const studyMins = document.getElementById('studyMins').value;
        const breakMins = document.getElementById('breakMins').value;
        const numCycles = document.getElementById('numCycles').value;
        const shouldRepeat = document.getElementById('shouldRepeat').value === 'yes';
  
        sessionData = {
            sessionName,
            studyMins,
            breakMins,
            numCycles,
            shouldRepeat
        };
        console.log(sessionData);

        const sessionJson = JSON.stringify(sessionData);

        //api/session call
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json'
            },
            body: sessionJson
        });
        const data = await response.json();
        sessionStorage.setItem('currentSession', JSON.stringify(data));
        alert(`session data was saved to session storage`);
        closeSessionModal();
        window.location.reload();

    }catch (err) {
        alert(`Your sesssion was not created. See the error message: ${err}`)
    }
}



// Logout function
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


// Start new session function - now opens modal
function createNewSession() {
    openSessionModal();
}

// Modal functions
function openSessionModal() {
    document.getElementById('sessionModal').style.display = 'flex';
}

function closeSessionModal() {
    document.getElementById('sessionModal').style.display = 'none';
    // Reset form
    document.getElementById('sessionForm').reset();
}

// Cycle through different fonts
function cycleFont() {
    // Remove current font class
    fontOptions.forEach(font => countdownDisplay.classList.remove(font));
    
    // Move to next font
    currentFontIndex = (currentFontIndex + 1) % fontOptions.length;
    
    // Add new font class
    countdownDisplay.classList.add(fontOptions[currentFontIndex]);
    
    // Update button text to show current font
    const fontNames = ['Comfortaa', 'Orbitron', 'Fredoka', 'Nunito'];
    document.getElementById('fontBtn').textContent = `🎨 ${fontNames[currentFontIndex]}`;
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('sessionModal');
    if (e.target === modal) {
        closeSessionModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeSessionModal();
    }
});

// Initialize
timeLeft = parseInt(countdownDisplay.value) * 60;
updateDefaultTimes();
updateTimerDisplay();