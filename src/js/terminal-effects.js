// Terminal Effects for Space Opera Hacker Website
// Author: Till "Toasty" Wegmüller

class TerminalEffects {
    constructor() {
        this.init();
    }

    init() {
        this.setupTypewriterEffects();
        this.setupGlitchEffects();
        this.setupTerminalCommands();
        this.setupMatrixRain();
        this.setupSystemMonitor();
    }

    // Typewriter effect for terminal prompts
    setupTypewriterEffects() {
        const typewriterElements = document.querySelectorAll('.typewriter');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.borderRight = '2px solid var(--neon-green)';
            
            let i = 0;
            const typeInterval = setInterval(() => {
                element.textContent += text.charAt(i);
                i++;
                
                if (i >= text.length) {
                    clearInterval(typeInterval);
                    setTimeout(() => {
                        element.style.borderRight = 'none';
                    }, 1000);
                }
            }, 100);
        });
    }

    // Random glitch effects for headings
    setupGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glow-text');
        
        setInterval(() => {
            const randomElement = glitchElements[Math.floor(Math.random() * glitchElements.length)];
            if (randomElement && Math.random() < 0.1) {
                this.glitchText(randomElement);
            }
        }, 2000);
    }

    glitchText(element) {
        const originalText = element.textContent;
        const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?0101010101';
        let glitchedText = '';
        
        for (let i = 0; i < originalText.length; i++) {
            if (Math.random() < 0.3) {
                glitchedText += glitchChars[Math.floor(Math.random() * glitchChars.length)];
            } else {
                glitchedText += originalText[i];
            }
        }
        
        element.textContent = glitchedText;
        element.style.color = 'var(--neon-orange)';
        
        setTimeout(() => {
            element.textContent = originalText;
            element.style.color = '';
        }, 100);
    }

    // Interactive terminal commands
    setupTerminalCommands() {
        const terminalInputs = document.querySelectorAll('.terminal-input');
        
        terminalInputs.forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.processCommand(input.value, input);
                }
            });
        });
    }

    processCommand(command, inputElement) {
        const output = inputElement.nextElementSibling;
        
        switch(command.toLowerCase().trim()) {
            case 'whoami':
                this.typeOutput(output, 'toasty@illumos.node: Systems Architect & Code Whisperer');
                break;
            case 'pwd':
                this.typeOutput(output, '/home/toasty/digital_realm');
                break;
            case 'ls':
                this.typeOutput(output, 'mission_logs/  projects/  coffee.sh*  dreams.txt  spice_must_flow.md');
                break;
            case 'cat spice_must_flow.md':
                this.typeOutput(output, '"He who controls the spice controls the universe." - Baron Harkonnen');
                break;
            case 'ps aux | grep motivation':
                this.typeOutput(output, 'toasty    1337  99.9  50.0  space_opera  coffee_driven  solving_problems');
                break;
            case 'uname -a':
                this.typeOutput(output, 'illumos illumos.node 5.11 omnios-r151046 i86pc i386 i86pc Solaris');
                break;
            case 'echo $FAVORITE_QUOTE':
                this.typeOutput(output, '"I must not fear bugs. Bugs are the mind-killer."');
                break;
            case 'clear':
                output.innerHTML = '';
                break;
            case 'help':
                this.typeOutput(output, 'Available commands: whoami, pwd, ls, ps, uname, echo $FAVORITE_QUOTE, clear\nTry typing them and pressing Enter!');
                break;
            default:
                this.typeOutput(output, `bash: ${command}: command not found\nType 'help' for available commands`);
        }
        
        inputElement.value = '';
    }

    typeOutput(element, text) {
        element.innerHTML = '';
        let i = 0;
        const typeInterval = setInterval(() => {
            element.innerHTML += text.charAt(i);
            i++;
            if (i >= text.length) {
                clearInterval(typeInterval);
            }
        }, 30);
    }

    // Matrix-style digital rain
    setupMatrixRain() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.id = 'matrix-canvas';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-2';
        canvas.style.opacity = '0.05';
        
        document.body.appendChild(canvas);
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|`]}";
        const matrixArray = matrix.split("");
        
        const fontSize = 10;
        const columns = canvas.width / fontSize;
        const drops = [];
        
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }
        
        function draw() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff41';
            ctx.font = fontSize + 'px monospace';
            
            for (let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        
        setInterval(draw, 35);
    }

    // System monitoring display
    setupSystemMonitor() {
        this.updateSystemStats();
        setInterval(() => this.updateSystemStats(), 5000);
    }

    updateSystemStats() {
        const cpuElement = document.getElementById('cpu-usage');
        const memoryElement = document.getElementById('memory-usage');
        const uptimeElement = document.getElementById('system-uptime');
        const processesElement = document.getElementById('active-processes');
        
        if (cpuElement) {
            const cpu = Math.floor(Math.random() * 100);
            cpuElement.textContent = `${cpu}%`;
            cpuElement.style.color = cpu > 80 ? 'var(--neon-orange)' : 'var(--neon-green)';
        }
        
        if (memoryElement) {
            const memory = Math.floor(Math.random() * 100);
            memoryElement.textContent = `${memory}%`;
            memoryElement.style.color = memory > 90 ? 'var(--neon-orange)' : 'var(--neon-cyan)';
        }
        
        if (processesElement) {
            const processes = Math.floor(Math.random() * 200) + 150;
            processesElement.textContent = processes;
        }
    }
}

// Konami Code easter egg
class KonamiCode {
    constructor() {
        this.sequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
        this.userInput = [];
        this.init();
    }

    init() {
        document.addEventListener('keydown', (e) => {
            this.userInput.push(e.code);
            
            if (this.userInput.length > this.sequence.length) {
                this.userInput.shift();
            }
            
            if (this.userInput.join(',') === this.sequence.join(',')) {
                this.activateEasterEgg();
                this.userInput = [];
            }
        });
    }

    activateEasterEgg() {
        // Create a temporary message
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: rgba(0, 0, 0, 0.9); color: var(--neon-green); 
                        padding: 2rem; border: 2px solid var(--neon-green); 
                        border-radius: 8px; z-index: 9999; text-align: center;
                        font-family: 'JetBrains Mono', monospace;">
                <h2 style="color: var(--neon-cyan); margin-bottom: 1rem;">🚀 KONAMI CODE ACTIVATED! 🚀</h2>
                <p>"The spice must flow, and so must the code!"</p>
                <p style="color: var(--neon-orange); margin-top: 1rem;">- Duke Leto Atreides (probably)</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="margin-top: 1rem; background: transparent; border: 1px solid var(--neon-green); 
                               color: var(--neon-green); padding: 0.5rem 1rem; cursor: pointer;">
                    Continue Mission
                </button>
            </div>
        `;
        
        document.body.appendChild(message);
        
        // Add some visual effects
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
            document.body.style.filter = '';
        }, 3000);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TerminalEffects();
    new KonamiCode();
    
    // Add interactive terminal to the page if it doesn't exist
    if (!document.querySelector('.interactive-terminal')) {
        const terminal = document.createElement('div');
        terminal.className = 'interactive-terminal fixed bottom-4 right-4 w-80 h-40 bg-black/90 border border-neon-green rounded-lg p-4 font-mono text-sm hidden';
        terminal.innerHTML = `
            <div class="text-neon-green mb-2">[INTERACTIVE TERMINAL]</div>
            <div class="text-neon-cyan mb-2">toasty@illumos.node:~$ <span class="blink">_</span></div>
            <input type="text" class="terminal-input bg-transparent border-none outline-none text-neon-green w-full" placeholder="Type 'help' for commands...">
            <div class="terminal-output text-neon-cyan text-xs mt-2 max-h-20 overflow-y-auto"></div>
            <button onclick="this.parentElement.classList.toggle('hidden')" class="absolute top-2 right-2 text-neon-orange hover:text-neon-red">×</button>
        `;
        
        document.body.appendChild(terminal);
        
        // Add toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'fixed bottom-4 right-4 bg-black/80 border border-neon-green text-neon-green px-3 py-2 rounded font-mono text-sm hover:bg-neon-green hover:text-black transition-all';
        toggleButton.textContent = '> TERMINAL';
        toggleButton.onclick = () => terminal.classList.toggle('hidden');
        
        document.body.appendChild(toggleButton);
    }
});

// Add some fun console messages
console.log(`
╔══════════════════════════════════════════════════════════════════╗
║  Welcome to Toasty's Terminal - Developer Console Activated     ║
║                                                                  ║
║  "I must not fear bugs. Bugs are the mind-killer."             ║
║                                                                  ║
║  Try the Konami Code: ↑↑↓↓←→←→BA                                ║
║  Or explore the interactive terminal in the bottom-right!       ║
╚══════════════════════════════════════════════════════════════════╝
`);