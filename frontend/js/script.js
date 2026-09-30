const isLocal = window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost' || window.location.protocol === 'file:';
const API_URL = isLocal ? 'http://127.0.0.1:5000' : '';

let currentUser = null; 

const viewLanding = document.getElementById('view-landing');
const viewAuth = document.getElementById('view-auth');
const viewDashboard = document.getElementById('view-dashboard');

function switchView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
}

const userGreeting = document.getElementById('user-greeting');
const navLoginBtn = document.getElementById('nav-login-btn');
const navLogoutBtn = document.getElementById('nav-logout-btn');

document.getElementById('get-started-btn').onclick = () => switchView('view-auth');
document.getElementById('try-guest-btn').onclick = () => switchView('view-dashboard');
navLoginBtn.onclick = () => {
    setAuthMode('login');
    switchView('view-auth');
};

const authActionBtn = document.getElementById('auth-action-btn');
const authSwitchLink = document.getElementById('auth-switch-link');
const authSwitchText = document.getElementById('auth-switch-text');
const authSwitchContainer = document.getElementById('auth-switch-container');
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const authMsg = document.getElementById('auth-msg');

const registerFields = document.getElementById('register-fields');
const loginFields = document.getElementById('login-fields');
const otpFields = document.getElementById('otp-fields');

const authFullname = document.getElementById('auth-fullname');
const authEmail = document.getElementById('auth-email');
const authUsername = document.getElementById('auth-username');
const authPassword = document.getElementById('auth-password');
const authOtp = document.getElementById('auth-otp');

let authMode = 'login'; // login, register, otp
let pendingUsername = ''; // to track the user during OTP

function setAuthMode(mode) {
    authMode = mode;
    authMsg.innerText = '';
    
    if (mode === 'login') {
        authTitle.innerText = "Welcome Back";
        authSubtitle.innerText = "Login to access your vault";
        registerFields.style.display = 'none';
        loginFields.style.display = 'block';
        otpFields.style.display = 'none';
        authActionBtn.innerText = "Login";
        authSwitchContainer.style.display = 'block';
        authSwitchText.innerText = "New here? ";
        authSwitchLink.innerText = "Create an account";
    } else if (mode === 'register') {
        authTitle.innerText = "Create Account";
        authSubtitle.innerText = "Join BitVault today";
        registerFields.style.display = 'block';
        loginFields.style.display = 'block';
        otpFields.style.display = 'none';
        authActionBtn.innerText = "Register";
        authSwitchContainer.style.display = 'block';
        authSwitchText.innerText = "Already have an account? ";
        authSwitchLink.innerText = "Login here";
    } else if (mode === 'otp') {
        authTitle.innerText = "Verify Email";
        authSubtitle.innerText = `We sent a 6-digit code to your email. Check your server console for local testing.`;
        registerFields.style.display = 'none';
        loginFields.style.display = 'none';
        otpFields.style.display = 'block';
        authActionBtn.innerText = "Verify & Login";
        authSwitchContainer.style.display = 'none';
    }
}

authSwitchLink.onclick = (e) => {
    e.preventDefault();
    setAuthMode(authMode === 'login' ? 'register' : 'login');
}

authActionBtn.onclick = async () => {
    if (authMode === 'login') {
        const username = authUsername.value.trim();
        const password = authPassword.value;
        if(!username || !password) {
            authMsg.innerText = "Please enter username and password.";
            return;
        }
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                authMsg.innerText = data.error || 'An error occurred';
            } else {
                currentUser = { token: data.token, username: data.username, fullName: data.full_name };
                updateUIForUser();
                switchView('view-dashboard');
            }
        } catch (err) {
            authMsg.innerText = "Error connecting to server.";
        }
    } 
    else if (authMode === 'register') {
        const fullName = authFullname.value.trim();
        const email = authEmail.value.trim();
        const username = authUsername.value.trim();
        const password = authPassword.value;

        if(!fullName || !email || !username || !password) {
            authMsg.innerText = "All fields are required.";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fullName, email, username, password })
            });
            const data = await response.json();
            if (!response.ok) {
                authMsg.innerText = data.error || 'An error occurred';
            } else {
                pendingUsername = data.username;
                setAuthMode('otp');
                authMsg.style.color = "var(--accent-green)";
                authMsg.innerText = "OTP sent successfully!";
            }
        } catch (err) {
            authMsg.innerText = "Error connecting to server.";
        }
    }
    else if (authMode === 'otp') {
        const otp = authOtp.value.trim();
        if(!otp) {
            authMsg.innerText = "Please enter the OTP.";
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: pendingUsername, otp })
            });
            const data = await response.json();
            if (!response.ok) {
                authMsg.innerText = data.error || 'Invalid OTP';
                authMsg.style.color = "var(--accent-red)";
            } else {
                authMsg.style.color = "var(--accent-green)";
                authMsg.innerText = "Verification successful! Logging in...";
                // After verification, automatically login
                setTimeout(async () => {
                    const loginRes = await fetch(`${API_URL}/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: pendingUsername, password: authPassword.value })
                    });
                    const loginData = await loginRes.json();
                    if (loginRes.ok) {
                        currentUser = { token: loginData.token, username: loginData.username, fullName: loginData.full_name };
                        updateUIForUser();
                        switchView('view-dashboard');
                        // reset form
                        setAuthMode('login');
                        authFullname.value = ''; authEmail.value = ''; authUsername.value = ''; authPassword.value = ''; authOtp.value = '';
                    }
                }, 1000);
            }
        } catch (err) {
            authMsg.innerText = "Error verifying OTP.";
        }
    }
}

navLogoutBtn.onclick = () => {
    currentUser = null;
    updateUIForUser();
    switchView('view-landing');
    document.querySelector('.tab-btn').click();
}

const vaultTabBtn = document.getElementById('vault-tab-btn');
const saveContainer = document.getElementById('save-container');

function updateUIForUser() {
    if (currentUser) {
        userGreeting.innerText = `Hello, ${currentUser.fullName || currentUser.username}`;
        navLoginBtn.style.display = 'none';
        navLogoutBtn.style.display = 'inline-block';
        vaultTabBtn.style.display = 'flex';
        saveContainer.style.display = 'flex';
    } else {
        userGreeting.innerText = ``;
        navLoginBtn.style.display = 'inline-block';
        navLogoutBtn.style.display = 'none';
        vaultTabBtn.style.display = 'none';
        saveContainer.style.display = 'none';
    }
}

function openTab(evt, tabName) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tab => tab.style.display = 'none');
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).style.display = 'block';
    evt.currentTarget.classList.add('active');
    if (tabName === 'vault-tab') loadVault();
}

const saveBtn = document.getElementById('save-btn');
const saveMsg = document.getElementById('save-msg');
const siteNameInput = document.getElementById('site-name');

saveBtn.onclick = async () => {
    const siteName = siteNameInput.value.trim();
    const password = resultEl.innerText;
    if (!siteName) { saveMsg.innerText = 'Please enter a site name.'; saveMsg.style.color = 'var(--accent-red)'; return; }
    if (!password) { saveMsg.innerText = 'Generate a password first!'; saveMsg.style.color = 'var(--accent-red)'; return; }
    try {
        const response = await fetch(`${API_URL}/passwords`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: currentUser.token, site_name: siteName, password: password })
        });
        const data = await response.json();
        if (response.ok) {
            saveMsg.innerText = 'Saved to Vault!';
            saveMsg.style.color = 'var(--accent-green)';
            siteNameInput.value = '';
            setTimeout(() => { saveMsg.innerText = ''; }, 3000);
        } else {
            saveMsg.innerText = data.error || 'Failed to save.';
            saveMsg.style.color = 'var(--accent-red)';
        }
    } catch (err) {
        saveMsg.innerText = 'Server error.';
        saveMsg.style.color = 'var(--accent-red)';
    }
}

document.getElementById('refresh-vault-btn').onclick = loadVault;

async function loadVault() {
    const vaultList = document.getElementById('vault-list');
    vaultList.innerHTML = '<p>Loading...</p>';
    if (!currentUser) return;
    try {
        const response = await fetch(`${API_URL}/passwords?token=${currentUser.token}`);
        const data = await response.json();
        if (response.ok) {
            if (data.length === 0) {
                vaultList.innerHTML = '<p>Your vault is empty.</p>';
            } else {
                vaultList.innerHTML = '';
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'vault-item';
                    div.innerHTML = `<span class="vault-site">${item.site_name}</span><span class="vault-pass">${item.password}</span>`;
                    vaultList.appendChild(div);
                });
            }
        } else {
            vaultList.innerHTML = `<p style="color:var(--accent-red)">${data.error}</p>`;
        }
    } catch (err) {
        vaultList.innerHTML = '<p style="color:var(--accent-red)">Failed to connect to server.</p>';
    }
}

const resultEl = document.getElementById('result');
const clipboardBtn = document.getElementById('clipboard-btn');
const generateBtn = document.getElementById('generate-btn');

const modeRadios = document.querySelectorAll('input[name="gen-mode"]');
const passwordSettings = document.getElementById('password-settings');
const passphraseSettings = document.getElementById('passphrase-settings');

const lengthEl = document.getElementById('length');
const lengthValEl = document.getElementById('length-val');
const uppercaseEl = document.getElementById('uppercase');
const lowercaseEl = document.getElementById('lowercase');
const numbersEl = document.getElementById('numbers');
const symbolsEl = document.getElementById('symbols');
const excludeAmbiguousEl = document.getElementById('exclude-ambiguous');

const wordsEl = document.getElementById('words');
const wordsValEl = document.getElementById('words-val');
const separatorEl = document.getElementById('separator');
const capitalizeWordsEl = document.getElementById('capitalize-words');
const passphraseNumberEl = document.getElementById('passphrase-number');
const passphraseSymbolEl = document.getElementById('passphrase-symbol');

const wordList = ["apple","tiger","window","cloud","mountain","river","bottle","laptop","guitar","planet","ocean","rocket","forest","castle","dragon","knight","magic","silver","golden","shadow","wizard","falcon","phoenix","crystal","diamond","emerald","sapphire","ruby","comet","galaxy"];

modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
        if(e.target.value === 'password') {
            passwordSettings.style.display = 'flex';
            passphraseSettings.style.display = 'none';
        } else {
            passwordSettings.style.display = 'none';
            passphraseSettings.style.display = 'flex';
        }
    });
});

lengthEl.addEventListener('input', (e) => { lengthValEl.innerText = e.target.value; });
wordsEl.addEventListener('input', (e) => { wordsValEl.innerText = e.target.value; });

clipboardBtn.addEventListener('click', () => {
    const password = resultEl.innerText;
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
        const originalIcon = clipboardBtn.innerHTML;
        clipboardBtn.innerHTML = '<i class="fa-solid fa-check" style="color:var(--accent-green)"></i>';
        setTimeout(() => { clipboardBtn.innerHTML = originalIcon; }, 2000);
    });
});

generateBtn.addEventListener('click', () => {
    const isPasswordMode = document.querySelector('input[name="gen-mode"]:checked').value === 'password';
    
    if(isPasswordMode) {
        const length = +lengthEl.value;
        const hasUpper = uppercaseEl.checked;
        const hasLower = lowercaseEl.checked;
        const hasNumber = numbersEl.checked;
        const hasSymbol = symbolsEl.checked;
        const excludeAmbiguous = excludeAmbiguousEl.checked;
        resultEl.innerText = generatePassword(hasLower, hasUpper, hasNumber, hasSymbol, length, excludeAmbiguous);
    } else {
        const count = +wordsEl.value;
        const separator = separatorEl.value;
        const capitalize = capitalizeWordsEl.checked;
        const addNumber = passphraseNumberEl.checked;
        const addSymbol = passphraseSymbolEl.checked;
        resultEl.innerText = generatePassphrase(count, separator, capitalize, addNumber, addSymbol);
    }
});

function generatePassword(lower, upper, number, symbol, length, excludeAmbiguous) {
    let charset = "";
    let lChars = "abcdefghijklmnopqrstuvwxyz";
    let uChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let nChars = "0123456789";
    let sChars = "!@#$%^&*(){}[]=<>/,.";

    if (excludeAmbiguous) {
        lChars = lChars.replace(/[l]/g, '');
        uChars = uChars.replace(/[IO]/g, '');
        nChars = nChars.replace(/[01]/g, '');
    }

    if(lower) charset += lChars;
    if(upper) charset += uChars;
    if(number) charset += nChars;
    if(symbol) charset += sChars;

    if (charset === "") return "";

    let finalPassword = "";
    for(let i=0; i<length; i++) {
        finalPassword += charset[Math.floor(Math.random() * charset.length)];
    }
    return finalPassword;
}

function generatePassphrase(count, separator, capitalize, addNumber, addSymbol) {
    let phrase = [];
    for(let i=0; i<count; i++){
        let word = wordList[Math.floor(Math.random() * wordList.length)];
        if(capitalize) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
        }
        phrase.push(word);
    }
    
    let resultStr = phrase.join(separator);
    
    if (addNumber) {
        resultStr += Math.floor(Math.random() * 10);
    }
    
    if (addSymbol) {
        const symbols = "!@#$%^&*";
        resultStr += symbols[Math.floor(Math.random() * symbols.length)];
    }
    
    return resultStr;
}

const passwordInput = document.getElementById('password-input');
const strengthBar = document.getElementById('strength-bar');
const strengthText = document.getElementById('strength-text');
const crackTime = document.getElementById('crack-time');
const suggestionsContainer = document.getElementById('suggestions');

passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    if (password.length === 0) {
        strengthBar.style.width = '0%';
        strengthText.innerText = 'Strength: None';
        strengthText.style.color = 'var(--text-main)';
        crackTime.innerText = '';
        suggestionsContainer.innerHTML = '';
        return;
    }

    if(typeof zxcvbn === 'function') {
        const result = zxcvbn(password);
        let score = result.score;
        
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNum = /[0-9]/.test(password);
        const hasSym = /[^a-zA-Z0-9]/.test(password);
        const typesCount = hasLower + hasUpper + hasNum + hasSym;

        if (password.length < 8) {
            score = Math.min(score, 1);
        } else if (password.length < 12) {
            score = Math.min(score, 2);
        }
        
        if (typesCount < 3) {
            score = Math.min(score, 2);
        }
        
        if (!hasSym || !hasNum) {
            score = Math.min(score, 3);
        }

        let label = '';
        let color = '';
        let width = '0%';

        if(score === 0 || score === 1) { label = 'Weak'; color = 'var(--accent-red)'; width = '25%'; }
        else if (score === 2) { label = 'Fair'; color = 'var(--accent-orange)'; width = '50%'; }
        else if (score === 3) { label = 'Good'; color = 'var(--accent-yellow)'; width = '75%'; }
        else if (score === 4) { label = 'Strong'; color = 'var(--accent-green)'; width = '100%'; }

        strengthBar.style.width = width;
        strengthBar.style.backgroundColor = color;
        strengthText.innerText = `Strength: ${label}`;
        strengthText.style.color = color;

        crackTime.innerText = `Time to crack: ${result.crack_times_display.offline_slow_hashing_1e4_per_second}`;

        if (score < 4) {
            let suggestionsHTML = '<ul>';
            
            if (result.feedback.warning) {
                suggestionsHTML += `<li><strong>Warning:</strong> ${result.feedback.warning}</li>`;
            }
            
            if (password.length < 12) {
                suggestionsHTML += `<li>Increase length to at least 12 characters.</li>`;
            }
            if (!hasNum) suggestionsHTML += `<li>Include numbers.</li>`;
            if (!hasSym) suggestionsHTML += `<li>Include special characters (!@#$).</li>`;
            if (!hasUpper || !hasLower) suggestionsHTML += `<li>Mix uppercase and lowercase letters.</li>`;

            result.feedback.suggestions.forEach(sug => {
                suggestionsHTML += `<li>${sug}</li>`;
            });
            
            suggestionsHTML += '</ul>';
            suggestionsContainer.innerHTML = suggestionsHTML;
            suggestionsContainer.style.color = 'var(--accent-red)';
        } else {
            suggestionsContainer.innerHTML = '<p style="color: var(--accent-green);">Excellent password! Highly secure.</p>';
        }
    }
});
