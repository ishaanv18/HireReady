import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react'
import { ToastProvider } from './components/ToastNotification'
import Landing from './pages/Landing'
import ExtraDataForm from './pages/ExtraDataForm'
import OTPVerification from './pages/OTPVerification'
import Dashboard from './pages/Dashboard'
import ResumeAnalyzer from './pages/ResumeAnalyzer'
import InterviewSimulator from './pages/InterviewSimulator'
import Analytics from './pages/Analytics'
import LiveInterviewRoom from './pages/LiveInterviewRoom'
import InterviewReport from './pages/InterviewReport'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />

          {/* Protected Routes - Require Sign In */}
          <Route
            path="/register-extra-data"
            element={
              <>
                <SignedIn>
                  <ExtraDataForm />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/verify-otp"
            element={
              <>
                <SignedIn>
                  <OTPVerification />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/dashboard"
            element={
              <>
                <SignedIn>
                  <Dashboard />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/resume"
            element={
              <>
                <SignedIn>
                  <ResumeAnalyzer />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/interview"
            element={
              <>
                <SignedIn>
                  <InterviewSimulator />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/analytics"
            element={
              <>
                <SignedIn>
                  <Analytics />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/live-interview"
            element={
              <>
                <SignedIn>
                  <LiveInterviewRoom />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          <Route
            path="/interview-report"
            element={
              <>
                <SignedIn>
                  <InterviewReport />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App
