# SecureVault

A modern, full-stack password generator and manager with zero-knowledge architecture.

## Deployment to PythonAnywhere

1. **Push to GitHub**:
   - Create an empty repository on your GitHub account.
   - Run the following in your terminal:
     ```bash
     git remote add origin https://github.com/your-username/your-repo-name.git
     git branch -M main
     git push -u origin main
     ```

2. **Setup on PythonAnywhere**:
   - Open a Bash console on PythonAnywhere.
   - Clone your repo: `git clone https://github.com/your-username/your-repo-name.git`
   - Create a virtualenv: `mkvirtualenv --python=python3.10 myenv`
   - Install requirements: `pip install -r your-repo-name/backend/requirements.txt`
   - Set up your `.env` file in the `backend` folder (copy from `.env.example`). Add your Gmail credentials here for the OTP to work.

3. **Web Tab Configuration**:
   - Source code: `/home/yourusername/your-repo-name/backend`
   - Working directory: `/home/yourusername/your-repo-name/backend`
   - WSGI configuration file: Edit the WSGI file to point to `wsgi.py` inside your backend folder.
   
4. **Static Files**:
   - To serve the frontend, map a static URL (e.g., `/`) to the `/home/yourusername/your-repo-name/frontend` directory.
