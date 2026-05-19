// Startup sequence data
const startupCommands = [
    { text: 'npm install cybersec-scanner@latest', delay: 500 },
    { text: '✓ Installing security modules...', delay: 800 },
    { text: 'npm install threat-detector@2.1.0', delay: 600 },
    { text: '✓ Loading threat detection engine...', delay: 700 },
    { text: 'npm install vulnerability-scanner@3.0.1', delay: 650 },
    { text: '✓ Initializing vulnerability scanner...', delay: 750 },
    { text: 'npm install ssl-analyzer@1.5.2', delay: 550 },
    { text: '✓ SSL/TLS analyzer ready...', delay: 600 },
    { text: 'npm install phishing-detector@4.2.0', delay: 700 },
    { text: '✓ Phishing detection active...', delay: 650 },
    { text: '', delay: 300 },
    { text: '🚀 CyberSec Platform initialized successfully!', delay: 800 },
    { text: '🔒 All security modules loaded and ready.', delay: 500 }
];

// Initialize startup sequence
document.addEventListener('DOMContentLoaded', function() {
    startupSequence();
});

async function startupSequence() {
    const terminalOutput = document.getElementById('terminalOutput');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (!terminalOutput || !progressFill || !progressText) {
        return;
    }
    
    let currentProgress = 0;
    const progressStep = 100 / startupCommands.length;
    
    for (let i = 0; i < startupCommands.length; i++) {
        const command = startupCommands[i];
        
        // Update progress
        currentProgress += progressStep;
        progressFill.style.width = `${Math.min(currentProgress, 100)}%`;
        
        // Update progress text
        if (command.text.includes('npm install')) {
            progressText.textContent = `Installing ${command.text.split(' ')[2]}...`;
        } else if (command.text.includes('✓')) {
            progressText.textContent = command.text;
        } else if (command.text.includes('🚀')) {
            progressText.textContent = 'Startup complete!';
        }
        
        // Add command to terminal
        if (command.text) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            
            if (command.text.includes('npm install')) {
                line.innerHTML = `<span class="prompt">cybersec@platform:~$</span> ${command.text}`;
            } else {
                line.innerHTML = command.text;
                if (command.text.includes('✓')) {
                    line.style.color = '#00ff00';
                } else if (command.text.includes('🚀') || command.text.includes('🔒')) {
                    line.style.color = '#00d4ff';
                }
            }
            
            terminalOutput.appendChild(line);
            
            // Auto scroll terminal
            const terminalBody = document.querySelector('.terminal-body');
            if (terminalBody) {
                terminalBody.scrollTop = terminalBody.scrollHeight;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, command.delay));
    }
    
    // Complete progress
    progressFill.style.width = '100%';
    progressText.textContent = 'Ready to secure your digital world!';
    
    // Wait a bit then show welcome screen
    setTimeout(() => {
        const startupScreen = document.getElementById('startupScreen');
        const welcomeScreen = document.getElementById('welcomeScreen');
        
        if (startupScreen) {
            startupScreen.style.display = 'none';
        }
        
        // Check if user is already logged in
        if (authToken) {
            checkAuthStatus().then(() => {
                if (currentUser) {
                    // User is logged in, redirect to main
                    showNotification('Welcome back! Redirecting...', 'success');
                    setTimeout(() => {
                        window.location.href = 'main.html';
                    }, 1000);
                    return;
                }
                // Show welcome screen if token is invalid
                if (welcomeScreen) {
                    welcomeScreen.style.display = 'flex';
                }
            }).catch(() => {
                // Token is invalid, show welcome screen
                if (welcomeScreen) {
                    welcomeScreen.style.display = 'flex';
                }
            });
        } else {
            // Show welcome screen
            if (welcomeScreen) {
                welcomeScreen.style.display = 'flex';
            }
        }
    }, 1500);
}