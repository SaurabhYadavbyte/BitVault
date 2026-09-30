from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from cryptography.fernet import Fernet
import sqlite3
import random
import string
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

FRONTEND_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'frontend')

app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path='')
CORS(app)

@app.route('/')
def serve_index():
    return app.send_static_file('index.html')

DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.sqlite')

SECRET_KEY = os.environ.get('VAULT_SECRET_KEY', '10S0qXUo_oI_sM3n3aHk-_5zR3w6o9x_Q2m-5sXlY0E=')
cipher_suite = Fernet(SECRET_KEY.encode() if isinstance(SECRET_KEY, str) else SECRET_KEY)

SMTP_SERVER = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
EMAIL_SENDER = os.environ.get('EMAIL_SENDER', '')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')

def init_db():
    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                is_verified INTEGER DEFAULT 0,
                otp TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                site_name TEXT NOT NULL,
                encrypted_password TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Add otp_expiry column safely if it doesn't exist
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN otp_expiry DATETIME")
        except sqlite3.OperationalError:
            pass # Column already exists
            
        conn.commit()

init_db()

def generate_otp():
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(receiver_email, full_name, otp):
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; padding: 40px 0;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.05); text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #6366f1; margin-bottom: 20px;">
                🛡️ BitVault
            </div>
            <h2 style="color: #333333;">Verify Your Email</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                Hello <strong>{full_name}</strong>,<br>
                Thank you for creating an account with BitVault. To complete your registration and secure your vault, please use the verification code below:
            </p>
            <div style="margin: 30px 0; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1;">
                <span style="font-size: 32px; font-weight: bold; color: #0f172a; letter-spacing: 5px;">{otp}</span>
            </div>
            <p style="color: #94a3b8; font-size: 14px;">
                This code will expire in 5 minutes. If you did not request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            <p style="color: #cbd5e1; font-size: 12px;">
                &copy; 2026 BitVault Security Team. All rights reserved.
            </p>
        </div>
    </body>
    </html>
    """
    
    if not EMAIL_SENDER or not EMAIL_PASSWORD:
        print("\n" + "="*50)
        print(f"📧 SIMULATED EMAIL TO: {receiver_email}")
        print("Set EMAIL_SENDER and EMAIL_PASSWORD in .env to send real emails.")
        print(f"OTP CODE: {otp}")
        print("="*50 + "\n")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Your BitVault Verification Code'
        msg['From'] = f"BitVault <{EMAIL_SENDER}>"
        msg['To'] = receiver_email
        msg.attach(MIMEText(html_content, 'html'))
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    full_name = data.get('fullName')
    email = data.get('email')
    username = data.get('username')
    password = data.get('password')

    if not all([full_name, email, username, password]):
        return jsonify({"error": "All fields are required"}), 400

    password_hash = generate_password_hash(password)
    otp = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=5)

    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute("SELECT id, is_verified FROM users WHERE username = ? OR email = ?", (username, email))
            existing_user = cursor.fetchone()
            
            if existing_user:
                if existing_user[1] == 1:
                    return jsonify({"error": "Verified account with this email or username already exists."}), 400
                else:
                    # User exists but not verified. Update their details and send new OTP.
                    cursor.execute("""
                        UPDATE users 
                        SET full_name=?, email=?, username=?, password_hash=?, otp=?, otp_expiry=? 
                        WHERE id=?
                    """, (full_name, email, username, password_hash, otp, expiry.strftime('%Y-%m-%d %H:%M:%S'), existing_user[0]))
            else:
                cursor.execute("""
                    INSERT INTO users (full_name, email, username, password_hash, otp, otp_expiry) 
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (full_name, email, username, password_hash, otp, expiry.strftime('%Y-%m-%d %H:%M:%S')))
                
            conn.commit()
            
            send_otp_email(email, full_name, otp)
            return jsonify({"message": "Registration initiated. OTP sent.", "username": username}), 201
            
    except Exception as e:
        return jsonify({"error": "Database error"}), 500

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    data = request.json
    username = data.get('username')
    otp = data.get('otp')

    if not username or not otp:
        return jsonify({"error": "Username and OTP required"}), 400

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, otp, otp_expiry FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_id, saved_otp, otp_expiry_str = user
        
        if not saved_otp or not otp_expiry_str:
            return jsonify({"error": "Invalid OTP state."}), 400
            
        try:
            otp_expiry = datetime.strptime(otp_expiry_str, '%Y-%m-%d %H:%M:%S')
            if datetime.utcnow() > otp_expiry:
                return jsonify({"error": "OTP has expired. Please register again."}), 400
        except ValueError:
            pass

        if saved_otp == otp:
            cursor.execute("UPDATE users SET is_verified = 1, otp = NULL, otp_expiry = NULL WHERE id = ?", (user_id,))
            conn.commit()
            return jsonify({"message": "Email verified successfully!"}), 200
        else:
            return jsonify({"error": "Invalid OTP"}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    with sqlite3.connect(DATABASE) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, username, password_hash, is_verified, full_name FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

        if user and check_password_hash(user[2], password):
            if user[3] == 0:
                return jsonify({"error": "Please verify your email before logging in."}), 403
            
            return jsonify({
                "message": "Login successful", 
                "token": user[0], 
                "username": user[1],
                "full_name": user[4]
            }), 200
        else:
            return jsonify({"error": "Invalid username or password"}), 401

@app.route('/passwords', methods=['POST'])
def save_password():
    data = request.json
    token = data.get('token')
    site_name = data.get('site_name')
    password = data.get('password')

    if not token or not site_name or not password:
        return jsonify({"error": "Missing fields"}), 400

    encrypted_password = cipher_suite.encrypt(password.encode('utf-8')).decode('utf-8')

    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO passwords (user_id, site_name, encrypted_password) VALUES (?, ?, ?)", 
                           (token, site_name, encrypted_password))
            conn.commit()
            return jsonify({"message": "Password saved to vault"}), 201
    except Exception as e:
        return jsonify({"error": "Database error"}), 500

@app.route('/passwords', methods=['GET'])
def get_passwords():
    token = request.args.get('token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, site_name, encrypted_password FROM passwords WHERE user_id = ?", (token,))
            rows = cursor.fetchall()

            decrypted_passwords = []
            for row in rows:
                p_id, site_name, encrypted_password = row
                try:
                    decrypted = cipher_suite.decrypt(encrypted_password.encode('utf-8')).decode('utf-8')
                except:
                    decrypted = "Error decrypting"

                decrypted_passwords.append({
                    "id": p_id,
                    "site_name": site_name,
                    "password": decrypted
                })

            return jsonify(decrypted_passwords), 200
    except Exception as e:
        return jsonify({"error": "Database error"}), 500
        
@app.route('/passwords/<int:p_id>', methods=['DELETE'])
def delete_password(p_id):
    token = request.args.get('token')
    if not token:
        return jsonify({"error": "Unauthorized"}), 401

    try:
        with sqlite3.connect(DATABASE) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM passwords WHERE id = ? AND user_id = ?", (p_id, token))
            conn.commit()
            return jsonify({"message": "Password deleted"}), 200
    except Exception as e:
        return jsonify({"error": "Database error"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
