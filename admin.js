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

function viewUserDetails(username) {
    currentUsername = username;
    const userData = JSON.parse(localStorage.getItem(`userData_${username}`));
    const modal = document.getElementById("userDetailsModal");
    const details = document.getElementById("userDetails");
    
    details.innerHTML = `
        <div class="user-header">
            <i class="fas fa-user-circle"></i>
            <h3>${username}</h3>
        </div>
        
        <div class="stats-container">
            <div class="stat-box">
                <div class="stat-label">Balance</div>
                <div class="stat-value">$${userData.balance.toFixed(2)}</div>
                <button onclick="editBalance('${username}')" class="edit-stat-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
            
            <div class="stat-box">
                <div class="stat-label">Total Withdrawn</div>
                <div class="stat-value">$${(userData.totalWithdrawn || 0).toFixed(2)}</div>
            </div>
            
            <div class="stat-box">
                <div class="stat-label">Ads Watched</div>
                <div class="stat-value">${userData.adsWatched || 0}</div>
                <button onclick="resetAdsWatched('${username}')" class="edit-stat-btn">
                    <i class="fas fa-redo"></i>
                </button>
            </div>
            
            <div class="stat-box">
                <div class="stat-label">Referrals</div>
                <div class="stat-value">${userData.referrals || 0}</div>
                <button onclick="editReferrals('${username}')" class="edit-stat-btn">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        </div>
        
        <div class="channel-status">
            <span class="status-label">Channel Joined</span>
            <span class="status-badge ${userData.hasJoinedChannel ? 'joined' : 'not-joined'}">
                <i class="fas ${userData.hasJoinedChannel ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                ${userData.hasJoinedChannel ? 'Yes' : 'No'}
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
                    return `
                        <div class="history-item">
                            <div class="history-time">
                                <i class="far fa-clock"></i>
                                ${timestamp ? timestamp[1] : ''}
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
        userData.history.push(`Withdrawal of $${amount} approved by admin at ${new Date().toLocaleString()}`);
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