// User Signup JavaScript
(function() {
  const API_PORTS = [Number(location.search.match(/port=(\d+)/)?.[1]) || null, 3001, 3000].filter(Boolean);
  const API_BASES = API_PORTS.map(p => `http://localhost:${p}`);

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userSignupForm');
    const signupBtn = document.getElementById('signupBtn');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      const confirm = confirmPasswordInput.value.trim();

      if (!name || !email || !password || !confirm) {
        return showError('Please fill in all fields');
      }
      if (!isValidEmail(email)) {
        return showError('Please enter a valid email address');
      }
      if (password.length < 6) {
        return showError('Password must be at least 6 characters');
      }
      if (password !== confirm) {
        return showError('Passwords do not match');
      }

      setLoading(true);
      try {
        const payload = { name, email, password };
        const response = await tryFetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'include'
        });

        if (!response.ok) {
          const data = await safeJson(response);
          throw new Error(data?.message || `Sign up failed (${response.status})`);
        }

        const data = await response.json();
        // Persist auth minimal (localStorage). In real app, consider httpOnly cookies.
        try {
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('currentUser', JSON.stringify(data.user));
        } catch {}

        // Redirect to user dashboard
        window.location.href = 'user-dashboard/index.html';
      } catch (err) {
        showError(err.message || 'Sign up failed. Please try again.');
      } finally {
        setLoading(false);
      }
    });
  });

  function setLoading(loading) {
    const signupBtn = document.getElementById('signupBtn');
    if (!signupBtn) return;
    if (loading) {
      signupBtn.classList.add('loading');
      signupBtn.disabled = true;
    } else {
      signupBtn.classList.remove('loading');
      signupBtn.disabled = false;
    }
  }

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async function tryFetch(path, options) {
    let lastErr;
    for (const base of API_BASES) {
      try {
        const res = await fetch(base + path, options);
        return res;
      } catch (e) {
        lastErr = e;
        // try next base
      }
    }
    throw lastErr || new Error('Network error');
  }

  async function safeJson(res) {
    try { return await res.json(); } catch { return null; }
  }

  // Global helpers for HTML
  window.goBack = function() {
    window.location.href = 'userlogin.html';
  };

  window.togglePassword = function(id) {
    const input = document.getElementById(id);
    const btn = input?.parentElement?.querySelector('.password-toggle');
    if (!input || !btn) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.classList.add('show-password');
    } else {
      input.type = 'password';
      btn.classList.remove('show-password');
    }
  };

  window.closeModal = function() {
    const modal = document.getElementById('errorModal');
    if (modal) modal.style.display = 'none';
  };

  function showError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.textContent = message;
    if (errorModal) errorModal.style.display = 'block';
  }
})();
