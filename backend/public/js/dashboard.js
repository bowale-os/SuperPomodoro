const currentSession = JSON.parse(sessionStorage.getItem('currentSession')) || [];

if (currentSession){
    let mainDiv = document.getElementById('emptyState');
    mainDiv.innerHTML = `
        <button id="start-session-btn" onclick="StartSession()">Do you want to start your session?</button>
    `
}

function StartSession(){
    const sessionData = sessionStorage.getItem("sessionData");
    if (sessionData) {
        makeSessionPlan()
        const sessionPlan = JSON.parse(sessionStorage.getItem("sessionPlan"));
        // Start your session (replace with your actual function)
        executeSessionPlan(sessionPlan);
    } else {
        alert("No session plan found. Please create a plan first.");
    }
}

function makeSessionPlan(){
    let sessionPlan = [];
    let sessionData = JSON.parse(getItem('currentSession'));
    for(let i=0; i < sessionData.numCycles; i++){
        sessionPlan.push({type: 'Study', minutes: sessionData.studyMins });
        if (i < sessionData.numCycles - 1){
            sessionPlan.push({type: 'Break', minutes: sessionData.breakMins });
        }
    }
    sessionStorage.setItem('sessionPlan', JSON.stringify(sessionPlan));
}

function executeSessionPlan(sessionPlan){
    sessionPlan.forEach(segment => {
        displayCountdown(segment);
    });
}



function displayCountdown(segment){
    let time = segment.minutes * 60;
    const countdownDisplay = document.getElementById('countdown-display');
    const timer = setInterval(() => {
        let minutes = Math.floor(time / 60);
        let seconds = time % 60;
        countdownDisplay.innerHTML = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        time--;
        if (time < 0) clearInterval(timer);
    }, 1000);
}


// DOM elements
// createsession function
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
        
        sessionData = {
            sessionName,
            studyMins,
            breakMins,
            numCycles
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
        makeSessionPlan();

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
timeLeft = parseInt(timeDropdown.value) * 60;
updateDefaultTimes();
updateTimerDisplay();