import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function ExtraDataForm() {
    const { user } = useUser()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.primaryEmailAddress?.emailAddress || '',
        privacyPolicyAccepted: false,
        termsAccepted: false,
        aiUsageConsentAccepted: false,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await authAPI.registerExtraData({
                clerkUserId: user!.id,
                ...formData,
            })

            if (response.data.success) {
                // Registration successful
                localStorage.setItem('userId', response.data.data.id)
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-card p-8 max-w-md w-full">
                <h2 className="text-3xl font-bold mb-6 text-center">Complete Your Profile</h2>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 focus:border-primary-500 focus:outline-none"
                            required
                        />
                    </div>

                    <div className="space-y-3 pt-4">
                        <label className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.privacyPolicyAccepted}
                                onChange={(e) => setFormData({ ...formData, privacyPolicyAccepted: e.target.checked })}
                                className="mt-1"
                                required
                            />
                            <span className="text-sm">I accept the Privacy Policy</span>
                        </label>

                        <label className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.termsAccepted}
                                onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                                className="mt-1"
                                required
                            />
                            <span className="text-sm">I accept the Terms of Service</span>
                        </label>

                        <label className="flex items-start space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.aiUsageConsentAccepted}
                                onChange={(e) => setFormData({ ...formData, aiUsageConsentAccepted: e.target.checked })}
                                className="mt-1"
                                required
                            />
                            <span className="text-sm">I consent to Responsible AI Usage</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full glass-button disabled:opacity-50"
                    >
                        {loading ? 'Registering...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    )
}
