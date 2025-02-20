// Admin Authentication
const ADMIN_PASSWORD = "615102410"; // Admin password set to 615102410

function checkAdminAuth() {
    const storedAuth = localStorage.getItem("adminAuth");
    if (!storedAuth) {
        const password = prompt("Enter admin password:");
        if (password !== ADMIN_PASSWORD) {
            alert("Invalid password");
            window.location.href = "index.html";
            return false;
        }
        localStorage.setItem("adminAuth", "true");
    }
    return true;
}

// Load and display all users
function loadAllUsers() {
    const users = getAllUsers();
    updateAdminStats(users);
    displayUsers(users);
}

function getAllUsers() {
    const users = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("userData_")) {
            const username = key.replace("userData_", "");
            const userData = JSON.parse(localStorage.getItem(key));
            users.push({ username, ...userData });
        }
    }
    return users;
}

function updateAdminStats(users) {
    const totalUsers = users.length;
    const totalWithdrawn = users.reduce((sum, user) => sum + (user.totalWithdrawn || 0), 0);
    const totalAdsWatched = users.reduce((sum, user) => sum + (user.adsWatched || 0), 0);

    document.getElementById("totalUsers").textContent = totalUsers;
    document.getElementById("totalWithdrawn").textContent = `$${totalWithdrawn.toFixed(2)}`;
    document.getElementById("totalAdsWatched").textContent = totalAdsWatched;
}

function displayUsers(users) {
    const tbody = document.getElementById("usersTableBody");
    tbody.innerHTML = "";

    users.forEach(user => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${user.username}</td>
            <td>$${user.balance.toFixed(2)}</td>
            <td>$${((user.balance || 0) + (user.totalWithdrawn || 0)).toFixed(2)}</td>
            <td>${user.adsWatched || 0}</td>
            <td>${user.referrals || 0}</td>
            <td>
                <button onclick="viewUserDetails('${user.username}')" class="admin-btn">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// User Management Functions
let currentUsername = null; // To track which user is being managed

// Add this function to format dates
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).format(date);
}

function viewUserDetails(username) {
    currentUsername = username;
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    const modal = document.getElementById("userDetailsModal");
    const details = document.getElementById("userDetails");
    
    if (!userData.joinDate) {
        userData.joinDate = new Date().toISOString();
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
    }

    details.innerHTML = `
        <div class="user-header">
            <i class="fas fa-user-circle"></i>
            <h3>${username}</h3>
            <div class="join-date">
                <i class="far fa-calendar-alt"></i>
                Joined: ${formatDate(new Date(userData.joinDate))}
                <button onclick="editJoinDate('${username}')" class="date-edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        
        <div class="date-controls">
            <div class="date-control-item">
                <span>Last Activity:</span>
                <span>${userData.lastActivityDate ? formatDate(new Date(userData.lastActivityDate)) : 'Never'}</span>
                <button onclick="updateLastActivity('${username}')" class="date-edit-btn">
                    <i class="fas fa-sync"></i>
                </button>
            </div>
            <div class="date-control-item">
                <span>Channel Join Date:</span>
                <span>${userData.channelJoinDate ? formatDate(new Date(userData.channelJoinDate)) : 'Not joined'}</span>
                <button onclick="editChannelJoinDate('${username}')" class="date-edit-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            <div class="date-control-item">
                <span>Account Status:</span>
                <span class="${userData.isActive ? 'active-status' : 'inactive-status'}">
                    ${userData.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onclick="toggleAccountStatus('${username}')" class="date-edit-btn">
                    <i class="fas fa-power-off"></i>
                </button>
            </div>
        </div>
        
        <div class="stats-container">
            <div class="stat-box">
                <div class="stat-label">Balance</div>
                <div class="stat-value">$${userData.balance.toFixed(2)}</div>
                <div class="stat-date">Last updated: ${formatDate(new Date())}</div>
                <button onclick="editBalance('${username}')" class="edit-stat-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            
            <div class="stat-box">
                <div class="stat-label">Total Withdrawn</div>
                <div class="stat-value">$${(userData.totalWithdrawn || 0).toFixed(2)}</div>
                <div class="stat-date">Last withdrawal: ${userData.lastWithdrawalDate ? 
                    formatDate(new Date(userData.lastWithdrawalDate)) : 'Never'}</div>
            </div>
            
            <div class="stat-box">
                <div class="stat-label">Ads Watched</div>
                <div class="stat-value">${userData.adsWatched || 0}</div>
                <div class="stat-date">Last ad: ${userData.lastAdDate ? 
                    formatDate(new Date(userData.lastAdDate)) : 'Never'}</div>
                <button onclick="resetAdsWatched('${username}')" class="edit-stat-btn">
                    <i class="fas fa-redo"></i>
                </button>
            </div>
            
            <div class="stat-box">
                <div class="stat-label">Referrals</div>
                <div class="stat-value">${userData.referrals || 0}</div>
                <div class="stat-date">Last referral: ${userData.lastReferralDate ? 
                    formatDate(new Date(userData.lastReferralDate)) : 'Never'}</div>
                <button onclick="editReferrals('${username}')" class="edit-stat-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        
        <div class="score-card">
            <div class="score-info">
                <div class="score-label">User Score</div>
                <div class="score-value">${calculateUserScore(userData)}/100</div>
            </div>
            <div class="score-progress">
                <div class="score-bar" style="width: ${calculateUserScore(userData)}%"></div>
            </div>
        </div>
        
        <div class="channel-status">
            <span class="status-label">Channel Joined</span>
            <span class="status-badge ${userData.hasJoinedChannel ? 'joined' : 'not-joined'}">
                <i class="fas ${userData.hasJoinedChannel ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${userData.hasJoinedChannel ? `Yes (${formatDate(new Date(userData.channelJoinDate || userData.joinDate))})` : 'No'}
            </span>
        </div>
        
        <div class="history-container">
            <div class="history-header">
                <i class="fas fa-history"></i>
                <h4>Transaction History</h4>
            </div>
            <div class="history-list">
                ${userData.history.map(item => {
                    const amount = item.match(/\(\$([0-9.]+)\)/);
                    const timestamp = item.match(/at ([\d:]+\s[AP]M)/);
                    const date = new Date();
                    return `
                        <div class="history-item">
                            <div class="history-time">
                                <i class="far fa-clock"></i>
                                ${formatDate(date)}
                            </div>
                            <div class="history-content">
                                ${item.replace(/\(\$([0-9.]+)\)/, 
                                    `<span class="amount-badge">+$${amount ? amount[1] : '0.00'}</span>`
                                )}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="referral-info">
            <h4><i class="fas fa-users"></i> Referral Details</h4>
            <p>Referral Code: ${userData.referralCode || 'None'}</p>
            <p>Referred By: ${userData.referredBy || 'None'}</p>
            <p>Total Referrals: ${userData.referrals || 0}</p>
            <p>Referral Earnings: $${((userData.referrals || 0) * 0.05).toFixed(2)}</p>
            ${userData.referredUsers ? `
                <div class="referred-users">
                    <h5>Referred Users:</h5>
                    <ul>
                        ${userData.referredUsers.map(user => `<li>${user}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;
    
    modal.style.display = "flex";
}

function closeUserModal() {
    document.getElementById("userDetailsModal").style.display = "none";
}

function banUser() {
    if (!currentUsername) return;
    
    if (confirm(`Are you sure you want to ban ${currentUsername}?`)) {
        // Remove user data
        localStorage.removeItem(`userData_${currentUsername}`);
        // Add to banned users list
        const bannedUsers = JSON.parse(localStorage.getItem('bannedUsers') || '[]');
        bannedUsers.push(currentUsername);
        localStorage.setItem('bannedUsers', JSON.stringify(bannedUsers));
        
        closeUserModal();
        loadAllUsers();
        showAdminToast('User banned successfully', 'success');
    }
}

function resetBalance() {
    if (!currentUsername) return;
    
    if (confirm(`Are you sure you want to reset ${currentUsername}'s balance?`)) {
        const userData = JSON.parse(localStorage.getItem(`userData_${currentUsername}`));
        userData.balance = 0;
        userData.history.push(`Balance reset by admin at ${new Date().toLocaleString()}`);
        localStorage.setItem(`userData_${currentUsername}`, JSON.stringify(userData));
        
        viewUserDetails(currentUsername); // Refresh modal
        loadAllUsers(); // Refresh table
        showAdminToast('Balance reset successfully', 'success');
    }
}

function editBalance(username) {
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    const newBalance = prompt('Enter new balance:', userData.balance);
    
    if (newBalance !== null && !isNaN(newBalance)) {
        userData.balance = parseFloat(newBalance);
        userData.history.push(`Balance edited by admin to $${newBalance} at ${new Date().toLocaleString()}`);
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
        
        viewUserDetails(username);
        loadAllUsers();
        showAdminToast('Balance updated successfully', 'success');
    }
}

function resetAdsWatched(username) {
    if (confirm('Reset ads watched count to 0?')) {
        const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
        userData.adsWatched = 0;
        userData.history.push(`Ads watched count reset by admin at ${new Date().toLocaleString()}`);
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
        
        viewUserDetails(username);
        loadAllUsers();
        showAdminToast('Ads watched count reset', 'success');
    }
}

function editReferrals(username) {
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    const newCount = prompt('Enter new referrals count:', userData.referrals || 0);
    
    if (newCount !== null && !isNaN(newCount)) {
        userData.referrals = parseInt(newCount);
        userData.history.push(`Referrals count edited by admin to ${newCount} at ${new Date().toLocaleString()}`);
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
        
        viewUserDetails(username);
        loadAllUsers();
        showAdminToast('Referrals updated successfully', 'success');
    }
}

function approveWithdrawal() {
    if (!currentUsername) return;
    
    const userData = JSON.parse(localStorage.getItem(`userData_${currentUsername}`));
    const amount = prompt('Enter withdrawal amount to approve:', userData.balance);
    
    if (amount !== null && !isNaN(amount) && parseFloat(amount) <= userData.balance) {
        userData.balance -= parseFloat(amount);
        userData.totalWithdrawn = (userData.totalWithdrawn || 0) + parseFloat(amount);
        userData.lastWithdrawalDate = new Date().toISOString();
        userData.history.push(`Withdrawal of $${amount} approved by admin at ${formatDate(new Date())}`);
        localStorage.setItem(`userData_${currentUsername}`, JSON.stringify(userData));
        
        viewUserDetails(currentUsername);
        loadAllUsers();
        showAdminToast('Withdrawal approved successfully', 'success');
    } else {
        showAdminToast('Invalid withdrawal amount', 'error');
    }
}

function deleteUser() {
    if (!currentUsername) return;
    
    if (confirm(`Are you sure you want to delete ${currentUsername}? This action cannot be undone.`)) {
        localStorage.removeItem(`userData_${currentUsername}`);
        closeUserModal();
        loadAllUsers();
        showAdminToast('User deleted successfully', 'success');
    }
}

// Admin Toast Notification
function showAdminToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Export Data
function exportUserData() {
    const users = getAllUsers();
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Search functionality
document.getElementById("searchUser").addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const users = getAllUsers();
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm)
    );
    displayUsers(filteredUsers);
});

// Initialize admin panel
document.addEventListener("DOMContentLoaded", () => {
    if (checkAdminAuth()) {
        loadAllUsers();
    }
});

// Add this function to edit user join date
function editJoinDate(username) {
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    const currentDate = new Date(userData.joinDate || new Date());
    const newDate = prompt('Enter new join date (YYYY-MM-DD):', currentDate.toISOString().split('T')[0]);
    
    if (newDate && !isNaN(new Date(newDate))) {
        userData.joinDate = new Date(newDate).toISOString();
        userData.history.push(`Join date edited by admin to ${formatDate(new Date(newDate))} at ${formatDate(new Date())}`);
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
        
        viewUserDetails(username);
        showAdminToast('Join date updated successfully', 'success');
    } else {
        showAdminToast('Invalid date format', 'error');
    }
}

// Update last activity date
function updateLastActivity(username) {
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    userData.lastActivityDate = new Date().toISOString();
    userData.history.push(`Last activity updated by admin at ${formatDate(new Date())}`);
    localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
    
    viewUserDetails(username);
    showAdminToast('Last activity updated', 'success');
}

// Edit channel join date
function editChannelJoinDate(username) {
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    const currentDate = new Date(userData.channelJoinDate || new Date());
    const newDate = prompt('Enter new channel join date (YYYY-MM-DD):', 
        currentDate.toISOString().split('T')[0]);
    
    if (newDate && !isNaN(new Date(newDate))) {
        userData.channelJoinDate = new Date(newDate).toISOString();
        userData.hasJoinedChannel = true;
        userData.history.push(`Channel join date edited by admin to ${formatDate(new Date(newDate))}`);
        localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
        
        viewUserDetails(username);
        showAdminToast('Channel join date updated', 'success');
    } else {
        showAdminToast('Invalid date format', 'error');
    }
}

// Toggle account status
function toggleAccountStatus(username) {
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    userData.isActive = !userData.isActive;
    userData.history.push(
        `Account ${userData.isActive ? 'activated' : 'deactivated'} by admin at ${formatDate(new Date())}`
    );
    localStorage.setItem(`userData_${username}`, JSON.stringify(userData));
    
    viewUserDetails(username);
    showAdminToast(`Account ${userData.isActive ? 'activated' : 'deactivated'}`, 'success');
}

// Add this function to calculate user score
function calculateUserScore(userData) {
    let score = 0;
    
    // Activity score (max 30)
    if (userData.adsWatched > 0) score += Math.min(userData.adsWatched * 2, 30);
    
    // Balance score (max 20)
    score += Math.min((userData.balance + (userData.totalWithdrawn || 0)) * 2, 20);
    
    // Referral score (max 20)
    score += Math.min((userData.referrals || 0) * 4, 20);
    
    // Channel membership (10)
    if (userData.hasJoinedChannel) score += 10;
    
    // Account activity (max 20)
    if (userData.lastActivityDate) {
        const daysSinceActive = (new Date() - new Date(userData.lastActivityDate)) / (1000 * 60 * 60 * 24);
        if (daysSinceActive < 1) score += 20;
        else if (daysSinceActive < 7) score += 15;
        else if (daysSinceActive < 30) score += 10;
        else score += 5;
    }
    
    return Math.round(score);
} 