// Construction helmet animation
let helmetAnimation;
let animationActive = false;

function startHelmetAnimation() {
    if (animationActive) return;
    
    animationActive = true;
    const helmet = document.getElementById('constructionHelmet');
    
    // Clear any existing content
    helmet.innerHTML = '';
    
    // Create the helmet SVG
    const helmetSVG = `
    <path id="helmet-body" d="M50,85 C70,85 85,70 85,50 C85,30 70,15 50,15 C30,15 15,30 15,50 C15,70 30,85 50,85 Z" fill="#F59E0B" stroke="#000" stroke-width="2" />
    <path id="helmet-brim" d="M15,50 C15,50 25,55 50,55 C75,55 85,50 85,50" fill="none" stroke="#000" stroke-width="2" />
    <path id="helmet-band" d="M25,40 C25,40 35,45 50,45 C65,45 75,40 75,40" fill="none" stroke="#FFFFFF" stroke-width="2" />
    <circle id="helmet-light" cx="50" cy="30" r="5" fill="#FFFFFF" stroke="#000" stroke-width="1" />
    `;
    
    helmet.innerHTML = helmetSVG;
    
    // Animation parameters
    let time = 0;
    const helmetBody = document.getElementById('helmet-body');
    const helmetLight = document.getElementById('helmet-light');
    
    // Animation loop
    helmetAnimation = setInterval(() => {
        time += 0.05;
        
        // Bob up and down
        const bob = Math.sin(time * 2) * 3;
        helmet.style.transform = `translateY(${bob}px)`;
        
        // Pulse the light
        const lightPulse = Math.sin(time * 5) * 0.5 + 0.5;
        helmetLight.style.opacity = lightPulse;
        
        // Change helmet color slightly
        const hue = (time * 5) % 30;
        helmetBody.style.fill = `hsl(${hue + 35}, 90%, 50%)`;
        
    }, 30);
}

function stopHelmetAnimation() {
    if (!animationActive) return;
    
    clearInterval(helmetAnimation);
    animationActive = false;
}
