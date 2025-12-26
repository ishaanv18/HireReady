import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function OTPVerification() {
    const navigate = useNavigate()
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [canResend, setCanResend] = useState(false)
    const [countdown, setCountdown] = useState(60)

    const userId = localStorage.getItem('userId')

    useEffect(() => {
        if (!userId) {
            navigate('/register-extra-data')
            return
        }

        // Send initial OTP
        sendOTP()
    }, [userId])

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else {
            setCanResend(true)
        }
    }, [countdown])

    const sendOTP = async () => {
        try {
            await authAPI.sendOTP(userId!)
            setSuccess('OTP sent to your email')
            setCountdown(60)
            setCanResend(false)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send OTP')
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await authAPI.verifyOTP(userId!, otp)

            if (response.data.success) {
                setSuccess('Email verified successfully!')
                setTimeout(() => navigate('/dashboard'), 1500)
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center">Verify Your Email</h2>
                <p className="text-gray-300 text-center mb-6">
                    We've sent a 4-digit code to your email. Please enter it below.
                </p>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg mb-4">
                        {success}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="Enter 4-digit code"
                            className="w-full px-4 py-3 text-center text-2xl tracking-widest rounded-lg bg-white/10 border border-white/20 focus:border-primary-500 focus:outline-none"
                            maxLength={4}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 4}
                        className="w-full glass-button disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>

                    <div className="text-center">
                        {canResend ? (
                            <button
                                type="button"
                                onClick={sendOTP}
                                className="text-primary-400 hover:text-primary-300"
                            >
                                Resend Code
                            </button>
                        ) : (
                            <p className="text-gray-400">
                                Resend code in {countdown}s
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}
