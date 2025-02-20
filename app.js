// Global variables
let currentUser = null;
let userData = null;

// Utility Functions
function showToast({ message, type = "info", duration = 2000 }) {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;
    
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Add icon based on type
    const icon = document.createElement("i");
    switch (type) {
        case "success":
            icon.className = "fas fa-check-circle";
            break;
        case "error":
            icon.className = "fas fa-exclamation-circle";
            break;
        default:
            icon.className = "fas fa-info-circle";
    }
    
    const messageSpan = document.createElement("span");
    messageSpan.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(messageSpan);
    toastContainer.appendChild(toast);
    
    // Remove toast after duration
    setTimeout(() => {
        toast.style.opacity = "0";
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

// Authentication Functions
function checkAuthState() {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
        currentUser = storedUser;
        loadUserData();
        document.getElementById("authScreen").style.display = "none";
        document.getElementById("navScreen").style.display = "block";
        updateUI();
        showScreen("homeScreen");
    } else {
        document.getElementById("authScreen").style.display = "block";
        document.getElementById("navScreen").style.display = "none";
    }
}

function login() {
    const phoneInput = document.getElementById("usernameInput");
    const phoneNumber = phoneInput.value.trim();
    
    // Basic phone number validation
    if (phoneNumber === "") {
        showToast({
            message: "Please enter your phone number.",
            type: "error"
        });
        return;
    }
    
    if (!/^\d{9,12}$/.test(phoneNumber)) {
        showToast({
            message: "Please enter a valid phone number.",
            type: "error"
        });
        return;
    }
    
    currentUser = phoneNumber;
    localStorage.setItem("username", currentUser);
    loadUserData();
    checkReferral();
    checkAuthState();
    checkChannelMembership();
}

function logout() {
    currentUser = null;
    localStorage.removeItem("username");
    document.getElementById("authScreen").style.display = "block";
    document.getElementById("navScreen").style.display = "none";
}

// Data Management
function loadUserData() {
    const dataKey = "userData_" + currentUser;
    const data = localStorage.getItem(dataKey);
    if (data) {
        userData = JSON.parse(data);
    } else {
        userData = {
            balance: 0,
            todayEarnings: 0,
            adsWatched: 0,
            history: [],
            referrals: 0,
            referralCode: generateReferralCode(currentUser),
            referredUsers: [],
            referredBy: null,
            totalWithdrawn: 0,
            hasJoinedChannel: false
        };
        localStorage.setItem(dataKey, JSON.stringify(userData));
    }
}

function saveUserData() {
    const dataKey = "userData_" + currentUser;
    localStorage.setItem(dataKey, JSON.stringify(userData));
}

// UI Updates
function updateUI() {
    document.getElementById("balance").textContent = "$" + userData.balance.toFixed(2);
    document.getElementById("todayEarnings").textContent = "$" + userData.todayEarnings.toFixed(2);
    document.getElementById("adsWatched").textContent = userData.adsWatched;
    updateHistory();
    document.getElementById("referralLink").textContent = "https://t.me/Ad_Cashbot?start=" + encodeURIComponent(currentUser);
    document.getElementById("profileUsername").textContent = currentUser;
    updateReferralLink();
    updateReferralStats();
    document.getElementById("totalEarned").textContent = "$" + (userData.balance + userData.totalWithdrawn || 0).toFixed(2);
    document.getElementById("referralCount").textContent = userData.referrals || 0;
}

function updateHistory() {
    const historyList = document.getElementById("historyList");
    historyList.innerHTML = "";
    userData.history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.textContent = item;
        historyList.appendChild(div);
    });
}

// Ad Functions
function watchAd() {
    if (!userData.hasJoinedChannel) {
        showChannelJoinModal();
        return;
    }
    // Show loading state
    showLoadingOverlay();
    
    // Randomly choose one of the three ad types
    const adType = Math.floor(Math.random() * 3);
    
    try {
        switch(adType) {
            case 0:
                // Rewarded interstitial
                show_8980914()
                    .then(() => {
                        rewardUser("Rewarded Interstitial");
                    })
                    .catch(handleAdError)
                    .finally(hideLoadingOverlay);
                break;
                
            case 1:
                // Rewarded Popup
                show_8980914('pop')
                    .then(() => {
                        rewardUser("Rewarded Popup");
                    })
                    .catch(handleAdError)
                    .finally(hideLoadingOverlay);
                break;
                
            case 2:
                // In-App Interstitial
                show_8980914({ 
                    type: 'inApp', 
                    inAppSettings: { 
                        frequency: 2, 
                        capping: 0.1, 
                        interval: 30, 
                        timeout: 5, 
                        everyPage: false 
                    } 
                })
                    .then(() => {
                        rewardUser("In-App Interstitial");
                    })
                    .catch(handleAdError)
                    .finally(hideLoadingOverlay);
                break;
        }
    } catch (error) {
        handleAdError(error);
        hideLoadingOverlay();
    }
}

// Helper functions for loading overlay
function showLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        overlay.style.display = "flex";
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

// Improved error handling for ads
function handleAdError(error) {
    console.error('Ad Error:', error);
    
    let errorMessage = "Unable to load ad. Please try again later.";
    
    // Check for specific error types
    if (error.message && error.message.includes("timeout")) {
        errorMessage = "Ad request timed out. Please check your internet connection.";
    } else if (error.message && error.message.includes("blocked")) {
        errorMessage = "Please disable your ad blocker to watch ads.";
    } else if (error.message && error.message.includes("not available")) {
        errorMessage = "No ads available right now. Please try again later.";
    }
    
    showToast({
        message: errorMessage,
        type: "error",
        duration: 3000
    });
}

// Function to reward user after watching an ad
function rewardUser(adType) {
    try {
        userData.balance += 0.01;
        userData.todayEarnings += 0.01;
        userData.adsWatched += 1;
        
        const timestamp = new Date().toLocaleTimeString();
        userData.history.push(`Watched ${adType} ad at ${timestamp} (+$0.01)`);
        
        saveUserData();
        updateUI();
        
        showToast({
            message: "Ad finished, you earned $0.01!",
            type: "success",
            duration: 2000
        });
    } catch (error) {
        console.error('Reward Error:', error);
        showToast({
            message: "Error processing reward. Please contact support.",
            type: "error",
            duration: 3000
        });
    }
}

// Ad Integration Functions
/*
function showRewardedInterstitial() {
    show_8980914().then(() => {
        alert('You have seen a rewarded interstitial ad!');
    });
}

function showRewardedPopup() {
    show_8980914('pop').then(() => {
        alert('You have seen a rewarded popup ad!');
    }).catch(e => {
        console.error('Error showing rewarded popup ad:', e);
    });
}

function showInAppInterstitial() {
    show_8980914({
        type: 'inApp',
        inAppSettings: {
            frequency: 2,
            capping: 0.1,
            interval: 30,
            timeout: 5,
            everyPage: false
        }
    }).then(() => {
        alert('In-App interstitial ad was shown!');
    }).catch(e => {
        console.error('Error showing in-app interstitial ad:', e);
    });
}
*/

// Navigation Functions
function showScreen(screenId) {
    document.getElementById("homeScreen").style.display = "none";
    document.getElementById("profileScreen").style.display = "none";
    document.getElementById("referralScreen").style.display = "none";
    document.getElementById(screenId).style.display = "block";
    updateNavButtons(screenId);
}

function updateNavButtons(activeScreen) {
    document.getElementById("navHome").classList.remove("active");
    document.getElementById("navProfile").classList.remove("active");
    document.getElementById("navReferral").classList.remove("active");
    if (activeScreen === "homeScreen") {
        document.getElementById("navHome").classList.add("active");
    } else if (activeScreen === "profileScreen") {
        document.getElementById("navProfile").classList.add("active");
    } else if (activeScreen === "referralScreen") {
        document.getElementById("navReferral").classList.add("active");
    }
}

// Withdraw Functions
function showWithdrawModal() {
    document.getElementById("withdrawModal").style.display = "flex";
}

function closeWithdrawModal() {
    document.getElementById("withdrawModal").style.display = "none";
}

function processWithdraw() {
    if (!userData.hasJoinedChannel) {
        showChannelJoinModal();
        return;
    }
    const evcNumber = document.getElementById("evcNumber").value.trim();
    const amount = parseFloat(document.getElementById("withdrawAmount").value);
    const amountInput = document.getElementById("withdrawAmount").parentElement;
    
    // Reset validation styles
    amountInput.classList.remove('invalid');
    
    if (evcNumber === "" || isNaN(amount)) {
        showToast({
            message: "Please enter valid withdrawal details.",
            type: "error"
        });
        return;
    }
    
    if (amount < 5) {
        amountInput.classList.add('invalid');
        showToast({
            message: "Minimum withdrawal amount is $5.00.",
            type: "error"
        });
        return;
    }
    
    if (userData.balance < amount) {
        showToast({
            message: "Insufficient balance.",
            type: "error"
        });
        return;
    }
    
    // Process withdrawal
    userData.balance -= amount;
    userData.totalWithdrawn = (userData.totalWithdrawn || 0) + amount;
    
    const timestamp = new Date().toLocaleTimeString();
    userData.history.push(`Withdrew $${amount.toFixed(2)} to ${evcNumber} at ${timestamp}`);
    
    saveUserData();
    updateUI();
    closeWithdrawModal();
    
    showToast({
        message: "Withdrawal successful!",
        type: "success"
    });
}

// Add input validation
function validateWithdrawAmount() {
    const amount = parseFloat(document.getElementById("withdrawAmount").value);
    const amountInput = document.getElementById("withdrawAmount").parentElement;
    const confirmBtn = document.querySelector('.modal-body .primary-btn');
    
    if (isNaN(amount) || amount < 5) {
        amountInput.classList.add('invalid');
        confirmBtn.disabled = true;
    } else {
        amountInput.classList.remove('invalid');
        confirmBtn.disabled = false;
    }
}

// Add event listener for amount input
document.getElementById("withdrawAmount").addEventListener('input', validateWithdrawAmount);

// Referral Functions
function updateReferralLink() {
    const referralLink = document.getElementById("referralLink");
    const userSpecificLink = `https://t.me/Ad_Cashbot?start=${encodeURIComponent(currentUser)}`;
    referralLink.value = userSpecificLink;
}

function copyReferral() {
    const referralLink = document.getElementById("referralLink");
    referralLink.select();
    document.execCommand('copy');
    
    // Show success toast
    showToast({
        message: "Referral link copied!",
        type: "success"
    });
}

function shareOnTelegram() {
    const referralLink = document.getElementById("referralLink").value;
    const text = encodeURIComponent(`Join EarnPro and start earning! Use my referral link: ${referralLink}`);
    const telegramUrl = `https://t.me/share/url?url=${referralLink}&text=${text}`;
    window.open(telegramUrl, '_blank');
}

function shareOnWhatsApp() {
    const referralLink = document.getElementById("referralLink").value;
    const text = encodeURIComponent(`Join EarnPro and start earning! Use my referral link: ${referralLink}`);
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
}

function updateReferralStats() {
    document.getElementById("totalReferrals").textContent = userData.referrals || 0;
    document.getElementById("referralEarnings").textContent = 
        "$" + ((userData.referrals || 0) * 0.05).toFixed(2);
}

// Add this function to check channel membership
function checkChannelMembership() {
    if (!userData.hasJoinedChannel) {
        showChannelJoinModal();
    }
}

// Add this function to check for referral code on login/signup
function checkReferral() {
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    
    if (referralCode) {
        // Find the referrer user
        const allUsers = getAllUsers();
        const referrer = allUsers.find(user => user.referralCode === referralCode);
        
        if (referrer && referrer.username !== currentUser) {
            const referrerData = JSON.parse(localStorage.getItem(`userData_${referrer.username}`));
            
            // Check if this user hasn't been counted as a referral before
            if (!referrerData.referredUsers) {
                referrerData.referredUsers = [];
            }
            
            if (!referrerData.referredUsers.includes(currentUser)) {
                // Add referral bonus
                referrerData.referrals = (referrerData.referrals || 0) + 1;
                referrerData.balance += 0.05; // Referral bonus
                referrerData.referredUsers.push(currentUser);
                referrerData.lastReferralDate = new Date().toISOString();
                referrerData.history.push(`Earned $0.05 from referral: ${currentUser} at ${new Date().toLocaleString()}`);
                
                // Save referrer's data
                localStorage.setItem(`userData_${referrer.username}`, JSON.stringify(referrerData));
                
                // Mark current user as referred
                userData.referredBy = referrer.username;
                saveUserData();
                
                showToast({
                    message: "Welcome! You were referred by " + referrer.username,
                    type: "success"
                });
            }
        }
    }
}

// Generate a unique referral code
function generateReferralCode(username) {
    return btoa(username + '_' + Date.now()).replace(/[^a-zA-Z0-9]/g, '').substr(0, 8);
}

// Initialize app
document.addEventListener("DOMContentLoaded", () => {
    checkAuthState();
});

function showChannelJoinModal() {
    const modal = document.getElementById("channelJoinModal");
    modal.style.display = "flex";
}

function verifyChannelJoin() {
    // Here you would typically verify channel membership via Telegram Bot API
    // For now, we'll just accept the user's confirmation
    userData.hasJoinedChannel = true;
    saveUserData();
    
    document.getElementById("channelJoinModal").style.display = "none";
    
    showToast({
        message: "Thank you for joining our channel!",
        type: "success",
        duration: 3000
    });
} 