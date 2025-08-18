// Landing Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Add click effects to option cards
    const optionCards = document.querySelectorAll('.option-card');
    
    optionCards.forEach(card => {
        card.addEventListener('click', function() {
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
        
        // Add keyboard navigation
        card.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.click();
            }
        });
        
        // Make cards focusable
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', card.querySelector('h3').textContent + ' login option');
    });

    // Add smooth scroll effect for info cards
    const infoCards = document.querySelectorAll('.info-card');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    infoCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add parallax effect to floating shapes
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const shapes = document.querySelectorAll('.shape');
        
        shapes.forEach((shape, index) => {
            const speed = 0.5 + (index * 0.1);
            const yPos = -(scrolled * speed);
            shape.style.transform = `translateY(${yPos}px)`;
        });
    });

    // Add mouse move effect for interactive elements
    document.addEventListener('mousemove', function(e) {
        const cards = document.querySelectorAll('.option-card');
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardX = rect.left + rect.width / 2;
            const cardY = rect.top + rect.height / 2;
            
            const deltaX = mouseX - cardX;
            const deltaY = mouseY - cardY;
            
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const maxDistance = 200;
            
            if (distance < maxDistance) {
                const intensity = (maxDistance - distance) / maxDistance;
                const rotateX = (deltaY / maxDistance) * 10 * intensity;
                const rotateY = (deltaX / maxDistance) * 10 * intensity;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
            } else {
                card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
            }
        });
    });

    // Add loading animation
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Redirect functions
function redirectToAdmin() {
    // Add loading state
    const adminCard = document.querySelector('.admin-option');
    adminCard.style.pointerEvents = 'none';
    
    // Show loading animation
    const originalContent = adminCard.innerHTML;
    adminCard.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Redirecting to Admin Login...</p>
        </div>
    `;
    
    // Simulate loading delay
    setTimeout(() => {
        window.location.href = 'adminlogin.html';
    }, 1000);
}

function redirectToUser() {
    // Add loading state
    const userCard = document.querySelector('.user-option');
    userCard.style.pointerEvents = 'none';
    
    // Show loading animation
    const originalContent = userCard.innerHTML;
    userCard.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Redirecting to User Login...</p>
        </div>
    `;
    
    // Simulate loading delay
    setTimeout(() => {
        window.location.href = 'userlogin.html';
    }, 1000);
}

// Add loading spinner styles dynamically
const loadingStyles = `
    .loading-spinner {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        text-align: center;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        border-top: 3px solid #ffffff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loading-spinner p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.9rem;
        margin: 0;
    }
`;

// Inject loading styles
const styleSheet = document.createElement('style');
styleSheet.textContent = loadingStyles;
document.head.appendChild(styleSheet);

// Add smooth page transitions
document.addEventListener('DOMContentLoaded', function() {
    // Add page load animation
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + A for Admin
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        redirectToAdmin();
    }
    
    // Ctrl/Cmd + U for User
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        redirectToUser();
    }
    
    // Escape to reset any hover effects
    if (e.key === 'Escape') {
        const cards = document.querySelectorAll('.option-card');
        cards.forEach(card => {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
        });
    }
});

// Add touch support for mobile devices
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', function(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Detect swipe gestures
    if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // Horizontal swipe
            if (deltaX > 0) {
                // Swipe right - could be used for navigation
                console.log('Swipe right detected');
            } else {
                // Swipe left - could be used for navigation
                console.log('Swipe left detected');
            }
        } else {
            // Vertical swipe
            if (deltaY > 0) {
                // Swipe down
                console.log('Swipe down detected');
            } else {
                // Swipe up
                console.log('Swipe up detected');
            }
        }
    }
});
