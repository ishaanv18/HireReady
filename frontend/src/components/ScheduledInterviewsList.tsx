import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Play, AlertCircle, Lightbulb } from 'lucide-react'
import { motion } from 'framer-motion'
import { interviewAPI } from '../services/api'
import { useToast } from './ToastNotification'

export default function ScheduledInterviewsList() {
    const navigate = useNavigate()
    const toast = useToast()
    const [schedules, setSchedules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        loadSchedules()
        // Update current time every minute
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const loadSchedules = async () => {
        try {
            const userId = localStorage.getItem('userId')
            if (!userId) return

            const response = await interviewAPI.getSchedules(userId)
            const allSchedules = response.data.data || []
            // Filter to show only scheduled and in-progress interviews
            const activeSchedules = allSchedules.filter((s: any) =>
                s.status === 'SCHEDULED' || s.status === 'IN_PROGRESS'
            )
            setSchedules(activeSchedules)
        } catch (error) {
            console.error('Failed to load schedules:', error)
        } finally {
            setLoading(false)
        }
    }

    const canJoin = (scheduledTime: string) => {
        const scheduleDate = new Date(scheduledTime)
        const now = currentTime
        // Can join 5 minutes before scheduled time
        const fiveMinsBefore = new Date(scheduleDate.getTime() - 5 * 60000)
        return now >= fiveMinsBefore
    }

    const getTimeUntil = (scheduledTime: string) => {
        const scheduleDate = new Date(scheduledTime)
        const diff = scheduleDate.getTime() - currentTime.getTime()

        if (diff < 0) return 'Ready to join'

        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

        if (hours > 24) {
            const days = Math.floor(hours / 24)
            return `in ${days} day${days > 1 ? 's' : ''}`
        }
        if (hours > 0) {
            return `in ${hours}h ${minutes}m`
        }
        return `in ${minutes} min${minutes !== 1 ? 's' : ''}`
    }

    const INTERVIEW_TIPS = [
        { icon: '💡', tip: 'Test your microphone and camera before the interview' },
        { icon: '📝', tip: 'Keep a notepad ready for taking notes' },
        { icon: '🎯', tip: 'Review the job description and company info' },
        { icon: '⏰', tip: 'Join 2-3 minutes early to avoid technical issues' },
        { icon: '🌟', tip: 'Prepare examples using the STAR method' },
        { icon: '💼', tip: 'Dress professionally, even for video interviews' }
    ]

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Interview Tips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6"
            >
                <div className="flex items-center space-x-2 mb-4">
                    <Lightbulb className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-bold text-gray-900">Interview Preparation Tips</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                    {INTERVIEW_TIPS.map((item, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-sm text-gray-700">
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.tip}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Scheduled Interviews */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Scheduled Interviews</h2>

                {schedules.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg mb-2">No scheduled interviews</p>
                        <p className="text-gray-500 text-sm">Schedule your first interview to get started!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schedules.map((schedule) => {
                            const joinable = canJoin(schedule.scheduledTime)
                            const timeUntil = getTimeUntil(schedule.scheduledTime)

                            return (
                                <motion.div
                                    key={schedule.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`border-2 rounded-xl p-6 transition-all ${joinable
                                        ? 'border-green-400 bg-green-50'
                                        : 'border-purple-200 bg-white'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <h3 className="text-xl font-bold text-gray-900">{schedule.company}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${joinable
                                                    ? 'bg-green-200 text-green-800'
                                                    : 'bg-purple-200 text-purple-800'
                                                    }`}>
                                                    {timeUntil}
                                                </span>
                                            </div>

                                            <div className="space-y-2 text-sm text-gray-700">
                                                <p><strong>Position:</strong> {schedule.position}</p>
                                                <p><strong>Round:</strong> {schedule.roundType}</p>
                                                <p><strong>Difficulty:</strong> {schedule.difficulty}</p>
                                                <div className="flex items-center space-x-2">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{new Date(schedule.scheduledTime).toLocaleString('en-IN', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-4 flex flex-col space-y-2">
                                            {joinable ? (
                                                <button
                                                    onClick={() => navigate('/live-interview', { state: { schedule } })}
                                                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center space-x-2"
                                                >
                                                    <Play className="w-5 h-5" />
                                                    <span>Join Now</span>
                                                </button>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="px-6 py-3 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed flex items-center space-x-2">
                                                        <AlertCircle className="w-5 h-5" />
                                                        <span>Not Yet</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-2">Available 5 mins before</p>
                                                </div>
                                            )}
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        await interviewAPI.deleteSchedule(schedule.id)
                                                        toast.success('Interview deleted successfully')
                                                        loadSchedules() // Reload the list
                                                    } catch (error) {
                                                        console.error('Failed to delete:', error)
                                                        toast.error('Failed to delete interview')
                                                    }
                                                }}
                                                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
