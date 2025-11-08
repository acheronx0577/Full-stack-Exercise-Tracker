document.addEventListener('DOMContentLoaded', function() {
    const userForm = document.getElementById('user-form');
    const exerciseForm = document.getElementById('exercise-form');
    const logForm = document.getElementById('log-form');
    const output = document.getElementById('output');
    const resultDiv = document.getElementById('result');
    const outputStatus = document.querySelector('.output-status');

    // Create User
    userForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(userForm);
        const username = formData.get('username');

        if (!username.trim()) {
            showError('Username is required');
            return;
        }

        await makeRequest('/api/users', 'POST', { username });
    });

    // Add Exercise
    exerciseForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(exerciseForm);
        const userId = formData.get(':_id');
        const description = formData.get('description');
        const duration = formData.get('duration');
        const date = formData.get('date') || new Date().toISOString().split('T')[0];

        if (!userId || !description || !duration) {
            showError('User ID, description, and duration are required');
            return;
        }

        const exerciseData = {
            description: description.trim(),
            duration: parseInt(duration),
            date: date
        };

        await makeRequest(`/api/users/${userId}/exercises`, 'POST', exerciseData);
    });

    // Get Exercise Log
    logForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData(logForm);
        const userId = formData.get(':_id');
        const from = formData.get('from');
        const to = formData.get('to');
        const limit = formData.get('limit');

        if (!userId) {
            showError('User ID is required');
            return;
        }

        let url = `/api/users/${userId}/logs`;
        const params = new URLSearchParams();
        
        if (from) params.append('from', from);
        if (to) params.append('to', to);
        if (limit) params.append('limit', limit);
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        await makeRequest(url, 'GET');
    });

    async function makeRequest(url, method, data = null) {
        showLoading();
        
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            showResult(result, 'SUCCESS');
        } catch (error) {
            showResult({ error: error.message }, 'ERROR');
        }
    }

    function showLoading() {
        output.classList.remove('hide');
        resultDiv.innerHTML = '<div style="text-align: center; color: var(--text-dim);">SENDING_REQUEST...</div>';
        outputStatus.textContent = 'PROCESSING';
        outputStatus.style.color = 'var(--accent-warning)';
    }

    function showResult(data, status) {
        const isError = status === 'ERROR';
        const statusColor = isError ? 'var(--accent-error)' : 'var(--accent-success)';
        
        resultDiv.textContent = JSON.stringify(data, null, 2);
        outputStatus.textContent = status;
        outputStatus.style.color = statusColor;
        
        // Clear forms on success (except for GET requests)
        if (status === 'SUCCESS' && !data.log) {
            setTimeout(() => {
                if (!data.log) { // Don't clear log form
                    userForm.reset();
                    exerciseForm.reset();
                }
            }, 1000);
        }
    }

    function showError(message) {
        showResult({ error: message }, 'ERROR');
    }

    // Set today's date as default for exercise date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;

    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            output.classList.add('hide');
        }
    });

    console.log('Exercise Tracker TUI Loaded');
    console.log('Connected to backend API');
});