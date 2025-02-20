// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
const BOT_USERNAME = '@Ad_Cashbot';

// UserStorage: Individual storage for each user
class UserStorage {
    constructor(userId) {
        this.userId = userId;
        this.prefix = `user_${userId}_`;
    }

    save(key, data) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    get(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('Error getting data:', error);
            return defaultValue;
        }
    }

    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    clearAll() {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        }
    }

    // User data management
    saveProfile(profile) {
        this.save('profile', profile);
    }

    getProfile() {
        return this.get('profile');
    }

    saveAdWatch(adData) {
        const history = this.get('adHistory', []);
        history.push({
            ...adData,
            timestamp: new Date().toISOString()
        });
        this.save('adHistory', history);
    }

    saveEarnings(amount) {
        const earnings = this.get('earnings', []);
        earnings.push({
            amount,
            timestamp: new Date().toISOString()
        });
        this.save('earnings', earnings);
    }

    saveWithdrawal(data) {
        const withdrawals = this.get('withdrawals', []);
        withdrawals.push({
            ...data,
            timestamp: new Date().toISOString()
        });
        this.save('withdrawals', withdrawals);
    }

    getDailyStats() {
        const today = new Date().toISOString().split('T')[0];
        const earnings = this.get('earnings', []);
        const adHistory = this.get('adHistory', []);

        return {
            todayEarnings: earnings
                .filter(e => e.timestamp.startsWith(today))
                .reduce((sum, e) => sum + e.amount, 0),
            todayAds: adHistory.filter(a => a.timestamp.startsWith(today)).length
        };
    }
}

// User management
const UserManager = {
    currentUser: null,
    storage: null,

    init() {
        if (tg.initDataUnsafe?.user?.id) {
            this.loginWithTelegram(tg.initDataUnsafe.user);
        }
    },

    loginWithTelegram(telegramUser) {
        const userId = `tg_${telegramUser.id}`;
        this.storage = new UserStorage(userId);
        
        let profile = this.storage.getProfile();
        if (!profile) {
            profile = {
                id: userId,
                telegramId: telegramUser.id,
                username: telegramUser.username || '',
                name: telegramUser.first_name,
                balance: 0,
                adsWatched: 0,
                createdAt: new Date().toISOString()
            };
            this.storage.saveProfile(profile);
        }

        profile.lastLoginAt = new Date().toISOString();
        this.storage.saveProfile(profile);
        this.currentUser = profile;
        
        checkAuthState();
        return profile;
    },

    logout() {
        this.currentUser = null;
        this.storage = null;
        checkAuthState();
    }
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    tg.ready();
    tg.expand();
    UserManager.init();
    updateStatusBarTime();
    setInterval(updateStatusBarTime, 1000);
    checkAuthState();
});

// Telegram login button handler
function loginWithTelegram() {
    window.location.href = `https://t.me/${BOT_USERNAME}`;
}

// Logout user
function logout() {
    UserManager.logout();
}

// Credit earnings after watching ad
function creditEarnings() {
    if (!UserManager.currentUser || !UserManager.storage) return;

    const earnedAmount = 0.01;
    const profile = UserManager.currentUser;
    
    profile.balance += earnedAmount;
    profile.adsWatched += 1;
    
    UserManager.storage.saveProfile(profile);
    UserManager.storage.saveAdWatch({
        type: 'regular',
        reward: earnedAmount
    });
    UserManager.storage.saveEarnings(earnedAmount);

    document.getElementById('adScreen').style.display = 'none';
    document.getElementById('mainScreen').style.display = 'block';
    updateBalance();

    tg.showPopup({
        message: 'Earned $0.01!',
        buttons: [{ type: 'ok' }]
    });
}

// Process withdrawal
function processWithdraw() {
    if (!UserManager.currentUser || !UserManager.storage) return;

    const amount = parseFloat(document.getElementById('withdrawAmount').value);
    const evcNumber = document.getElementById('evcNumber').value.trim();

    if (!amount || !evcNumber) {
        tg.showPopup({
            message: 'Please fill in all fields',
            buttons: [{ type: 'ok' }]
        });
        return;
    }

    if (amount < 5) {
        tg.showPopup({
            message: 'Minimum withdrawal amount is $5.00',
            buttons: [{ type: 'ok' }]
        });
        return;
    }

    if (amount > UserManager.currentUser.balance) {
        tg.showPopup({
            message: 'Insufficient balance',
            buttons: [{ type: 'ok' }]
        });
        return;
    }

    const profile = UserManager.currentUser;
    profile.balance -= amount;
    
    UserManager.storage.saveProfile(profile);
    UserManager.storage.saveWithdrawal({
        amount,
        evcNumber,
        status: 'pending'
    });

    closeModal();
    updateBalance();
    tg.showPopup({
        message: 'Withdrawal request submitted!',
        buttons: [{ type: 'ok' }]
    });
}

// Update balance display
function updateBalance() {
    if (!UserManager.currentUser) return;
    
    const stats = UserManager.storage.getDailyStats();
    document.getElementById('balance').textContent = 
        UserManager.currentUser.balance.toFixed(2);
    document.getElementById('todayEarnings').textContent = 
        stats.todayEarnings.toFixed(2);
    document.getElementById('adsWatched').textContent = 
        stats.todayAds;
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
    
    if (UserManager.currentUser) {
        authScreen.style.display = 'none';
        mainScreen.style.display = 'block';
        updateBalance();
    } else {
        authScreen.style.display = 'block';
        mainScreen.style.display = 'none';
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('withdrawModal');
    modal.style.display = 'none';
    document.getElementById('evcNumber').value = '';
    document.getElementById('withdrawAmount').value = '5.00';
}

// Watch ad functionality
function watchAd() {
    document.getElementById('mainScreen').style.display = 'none';
    document.getElementById('adScreen').style.display = 'block';
    
    const progress = document.getElementById('adProgress');
    const message = document.getElementById('adMessage');
    
    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
            creditEarnings();
            return;
        }
        width += 2;
        progress.style.width = width + '%';
        message.textContent = 'Watching ad... ' + width + '%';
    }, 100);
}
