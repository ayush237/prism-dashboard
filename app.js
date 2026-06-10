const POLL_INTERVAL = 60000;
const STATE_URL = 'https://gist.github.com/ayush237/075ca4a4a6c3a886f0ed0c6bed4350be';

// DOM Elements
const elCurrentStatus = document.getElementById('current-status');
const elLastExecution = document.getElementById('last-execution');
const elActiveTask = document.getElementById('active-task');
const elCronGrid = document.getElementById('cron-grid-container');
const elErrorLog = document.getElementById('error-log-container');
const elRecentLog = document.getElementById('recent-log-container');
const elErrorBadge = document.getElementById('error-badge');
const elHeaderBadgeText = document.getElementById('header-status-text');
const elHeaderBadgePulse = document.querySelector('.pulse-indicator');

async function fetchState() {
    try {
        const response = await fetch(STATE_URL + '?t=' + Date.now());
        if (!response.ok) throw new Error('Network error');
        const gistData = await response.json();

        // Extract the content string from the gist response
        const stateStr = gistData.files['pipeline_state.json'].content;
        const state = JSON.parse(stateStr);

        updateDashboard(state);
        elHeaderBadgeText.textContent = 'Live';
        elHeaderBadgePulse.className = 'pulse-indicator';
    } catch (err) {
        console.error("Failed to fetch state", err);
        elHeaderBadgeText.textContent = 'Offline';
        elHeaderBadgePulse.className = 'pulse-indicator error';
    }
}

function updateDashboard(state) {
    // 1. Status Card
    elCurrentStatus.textContent = state.current_status || 'Idle';

    let dateStr = '--';
    if (state.last_execution_time) {
        const d = new Date(state.last_execution_time);
        dateStr = d.toLocaleString();
    }
    elLastExecution.textContent = dateStr;
    elActiveTask.textContent = state.active_task || 'None';

    // 2. Cron History
    renderCronHistory(state.cron_history);

    // 3. Error Logs
    renderErrors(state.errors, state.recent_logs);
}

function renderCronHistory(history) {
    if (!history) return;
    elCronGrid.innerHTML = '';

    const jobs = ['Study Material', 'Series Pipeline', 'Evergreen Hunt', 'Latest Hunt', 'Vector Sync'];

    jobs.forEach(job => {
        const row = document.createElement('div');
        row.className = 'cron-row';

        const label = document.createElement('div');
        label.className = 'cron-label';
        label.textContent = job;

        const cellsContainer = document.createElement('div');
        cellsContainer.className = 'contribution-cells';

        const executions = history[job] || [];
        const recentExecs = executions.slice(-7);

        const paddingCount = Math.max(0, 7 - recentExecs.length);
        for (let i = 0; i < paddingCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cellsContainer.appendChild(cell);
        }

        recentExecs.forEach(exec => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (exec.status === 'SUCCESS') cell.classList.add('success');
            else if (exec.status === 'FAIL') cell.classList.add('fail');
            cell.title = `${exec.date} - ${exec.status}`;
            cellsContainer.appendChild(cell);
        });

        row.appendChild(label);
        row.appendChild(cellsContainer);
        elCronGrid.appendChild(row);
    });
}

function renderErrors(errors, tailLogs) {
    errors = errors || [];
    tailLogs = tailLogs || [];

    elErrorBadge.textContent = errors.length;
    if (errors.length > 0) {
        elErrorBadge.classList.add('has-errors');
    } else {
        elErrorBadge.classList.remove('has-errors');
    }

    if (errors.length === 0) {
        elErrorLog.innerHTML = '<div class="error-item" style="border-left-color: var(--success-green); background: rgba(52,211,153,0.05);">No active errors. All systems nominal.</div>';
    } else {
        elErrorLog.innerHTML = errors.map(err => `<div class="error-item">${err}</div>`).join('');
    }

    if (tailLogs.length === 0) {
        elRecentLog.innerHTML = '<div class="error-item" style="border-left-color: var(--idle-gray);">No recent log errors.</div>';
    } else {
        elRecentLog.innerHTML = tailLogs.map(err => `<div class="error-item">${err}</div>`).join('');
    }
}

// Init
fetchState();
setInterval(fetchState, POLL_INTERVAL);
