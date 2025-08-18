// Developers Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations and interactions
    initializeAnimations();
    initializeCardInteractions();
    initializeScrollEffects();
    initializeParallaxEffects();
    
    // Add loading animation
    addLoadingAnimation();
});

// Initialize page animations
function initializeAnimations() {
    // Animate elements on page load
    const animatedElements = document.querySelectorAll('[data-aos]');
    
    animatedElements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('aos-animate');
        }, index * 200);
    });
    
    // Add entrance animations for developer cards
    const developerCards = document.querySelectorAll('.developer-card');
    developerCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Initialize 3D card interactions
function initializeCardInteractions() {
    const developerCards = document.querySelectorAll('.developer-card');
    
    developerCards.forEach(card => {
        const cardWrapper = card.querySelector('.card-3d-wrapper');
        
        // Mouse move effect for 3D tilt
        card.addEventListener('mousemove', function(e) {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            if (!card.classList.contains('flipped')) {
                cardWrapper.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        });
        
        // Reset transform on mouse leave
        card.addEventListener('mouseleave', function() {
            if (!card.classList.contains('flipped')) {
                cardWrapper.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
            }
        });
        
        // Click to flip card
        card.addEventListener('click', function() {
            if (!card.classList.contains('flipped')) {
                card.classList.add('flipped');
                cardWrapper.style.transform = 'perspective(1000px) rotateY(180deg)';
            } else {
                card.classList.remove('flipped');
                cardWrapper.style.transform = 'perspective(1000px) rotateY(0deg)';
            }
        });
        
        // Add hover sound effect (optional)
        card.addEventListener('mouseenter', function() {
            addHoverEffect(card);
        });
    });
}

// Initialize scroll effects
function initializeScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const parallaxElements = document.querySelectorAll('.floating-shapes .shape');
        
        parallaxElements.forEach((shape, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            shape.style.transform = `translateY(${yPos}px) rotate(${scrolled * 0.1}deg)`;
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Initialize parallax effects
function initializeParallaxEffects() {
    const header = document.querySelector('.header');
    const mainContent = document.querySelector('.main-content');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        header.style.transform = `translateY(${rate}px)`;
        mainContent.style.transform = `translateY(${rate * 0.3}px)`;
    });
}

// Add loading animation
function addLoadingAnimation() {
    const body = document.body;
    body.style.opacity = '0';
    
    // Create loading screen
    const loadingScreen = document.createElement('div');
    loadingScreen.className = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <div class="loading-logo">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <div class="loading-text">Loading Developers...</div>
            <div class="loading-spinner"></div>
        </div>
    `;
    
    // Add loading styles
    const loadingStyles = `
        .loading-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.5s ease;
        }
        
        .loading-content {
            text-align: center;
            color: white;
        }
        
        .loading-logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 2rem;
            animation: pulse 2s infinite;
        }
        
        .loading-logo svg {
            width: 100%;
            height: 100%;
            color: white;
        }
        
        .loading-text {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 2rem;
            animation: fadeInOut 2s infinite;
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes fadeInOut {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = loadingStyles;
    document.head.appendChild(styleSheet);
    
    // Add loading screen to body
    body.appendChild(loadingScreen);
    
    // Simulate loading time and remove loading screen
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.remove();
            body.style.opacity = '1';
            body.style.transition = 'opacity 0.5s ease';
        }, 500);
    }, 2000);
}

// Add hover effects
function addHoverEffect(card) {
    // Add ripple effect
    const ripple = document.createElement('div');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1000;
    `;
    
    const rect = card.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = rect.width / 2;
    const y = rect.height / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x - size / 2 + 'px';
    ripple.style.top = y - size / 2 + 'px';
    
    card.appendChild(ripple);
    
    // Add ripple animation styles
    if (!document.getElementById('ripple-styles')) {
        const rippleStyles = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ripple-styles';
        styleSheet.textContent = rippleStyles;
        document.head.appendChild(styleSheet);
    }
    
    // Remove ripple after animation
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add floating animation to skill tags
function initializeSkillAnimations() {
    const skillTags = document.querySelectorAll('.skill-tag');
    
    skillTags.forEach((tag, index) => {
        tag.style.animationDelay = `${index * 0.1}s`;
        tag.style.animation = 'float 3s ease-in-out infinite';
    });
}

// Add typing effect to developer names
function initializeTypingEffect() {
    const developerNames = document.querySelectorAll('.developer-name');
    
    developerNames.forEach((name, index) => {
        const text = name.textContent;
        name.textContent = '';
        name.style.borderRight = '2px solid white';
        name.style.animation = 'blink 1s infinite';
        
        let i = 0;
        const typeWriter = () => {
            if (i < text.length) {
                name.textContent += text.charAt(i);
                i++;
                setTimeout(typeWriter, 100 + index * 50);
            } else {
                name.style.borderRight = 'none';
                name.style.animation = 'none';
            }
        };
        
        setTimeout(() => {
            typeWriter();
        }, index * 500);
    });
    
    // Add typing animation styles
    const typingStyles = `
        @keyframes blink {
            0%, 50% { border-color: white; }
            51%, 100% { border-color: transparent; }
        }
    `;
    
    if (!document.getElementById('typing-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'typing-styles';
        styleSheet.textContent = typingStyles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize all animations after a delay
setTimeout(() => {
    initializeSkillAnimations();
    initializeTypingEffect();
}, 1000);

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add intersection observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe all animated elements
document.querySelectorAll('.developer-card, .credentials-card').forEach(el => {
    observer.observe(el);
});

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    const developerCards = document.querySelectorAll('.developer-card');
    const currentIndex = Array.from(developerCards).findIndex(card => 
        card.classList.contains('focused')
    );
    
    switch(e.key) {
        case 'ArrowRight':
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % developerCards.length;
            focusCard(developerCards, currentIndex, nextIndex);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            const prevIndex = currentIndex <= 0 ? developerCards.length - 1 : currentIndex - 1;
            focusCard(developerCards, currentIndex, prevIndex);
            break;
        case 'Enter':
        case ' ':
            e.preventDefault();
            if (currentIndex >= 0) {
                developerCards[currentIndex].click();
            }
            break;
        case 'Escape':
            developerCards.forEach(card => card.classList.remove('focused'));
            break;
    }
});

function focusCard(cards, currentIndex, newIndex) {
    if (currentIndex >= 0) {
        cards[currentIndex].classList.remove('focused');
    }
    cards[newIndex].classList.add('focused');
    cards[newIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Add focus styles
const focusStyles = `
    .developer-card.focused {
        outline: 3px solid rgba(255, 255, 255, 0.8);
        outline-offset: 5px;
        transform: scale(1.05);
    }
    
    .developer-card.focused .card-3d-wrapper {
        transform: perspective(1000px) rotateX(5deg) rotateY(5deg) scale(1.05);
    }
`;

if (!document.getElementById('focus-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'focus-styles';
    styleSheet.textContent = focusStyles;
    document.head.appendChild(styleSheet);
}

// Global functions for HTML onclick handlers

function goBack() {
    // Add fade out effect
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        // Go back to the previous page or to index.html
        if (document.referrer && document.referrer.includes('adminlogin.html')) {
            window.location.href = 'adminlogin.html';
        } else if (document.referrer && document.referrer.includes('userlogin.html')) {
            window.location.href = 'userlogin.html';
        } else {
            window.location.href = 'index.html';
        }
    }, 300);
}

// Add page visibility API for better performance
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause animations when page is not visible
        document.body.style.animationPlayState = 'paused';
    } else {
        // Resume animations when page becomes visible
        document.body.style.animationPlayState = 'running';
    }
});

// Add performance optimization
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        // Recalculate positions and sizes after resize
        const developerCards = document.querySelectorAll('.developer-card');
        developerCards.forEach(card => {
            card.style.transform = 'none';
        });
    }, 250);
});
