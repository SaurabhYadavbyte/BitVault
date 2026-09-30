<div align="center">
  <img src="https://img.icons8.com/color/96/000000/shield.png" alt="SecureVault Logo">
  <h1>SecureVault</h1>
  <p><strong>A Modern, Full-Stack Password Generator & Encrypted Local Vault</strong></p>
  
  <p>
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
    <img src="https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
    <img src="https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
    <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
    <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
    <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  </p>
</div>

---

## 📖 Overview
SecureVault is a highly secure, privacy-focused password management utility. It allows users to generate cryptographically secure passwords and memorable passphrases, strictly evaluate their strength against dictionary and brute-force attacks, and store them in an encrypted, zero-knowledge local SQLite vault.

## ✨ Key Features
- **AES-256 Server-Side Encryption**: Passwords are encrypted before ever touching the database using the Python `cryptography` library.
- **Advanced Strength Estimation**: Utilizes Dropbox's `zxcvbn` library to accurately estimate the time it would take a hacker to crack your password.
- **Memorable Passphrase Generator**: Generate highly secure yet human-readable passphrases (e.g., `Apple-River-Laptop9!`).
- **OTP Email Verification**: Secure registration system with automated 6-digit HTML email verification.
- **Zero-Knowledge Architecture**: The vault operates locally; your master credentials and unencrypted passwords are never logged or exposed.
- **Modern Glassmorphism UI**: A sleek, responsive, and intuitive interface built entirely with pure CSS and Vanilla JavaScript.

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/secure-vault.git
cd secure-vault
```

### 2. Setup the Backend
Navigate to the backend directory and set up a virtual environment:
```bash
cd backend
python -m venv venv
```
Activate the virtual environment:
- **Windows:** `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

Install the required dependencies:
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` folder (you can copy `.env.example`):
```bash
# Generate your own secure key for encryption
VAULT_SECRET_KEY=your_secure_32_byte_key

# SMTP details for Email Verification
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_SENDER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password
```
*(Note: If SMTP variables are left blank, the server will gracefully fall back to printing the OTP in the terminal for local testing purposes).*

### 4. Run the Application
Start the Flask backend server:
```bash
python app.py
```
Open the frontend application in your browser:
- Navigate to the `frontend/` folder and open `index.html` in any modern web browser.

## 📸 Screenshots
*(Add your screenshots here)*
- Landing Page
- Dashboard & Generator
- My Vault

## 🛡️ Security Disclaimer
This project is built as a showcase of secure full-stack development practices. While it implements industry-standard encryption algorithms (AES-256) and secure password hashing (bcrypt), always exercise caution when deploying personal security tools to public internet servers.

## 🤝 Contributing
Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](#).

## 📝 License
This project is licensed under the MIT License.
