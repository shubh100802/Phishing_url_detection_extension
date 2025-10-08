// Admin Login JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('adminLoginForm');
    const loginBtn = document.getElementById('loginBtn');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const rememberCheckbox = document.getElementById('remember');

    // Backend API bases (tries port from query ?port=, then 3001, then 3000)
    const API_PORTS = [Number(location.search.match(/port=(\d+)/)?.[1]) || null, 3001, 3000].filter(Boolean);
    const API_BASES = API_PORTS.map(p => `http://localhost:${p}`);

    // Load saved credentials if "Remember me" was checked
    loadSavedCredentials();

    // Form submission handler
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        handleLogin();
    });

    // Enter key handler for form inputs
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleLogin();
            }
        });

        // Add focus effects
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });

        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });

    // Password visibility toggle
    const passwordToggle = document.querySelector('.password-toggle');
    passwordToggle.addEventListener('click', function() {
        togglePassword();
    });

    // Add input validation feedback
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', function() {
            validateInput(this);
        });
    });

    // Login function
    async function handleLogin() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();
        const remember = rememberCheckbox.checked;

        // Basic validation
        if (!username || !password) {
            showError('Please fill in all fields');
            return;
        }

        // Show loading state
        setLoadingState(true);

        try {
            const payload = { username, password };
            const res = await tryFetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (!res.ok) {
                const data = await safeJson(res);
                throw new Error(data?.message || 'Login failed');
            }

            const data = await res.json();

            // Remember only the username locally if requested (never store password)
            if (remember) {
                saveCredentials(username, '');
            } else {
                clearSavedCredentials();
            }

            // Persist auth
            try {
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
            } catch {}

            // Success animation and redirect
            showSuccessAnimation();
            setTimeout(() => {
                window.location.href = 'admin-dashboard/index.html';
            }, 800);
        } catch (err) {
            setLoadingState(false);
            showError(err.message || 'Login failed');
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
        }
    }

    // Helpers to call backend
    async function tryFetch(path, options) {
        let lastErr;
        for (const base of API_BASES) {
            try {
                const r = await fetch(base + path, options);
                return r;
            } catch (e) {
                lastErr = e;
            }
        }
        throw lastErr || new Error('Network error');
    }
    async function safeJson(res) { try { return await res.json(); } catch { return null; } }

    // Set loading state
    function setLoadingState(loading) {
        if (loading) {
            loginBtn.classList.add('loading');
            loginBtn.disabled = true;
        } else {
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    }

    // Show error message
    function showError(message) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            closeModal();
        }, 5000);
    }

    // Show success animation
    function showSuccessAnimation() {
        // Create success checkmark
        const checkmark = document.createElement('div');
        checkmark.className = 'success-checkmark';
        checkmark.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        loginBtn.appendChild(checkmark);
        
        // Add success styles
        const successStyles = `
            .success-checkmark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 24px;
                height: 24px;
                color: white;
                animation: checkmarkAppear 0.5s ease;
            }
            
            @keyframes checkmarkAppear {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
        `;
        
        // Inject success styles
        if (!document.getElementById('success-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'success-styles';
            styleSheet.textContent = successStyles;
            document.head.appendChild(styleSheet);
        }
    }

    // Toggle password visibility
    function togglePassword() {
        const passwordToggle = document.querySelector('.password-toggle');
        const passwordInput = document.getElementById('password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            passwordToggle.classList.add('show-password');
        } else {
            passwordInput.type = 'password';
            passwordToggle.classList.remove('show-password');
        }
    }

    // Validate individual input
    function validateInput(input) {
        const value = input.value.trim();
        const container = input.parentElement;
        
        if (value.length === 0) {
            container.classList.add('error');
            container.classList.remove('success');
        } else if (input === usernameInput && value.length < 3) {
            container.classList.add('error');
            container.classList.remove('success');
        } else if (input === passwordInput && value.length < 6) {
            container.classList.add('error');
            container.classList.remove('success');
        } else {
            container.classList.add('success');
            container.classList.remove('error');
        }
    }

    // Save credentials to localStorage
    function saveCredentials(username, password) {
        try {
            localStorage.setItem('admin_username', username);
            localStorage.setItem('admin_password', password);
            localStorage.setItem('admin_remember', 'true');
        } catch (e) {
            console.warn('Could not save credentials:', e);
        }
    }

    // Load saved credentials
    function loadSavedCredentials() {
        try {
            const savedUsername = localStorage.getItem('admin_username');
            const savedPassword = localStorage.getItem('admin_password');
            const savedRemember = localStorage.getItem('admin_remember');
            
            if (savedUsername && savedPassword && savedRemember === 'true') {
                usernameInput.value = savedUsername;
                passwordInput.value = savedPassword;
                rememberCheckbox.checked = true;
            }
        } catch (e) {
            console.warn('Could not load saved credentials:', e);
        }
    }

    // Clear saved credentials
    function clearSavedCredentials() {
        try {
            localStorage.removeItem('admin_username');
            localStorage.removeItem('admin_password');
            localStorage.removeItem('admin_remember');
        } catch (e) {
            console.warn('Could not clear saved credentials:', e);
        }
    }

    // Add shake animation styles
    const shakeStyles = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        .shake {
            animation: shake 0.5s ease-in-out;
        }
        
        .input-container.error input {
            border-color: #ff6b6b;
            box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
        }
        
        .input-container.success input {
            border-color: #4ecdc4;
            box-shadow: 0 0 0 3px rgba(78, 205, 196, 0.1);
        }
    `;

    // Inject shake styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = shakeStyles;
    document.head.appendChild(styleSheet);

    // Add floating label effect
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            if (!this.value) {
                this.parentElement.classList.remove('focused');
            }
        });
        
        // Check if input has value on load
        if (input.value) {
            input.parentElement.classList.add('focused');
        }
    });

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleLogin();
        }
        
        // Escape to clear form
        if (e.key === 'Escape') {
            loginForm.reset();
            [usernameInput, passwordInput].forEach(input => {
                input.parentElement.classList.remove('focused', 'error', 'success');
            });
        }
    });

    // Add form auto-save (save on input change)
    let autoSaveTimeout;
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                if (rememberCheckbox.checked) {
                    const username = usernameInput.value.trim();
                    const password = passwordInput.value.trim();
                    if (username && password) {
                        saveCredentials(username, password);
                    }
                }
            }, 1000);
        });
    });

    // Add input counter for password strength
    passwordInput.addEventListener('input', function() {
        const value = this.value;
        const strength = calculatePasswordStrength(value);
        updatePasswordStrengthIndicator(strength);
    });

    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        
        if (score <= 2) return 'weak';
        if (score <= 3) return 'medium';
        return 'strong';
    }

    function updatePasswordStrengthIndicator(strength) {
        const container = passwordInput.parentElement;
        
        // Remove existing strength classes
        container.classList.remove('weak', 'medium', 'strong');
        
        // Add new strength class
        container.classList.add(strength);
        
        // Update strength text if it exists
        let strengthText = container.querySelector('.strength-text');
        if (!strengthText) {
            strengthText = document.createElement('div');
            strengthText.className = 'strength-text';
            container.appendChild(strengthText);
        }
        
        const strengthLabels = {
            weak: 'Weak password',
            medium: 'Medium strength',
            strong: 'Strong password'
        };
        
        strengthText.textContent = strengthLabels[strength];
    }

    // Add strength indicator styles
    const strengthStyles = `
        .input-container.weak .strength-text {
            color: #ff6b6b;
        }
        
        .input-container.medium .strength-text {
            color: #ffa726;
        }
        
        .input-container.strong .strength-text {
            color: #4ecdc4;
        }
        
        .strength-text {
            position: absolute;
            bottom: -20px;
            left: 0;
            font-size: 0.8rem;
            font-weight: 500;
        }
    `;

    const strengthStyleSheet = document.createElement('style');
    strengthStyleSheet.textContent = strengthStyles;
    document.head.appendChild(strengthStyleSheet);
});

// Global functions for HTML onclick handlers

function goBack() {
    // Add fade out effect
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 300);
}

function closeModal() {
    const modal = document.getElementById('errorModal');
    modal.style.display = 'none';
}

// showHelp function removed - now redirects to developers page

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('errorModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});
