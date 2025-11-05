# Install MongoDB Locally on Windows

## Method 1: Download MongoDB Installer (Recommended)

### Step 1: Download MongoDB
1. Go to: https://www.mongodb.com/try/download/community
2. Select:
   - Version: Latest (7.0.x)
   - Platform: Windows
   - Package: MSI
3. Click "Download"

### Step 2: Install MongoDB
1. Run the downloaded `.msi` file
2. Choose "Complete" installation
3. **IMPORTANT**: Check "Install MongoDB as a Service"
4. **IMPORTANT**: Check "Install MongoDB Compass" (GUI tool)
5. Click "Next" through the wizard
6. Click "Install"

### Step 3: Verify Installation
Open PowerShell or Command Prompt:
```bash
mongod --version
```

If you see version info, MongoDB is installed! ✅

### Step 4: Start MongoDB Service
MongoDB should auto-start as a Windows service. To verify:
```bash
# Check if service is running
net start | findstr MongoDB
```

If not running, start it:
```bash
net start MongoDB
```

### Step 5: Update Your .env File
Your `.env` already has the correct local connection:
```
MONGODB_URI=mongodb://localhost:27017/fever-collective
```
No changes needed! ✅

### Step 6: Restart Your Server
The server should auto-restart and connect to MongoDB.
Check terminal for: "MongoDB connected" ✅

---

## Method 2: Use Chocolatey (If you have it installed)

```bash
# Install Chocolatey first if needed:
# https://chocolatey.org/install

# Then install MongoDB:
choco install mongodb

# Start MongoDB:
mongod
```

---

## Method 3: Portable MongoDB (No Installation)

### Step 1: Download ZIP
1. Go to: https://www.mongodb.com/try/download/community
2. Select "ZIP" package instead of MSI
3. Download and extract to: `C:\mongodb`

### Step 2: Create Data Directory
```bash
mkdir C:\data\db
```

### Step 3: Start MongoDB
Open PowerShell in `C:\mongodb\bin`:
```bash
cd C:\mongodb\bin
.\mongod.exe --dbpath C:\data\db
```

Keep this window open! MongoDB is now running.

---

## Troubleshooting

### "mongod: command not found"
MongoDB isn't in your PATH. Use Method 3 (portable) or add to PATH:
1. Search Windows for "Environment Variables"
2. Edit "Path" variable
3. Add: `C:\Program Files\MongoDB\Server\7.0\bin`

### Port 27017 already in use
Another MongoDB instance is running. Either:
- Use that instance (it's working!)
- Stop it: `net stop MongoDB`
- Use different port in .env: `mongodb://localhost:27018/fever-collective`

### Connection refused
- Make sure MongoDB service is started
- Check Windows Services app for "MongoDB" service
- Try restarting: `net stop MongoDB && net start MongoDB`

---

## Quick Test

Once MongoDB is running, test the connection:

1. Open new PowerShell window
2. Run: `mongosh` (or `mongo` for older versions)
3. You should see a MongoDB shell prompt: `test>`
4. Type: `show dbs`
5. You should see a list of databases ✅

---

## Still Having Issues?

**Easiest solution**: Use MongoDB Atlas (cloud, free, 5 minutes)
- No installation needed
- Works everywhere
- Free forever for small projects
- See SETUP_GUIDE.md for instructions

---

## After MongoDB is Running

1. ✅ Check your server terminal - should see "MongoDB connected"
2. ✅ Go to http://localhost:3000/register
3. ✅ Create your account
4. ✅ Login
5. ✅ Access http://localhost:3000/admin
6. ✅ Create events!

Events page will now load instantly! 🚀
