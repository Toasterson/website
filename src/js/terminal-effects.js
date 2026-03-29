// Obsidian HUD — Ambient Effects
// Author: Till "Toasty" Wegmueller

class ObsidianHUD {
    constructor() {
        this.init();
    }

    init() {
        this.setupSystemMonitor();
        this.setupFadeInObserver();
    }

    // System monitoring display — subtle HUD readout
    setupSystemMonitor() {
        this.updateSystemStats();
        setInterval(() => this.updateSystemStats(), 8000);
    }

    updateSystemStats() {
        const cpuEl = document.getElementById('cpu-usage');
        const memEl = document.getElementById('mem-usage');

        if (cpuEl) {
            const cpu = (8 + Math.random() * 20).toFixed(1);
            cpuEl.textContent = cpu + '%';
        }

        if (memEl) {
            const mem = (3.2 + Math.random() * 4).toFixed(1);
            memEl.textContent = mem + 'GB';
        }
    }

    // Intersection Observer for staggered fade-in
    setupFadeInObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.data-plate, .log-entry').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(8px)';
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            observer.observe(el);
        });
    }
}

// Konami Code easter egg — kept for fun
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
                this.activate();
                this.userInput = [];
            }
        });
    }

    activate() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            display: flex; align-items: center; justify-content: center;
            background: rgba(13, 20, 24, 0.95);
            backdrop-filter: blur(16px);
            font-family: "Space Grotesk", sans-serif;
            cursor: pointer;
        `;
        overlay.innerHTML = `
            <div style="text-align: center; max-width: 400px; padding: 2rem;">
                <div style="color: #60e055; font-size: 2rem; font-weight: 700; margin-bottom: 1rem;
                            text-shadow: 0 0 12px rgba(96, 224, 85, 0.4);">
                    KONAMI CODE ACTIVATED
                </div>
                <p style="color: #bdcbb5; line-height: 1.6;">
                    "The spice must flow, and so must the code!"
                </p>
                <p style="color: #efb0ff; margin-top: 0.75rem; font-size: 0.875rem;">
                    — Duke Leto Atreides (probably)
                </p>
                <div style="margin-top: 1.5rem; color: #879581; font-family: 'JetBrains Mono', monospace;
                            font-size: 0.75rem;">
                    Click anywhere to continue
                </div>
            </div>
        `;
        overlay.addEventListener('click', () => overlay.remove());
        document.body.appendChild(overlay);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ObsidianHUD();
    new KonamiCode();
});
