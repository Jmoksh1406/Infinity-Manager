document.addEventListener("DOMContentLoaded", () => {
    fetchRounds();
    setInterval(fetchRounds, 10000); 
    initParticles();
    initBinaryRain();
});

// ===== PARTICLE ANIMATION =====
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const count = 80;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: Math.random() * 2 + 0.5,
            color: Math.random() > 0.5 ? 'rgba(0, 229, 255,' : 'rgba(168, 85, 247,',
            opacity: Math.random() * 0.5 + 0.1
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.opacity + ')';
            ctx.fill();

            // Draw connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(0, 229, 255, ${0.06 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        requestAnimationFrame(animate);
    }
    animate();
}

// ===== BINARY RAIN =====
function initBinaryRain() {
    const container = document.getElementById('binary-rain');
    if (!container) return;

    const cols = Math.floor(window.innerWidth / 40);
    
    for (let i = 0; i < cols; i++) {
        const column = document.createElement('div');
        column.className = 'binary-column';
        
        // Mix of binary, hex, and crypto symbols
        const chars = ['0', '1', '₿', 'Ξ', '⟨', '⟩', '#', '0', '1', '0', '1', '◊', '0', '1'];
        let text = '';
        const length = Math.floor(Math.random() * 20) + 10;
        for (let j = 0; j < length; j++) {
            text += chars[Math.floor(Math.random() * chars.length)] + ' ';
        }
        column.textContent = text;
        
        column.style.left = `${(i / cols) * 100}%`;
        column.style.animationDuration = `${Math.random() * 15 + 10}s`;
        column.style.animationDelay = `${Math.random() * 10}s`;
        column.style.fontSize = `${Math.random() * 6 + 10}px`;
        
        container.appendChild(column);
    }
}

// ===== STUDENT VIEW =====
async function fetchRounds() {
    try {
        const response = await fetch('/api/rounds');
        const rounds = await response.json();
        
        const container = document.getElementById('rounds-container');
        if (container) {
            container.innerHTML = '';
            rounds.forEach(round => {
                const card = document.createElement('div');
                card.className = `round-card ${round.locked ? 'locked' : ''}`;
                
                const icon = round.locked ? '🔒' : '⚡';
                const statusClass = round.locked ? 'status-locked' : 'status-unlocked';
                const statusText = round.locked ? 'Locked' : 'Active';

                card.innerHTML = `
                    <div class="round-icon">${icon}</div>
                    <h3 class="round-title">${round.name}</h3>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                `;
                
                if (!round.locked) {
                    card.onclick = () => window.location.href = `/api/go/${round.id}`;
                }
                container.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error fetching rounds:', error);
    }
}
