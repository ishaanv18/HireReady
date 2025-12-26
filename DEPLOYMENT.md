# HireReady Deployment Guide

## 🚀 Deployment Overview

This guide will help you deploy HireReady with:
- **Backend**: Render (Docker)
- **Frontend**: Vercel
- **Database**: MongoDB Atlas

---

## 📋 Prerequisites

1. **GitHub Account** - For code repository
2. **Render Account** - For backend hosting (https://render.com)
3. **Vercel Account** - For frontend hosting (https://vercel.com)
4. **MongoDB Atlas Account** - For database (https://mongodb.com/atlas)
5. **Clerk Account** - For authentication (https://clerk.com)

---

## 🗄️ Step 1: Setup MongoDB Atlas

### 1.1 Create Cluster
1. Go to https://mongodb.com/atlas
2. Sign up / Log in
3. Click "Build a Database"
4. Choose **FREE** tier (M0)
5. Select a cloud provider and region (choose closest to your Render region)
6. Name your cluster (e.g., "hireready-cluster")
7. Click "Create"

### 1.2 Create Database User
1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `hireready_user`
5. Generate a secure password (save it!)
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.3 Configure Network Access
1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
   - This is needed for Render's dynamic IPs
4. Click "Confirm"

### 1.4 Get Connection String
1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `hireready`

Example:
```
mongodb+srv://hireready_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/hireready?retryWrites=true&w=majority
```

---

## 🐳 Step 2: Deploy Backend to Render

### 2.1 Push Code to GitHub
```bash
cd c:\Users\ishaa\Downloads\AntiGravity\HireReady
git init
git add .
git commit -m "Initial commit - Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/HireReady.git
git push -u origin main
```

### 2.2 Create Render Service
1. Go to https://render.com
2. Sign up / Log in with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Select "HireReady" repository

### 2.3 Configure Service
- **Name**: `hireready-backend`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Docker`
- **Instance Type**: `Free`

### 2.4 Add Environment Variables
Click "Advanced" and add these environment variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `GROQ_API_KEY` | Your Groq API key |
| `CLERK_SECRET_KEY` | Your Clerk secret key |
| `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` (update after Vercel deployment) |
| `PORT` | `8080` |
| `TESSERACT_PATH` | `/usr/bin/tesseract` |
| `MAIL_USERNAME` | Your Gmail address |
| `MAIL_PASSWORD` | Your Gmail app password |

### 2.5 Deploy
1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy your backend URL (e.g., `https://hireready-backend.onrender.com`)

### 2.6 Test Backend
Visit: `https://your-backend.onrender.com/api/health`

You should see a health check response.

---

## ⚡ Step 3: Deploy Frontend to Vercel

### 3.1 Update Frontend Environment
1. Open `frontend/.env.production`
2. Update `VITE_API_URL` with your Render backend URL:
   ```
   VITE_API_URL=https://your-backend.onrender.com/api
   ```
3. Add your Clerk publishable key:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

### 3.2 Commit Changes
```bash
git add frontend/.env.production
git commit -m "Update production environment variables"
git push
```

### 3.3 Deploy to Vercel
1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click "Add New" → "Project"
4. Import your "HireReady" repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.4 Add Environment Variables
In Vercel project settings → Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Your Clerk publishable key |

### 3.5 Deploy
1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Copy your frontend URL (e.g., `https://hireready.vercel.app`)

---

## 🔄 Step 4: Update CORS Settings

### 4.1 Update Backend CORS
1. Go to Render dashboard
2. Select your backend service
3. Go to "Environment"
4. Update `CORS_ALLOWED_ORIGINS`:
   ```
   https://your-app.vercel.app
   ```
5. Save changes
6. Service will automatically redeploy

---

## 🔐 Step 5: Configure Clerk

### 5.1 Update Clerk Settings
1. Go to https://clerk.com dashboard
2. Select your application
3. Go to "Paths" settings
4. Update allowed origins:
   - Add `https://your-app.vercel.app`
5. Go to "API Keys"
6. Copy your publishable key (already added to Vercel)

---

## ✅ Step 6: Test Deployment

### 6.1 Test Frontend
1. Visit your Vercel URL
2. Sign up for a new account
3. Complete onboarding

### 6.2 Test Resume Analysis
1. Upload a resume
2. Verify analysis works
3. Check ATS score

### 6.3 Test Interview Simulator
1. Schedule an interview
2. Start live interview
3. Answer questions
4. Check evaluation report

### 6.4 Test Analytics
1. View dashboard metrics
2. Check interview analytics
3. Download PDF reports

---

## 🐛 Troubleshooting

### Backend Issues

**Problem**: Service won't start
- Check Render logs
- Verify all environment variables are set
- Check MongoDB connection string

**Problem**: API returns 500 errors
- Check Render logs for stack traces
- Verify AI API keys are valid
- Check MongoDB connection

**Problem**: Tesseract OCR not working
- Verify `TESSERACT_PATH=/usr/bin/tesseract`
- Check Render logs for OCR errors

### Frontend Issues

**Problem**: Can't connect to backend
- Verify `VITE_API_URL` is correct
- Check CORS settings on backend
- Open browser console for errors

**Problem**: Authentication not working
- Verify Clerk publishable key
- Check Clerk dashboard for allowed origins
- Clear browser cache and cookies

**Problem**: Build fails
- Check Vercel build logs
- Verify all dependencies in package.json
- Check for TypeScript errors

### Database Issues

**Problem**: Can't connect to MongoDB
- Verify connection string format
- Check database user credentials
- Verify network access (0.0.0.0/0)
- Check MongoDB Atlas cluster status

---

## 📊 Monitoring

### Render Monitoring
- View logs: Render Dashboard → Your Service → Logs
- Check metrics: CPU, Memory usage
- Set up alerts for downtime

### Vercel Monitoring
- View deployments: Vercel Dashboard → Your Project
- Check analytics: Page views, performance
- Monitor build times

### MongoDB Monitoring
- Atlas Dashboard → Metrics
- Monitor connections, operations
- Set up alerts for high usage

---

## 🔄 Continuous Deployment

Both Render and Vercel support automatic deployments:

1. **Push to GitHub** → Automatic deployment
2. **Render**: Redeploys backend on push to `main`
3. **Vercel**: Redeploys frontend on push to `main`

### Manual Deployment
- **Render**: Dashboard → Service → Manual Deploy
- **Vercel**: Dashboard → Project → Redeploy

---

## 💰 Cost Optimization

### Free Tier Limits
- **Render Free**: 750 hours/month, sleeps after 15 min inactivity
- **Vercel Free**: 100 GB bandwidth, unlimited deployments
- **MongoDB Atlas Free**: 512 MB storage, shared cluster

### Tips
1. Use Render's "Auto-Deploy" only for production branch
2. Delete old Vercel deployments
3. Monitor MongoDB storage usage
4. Consider upgrading if traffic increases

---

## 🚀 Going to Production

### Before Launch Checklist
- [ ] All environment variables set correctly
- [ ] CORS configured properly
- [ ] Clerk production keys configured
- [ ] MongoDB production cluster
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Analytics setup (Google Analytics, etc.)
- [ ] Custom domain configured
- [ ] SSL certificates active
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

### Custom Domain Setup

**Vercel**:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

**Render**:
1. Go to Service Settings → Custom Domain
2. Add your custom domain
3. Update DNS records as instructed

---

## 📞 Support

If you encounter issues:
1. Check Render logs
2. Check Vercel deployment logs
3. Check MongoDB Atlas metrics
4. Review this guide
5. Contact support:
   - Render: https://render.com/docs
   - Vercel: https://vercel.com/docs
   - MongoDB: https://mongodb.com/docs

---

## 🎉 Congratulations!

Your HireReady application is now deployed and accessible worldwide!

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-backend.onrender.com
- **Database**: MongoDB Atlas

**Next Steps**:
- Share with users
- Monitor performance
- Gather feedback
- Iterate and improve

---

**Made with ❤️ by Ishaan Verma**
