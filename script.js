// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;

// User data storage
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Telegram WebApp
    tg.ready();
    tg.expand();

    // If user comes from Telegram, auto-login with their Telegram ID
    if (tg.initDataUnsafe?.user?.id) {
        const telegramUser = tg.initDataUnsafe.user;
        autoLoginTelegramUser(telegramUser);
    }

    updateStatusBarTime();
    setInterval(updateStatusBarTime, 1000);
    checkAuthState();
});

// Auto login Telegram user
function autoLoginTelegramUser(telegramUser) {
    let user = users.find(u => u.telegramId === telegramUser.id);
    
    if (!user) {
        // Create new user if not exists
        user = {
            id: Date.now().toString(),
            telegramId: telegramUser.id,
            name: telegramUser.first_name,
            phone: '',
            balance: 0,
            adsWatched: 0,
            todayEarnings: 0,
            lastAdWatch: null,
            withdrawals: []
        };
        users.push(user);
        localStorage.setItem('users', JSON.stringify(users));
    }
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Update status bar time
function updateStatusBarTime() {
    const timeElement = document.querySelector('.time');
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
    });
}

// Auth state management
function checkAuthState() {
    const authScreen = document.getElementById('authScreen');
    const mainScreen = document.getElementById('mainScreen');
    
    if (currentUser) {
        authScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        updateBalance();
    } else {
        authScreen.style.display = 'block';
        mainScreen.style.display = 'none';
    }
}

// Show registration form
function showRegister() {
    const authContent = document.querySelector('.auth-content');
    authContent.innerHTML = `
        <h1>Create Account</h1>
        <p>Join AdCash and start earning</p>
        <div class="auth-form">
            <input type="text" id="nameInput" placeholder="Full Name">
            <input type="tel" id="phoneInput" placeholder="Phone Number">
            <input type="password" id="passwordInput" placeholder="Password">
            <input type="password" id="confirmPasswordInput" placeholder="Confirm Password">
            <button class="primary-btn" onclick="register()">Create Account</button>
            <button class="secondary-btn" onclick="showLogin()">Back to Login</button>
        </div>
    `;
}

// Show login form
function showLogin() {
    const authContent = document.querySelector('.auth-content');
    authContent.innerHTML = `
        <h1>AdCash</h1>
        <p>Watch ads, earn money</p>
        <div class="auth-form">
            <input type="tel" placeholder="Phone Number" id="phoneInput">
            <input type="password" placeholder="Password" id="passwordInput">
            <button class="primary-btn" onclick="login()">Login</button>
            <button class="secondary-btn" onclick="showRegister()">Create Account</button>
        </div>
    `;
}

// Register new user
function register() {
    const name = document.getElementById('nameInput').value.trim();
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    const confirmPassword = document.getElementById('confirmPasswordInput').value;

    // Validation
    if (!name || !phone || !password || !confirmPassword) {
        tg.showPopup({
            message: 'Please fill in all fields',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }

    if (password !== confirmPassword) {
        tg.showPopup({
            message: 'Passwords do not match',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }

    if (phone.length < 9) {
        tg.showPopup({
            message: 'Please enter a valid phone number',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }

    // Check if user already exists
    if (users.some(user => user.phone === phone)) {
        tg.showPopup({
            message: 'Phone number already registered',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name,
        phone,
        password,
        balance: 0,
        adsWatched: 0,
        todayEarnings: 0,
        lastAdWatch: null,
        withdrawals: []
    };

    // Save user
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    tg.showPopup({
        message: 'Account created successfully!',
        buttons: [{
            type: 'ok'
        }]
    });
    checkAuthState();
}

// Login user
function login() {
    const phone = document.getElementById('phoneInput').value.trim();
    const password = document.getElementById('passwordInput').value;

    const user = users.find(u => u.phone === phone && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        checkAuthState();
    } else {
        tg.showPopup({
            message: 'Invalid phone number or password',
            buttons: [{
                type: 'ok'
            }]
        });
    }
}

// Logout user
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    checkAuthState();
}

// Update balance display
function updateBalance() {
    if (!currentUser) return;
    
    document.getElementById('balance').textContent = currentUser.balance.toFixed(2);
    document.getElementById('todayEarnings').textContent = currentUser.todayEarnings.toFixed(2);
    document.getElementById('adsWatched').textContent = currentUser.adsWatched;
}

// Show toast using Telegram's native UI
function showToast(message) {
    tg.showPopup({
        message: message,
        buttons: [{
            type: 'ok'
        }]
    });
}

// App functions
function showApp() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'flex';
    document.getElementById('adminSection').style.display = 'none';
    updateUserInterface();
}

function showAdminPanel() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('appSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'block';
    updateAdminInterface();
}

function updateUserInterface() {
    document.getElementById('userBalance').textContent = currentUser.balance.toFixed(2);
    document.getElementById('todayEarnings').textContent = (currentUser.todayEarnings || 0).toFixed(2);
    document.getElementById('adsWatched').textContent = currentUser.adsWatched || 0;
}

// Watch ad functionality
function watchAd() {
    const adScreen = document.getElementById('adScreen');
    const mainScreen = document.getElementById('mainScreen');
    const adProgress = document.getElementById('adProgress');
    const adMessage = document.getElementById('adMessage');
    
    // Show ad screen
    mainScreen.style.display = 'none';
    adScreen.style.display = 'block';
    adMessage.textContent = 'Loading ad...';
    
    // Show rewarded ad
    show_8980914('pop').then(() => {
        // Ad was watched successfully
        creditEarnings();
    }).catch(e => {
        // Ad failed or was closed early
        adScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        tg.showPopup({
            message: 'Please watch the entire ad to earn rewards',
            buttons: [{
                type: 'ok'
            }]
        });
    });
}

// Credit earnings after watching ad
function creditEarnings() {
    // Update user balance
    currentUser.balance += 0.01;
    currentUser.adsWatched += 1;
    currentUser.todayEarnings += 0.01;
    currentUser.lastAdWatch = new Date().toISOString();
    
    // Update storage
    const userIndex = users.findIndex(u => u.phone === currentUser.phone);
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Show success and return to main screen
    document.getElementById('adScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    
    tg.showPopup({
        message: 'Congratulations! You earned $0.01',
        buttons: [{
            type: 'ok'
        }]
    });
    
    // Update balance display
    updateBalance();
    
    // Show another ad after 30 seconds
    setTimeout(() => {
        // Show in-app interstitial with settings
        show_8980914({ 
            type: 'inApp', 
            inAppSettings: { 
                frequency: 1,    // Show 1 ad
                capping: 0.1,    // Within 6 minutes
                interval: 30,    // 30 second interval
                timeout: 5,      // 5 second delay
                everyPage: false // Don't reset on page change
            } 
        });
    }, 30000); // 30 seconds delay
}

// Show withdraw form
function showWithdraw() {
    if (currentUser.balance < 5.00) {
        tg.showPopup({
            title: 'Minimum Balance Required',
            message: 'Minimum withdrawal amount is $5.00',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }
    
    const modal = document.getElementById('withdrawModal');
    modal.style.display = 'block';
    
    // Set max withdrawal amount
    document.getElementById('withdrawAmount').max = currentUser.balance;
}

function processWithdraw() {
    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const evcNumber = document.getElementById('evcNumber').value.trim();
    
    // Validation
    if (!evcNumber) {
        tg.showPopup({
            message: 'Please enter EVC Plus number',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }
    
    if (!amount || amount < 5.00 || amount > currentUser.balance) {
        tg.showPopup({
            message: 'Invalid withdrawal amount',
            buttons: [{
                type: 'ok'
            }]
        });
        return;
    }
    
    // Create withdrawal record
    const withdrawal = {
        id: Date.now().toString(),
        userId: currentUser.phone,
        amount: amount,
        evcNumber: evcNumber,
        status: 'pending',
        timestamp: new Date().toISOString()
    };
    
    // Update user balance
    currentUser.balance -= amount;
    currentUser.withdrawals.push(withdrawal);
    
    // Update storage
    const userIndex = users.findIndex(u => u.phone === currentUser.phone);
    users[userIndex] = currentUser;
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Close modal and show success
    closeModal();
    tg.showPopup({
        message: 'Withdrawal request submitted',
        buttons: [{
            type: 'ok'
        }]
    });
    updateBalance();
}

function closeModal() {
    const modal = document.getElementById('withdrawModal');
    modal.style.display = 'none';
    document.getElementById('evcNumber').value = '';
    document.getElementById('withdrawAmount').value = '5.00';
}

// Admin functions
function updateAdminInterface() {
    document.getElementById('totalUsers').textContent = users.filter(u => !u.isAdmin).length;
    document.getElementById('totalWithdrawals').textContent = JSON.parse(localStorage.getItem('withdrawals')).reduce((sum, w) => sum + w.amount, 0).toFixed(2);
    document.getElementById('pendingWithdrawals').textContent = JSON.parse(localStorage.getItem('withdrawals')).filter(w => w.status === 'pending').length;
    
    // Update withdrawal list
    const withdrawalList = document.getElementById('withdrawalList');
    withdrawalList.innerHTML = '';
    JSON.parse(localStorage.getItem('withdrawals')).filter(w => w.status === 'pending').forEach(w => {
        const div = document.createElement('div');
        div.className = 'withdrawal-item';
        div.innerHTML = `
            <p>User: ${w.userId}</p>
            <p>Amount: $${w.amount.toFixed(2)}</p>
            <p>Phone: ${w.evcNumber}</p>
            <button onclick="approveWithdrawal(${w.userId}, ${w.amount})">Approve</button>
            <button onclick="rejectWithdrawal(${w.userId}, ${w.amount})">Reject</button>
        `;
        withdrawalList.appendChild(div);
    });
}

function approveWithdrawal(userId, amount) {
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals'));
    const withdrawalIndex = withdrawals.findIndex(w => w.userId === userId && w.amount === amount);
    withdrawals[withdrawalIndex].status = 'approved';
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
    updateAdminInterface();
}

function rejectWithdrawal(userId, amount) {
    const withdrawals = JSON.parse(localStorage.getItem('withdrawals'));
    const withdrawalIndex = withdrawals.findIndex(w => w.userId === userId && w.amount === amount);
    const userIndex = users.findIndex(u => u.phone === userId);
    users[userIndex].balance += amount;
    withdrawals[withdrawalIndex].status = 'rejected';
    localStorage.setItem('withdrawals', JSON.stringify(withdrawals));
    localStorage.setItem('users', JSON.stringify(users));
    updateAdminInterface();
}

function logout() {
    currentUser = null;
    document.getElementById('authSection').style.display = 'flex';
    document.getElementById('appSection').style.display = 'none';
    document.getElementById('adminSection').style.display = 'none';
}
