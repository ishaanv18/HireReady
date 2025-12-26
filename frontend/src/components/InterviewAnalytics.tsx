import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { motion } from 'framer-motion'
import {
    TrendingUp, TrendingDown, Award, Calendar, CheckCircle,
    XCircle, Clock, BarChart3, Target, Download, Trash2, Eye
} from 'lucide-react'
import axios from 'axios'
import jsPDF from 'jspdf'
import { useToast } from './ToastNotification'

interface InterviewEvaluation {
    sessionId: string
    userId: string
    overallScore: number
    decision: 'SELECTED' | 'REJECTED' | 'WAITLISTED'
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
    detailedFeedback: string
    questionScores: Array<{
        question: string
        answer: string
        score: number
        feedback: string
    }>
    createdAt: string
}

interface Analytics {
    totalInterviews: number
    selectedCount: number
    rejectedCount: number
    waitlistedCount: number
    averageScore: number
    successRate: number
    interviews: InterviewEvaluation[]
}

export default function InterviewAnalytics() {
    const { user } = useUser()
    const toast = useToast()
    const [analytics, setAnalytics] = useState<Analytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        const userId = localStorage.getItem('userId')
        if (userId) {
            fetchAnalytics(userId)
        }
    }, [user])

    const fetchAnalytics = async (userId: string) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/analytics/interviews/${userId}`)
            setAnalytics(response.data.data)
            setLoading(false)
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
            setLoading(false)
        }
    }

    const handleDelete = async (sessionId: string) => {
        setDeletingId(sessionId)
        try {
            await axios.delete(`http://localhost:8080/api/interview/live/evaluation/${sessionId}`)
            toast.success('Interview deleted successfully')
            // Refresh analytics
            const userId = localStorage.getItem('userId')
            if (userId) {
                fetchAnalytics(userId)
            }
        } catch (error) {
            console.error('Failed to delete interview:', error)
            toast.error('Failed to delete interview')
        } finally {
            setDeletingId(null)
        }
    }

    const downloadPDF = (interview: InterviewEvaluation, index: number) => {
        const pdf = new jsPDF()
        const colors = {
            primary: [109, 40, 217],
            success: [34, 197, 94],
            warning: [234, 179, 8],
            danger: [239, 68, 68],
            white: [255, 255, 255],
            dark: [31, 41, 55]
        }

        // Header
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
        pdf.rect(0, 0, 210, 40, 'F')
        pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2])
        pdf.setFontSize(24)
        pdf.setFont('helvetica', 'bold')
        pdf.text('INTERVIEW EVALUATION REPORT', 105, 20, { align: 'center' })
        pdf.setFontSize(12)
        pdf.text(`Interview #${index + 1} | ${new Date(interview.createdAt).toLocaleDateString()}`, 105, 30, { align: 'center' })

        let yPos = 50

        // Decision
        const decisionColor = interview.decision === 'SELECTED' ? colors.success :
            interview.decision === 'REJECTED' ? colors.danger : colors.warning
        pdf.setFillColor(decisionColor[0], decisionColor[1], decisionColor[2])
        pdf.roundedRect(15, yPos, 180, 30, 5, 5, 'F')
        pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2])
        pdf.setFontSize(20)
        pdf.text(interview.decision, 105, yPos + 12, { align: 'center' })
        pdf.setFontSize(16)
        pdf.text(`Score: ${interview.overallScore}/100`, 105, yPos + 23, { align: 'center' })

        yPos += 40

        // Detailed Feedback
        pdf.setFillColor(243, 244, 246)
        pdf.roundedRect(15, yPos, 180, 40, 3, 3, 'F')
        pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2])
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('DETAILED FEEDBACK', 20, yPos + 8)
        pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2])
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        const feedbackLines = pdf.splitTextToSize(interview.detailedFeedback, 170)
        pdf.text(feedbackLines, 20, yPos + 16)

        yPos += 50

        // Strengths & Weaknesses
        pdf.setFillColor(220, 252, 231)
        pdf.roundedRect(15, yPos, 87, 50, 3, 3, 'F')
        pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2])
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text('STRENGTHS', 20, yPos + 8)
        pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2])
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        let strengthY = yPos + 15
        interview.strengths.slice(0, 4).forEach((s, i) => {
            const lines = pdf.splitTextToSize(`${i + 1}. ${s}`, 77)
            pdf.text(lines, 20, strengthY)
            strengthY += lines.length * 4
        })

        pdf.setFillColor(254, 226, 226)
        pdf.roundedRect(108, yPos, 87, 50, 3, 3, 'F')
        pdf.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2])
        pdf.setFontSize(11)
        pdf.setFont('helvetica', 'bold')
        pdf.text('AREAS TO IMPROVE', 113, yPos + 8)
        pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2])
        pdf.setFontSize(8)
        pdf.setFont('helvetica', 'normal')
        let weaknessY = yPos + 15
        interview.weaknesses.slice(0, 4).forEach((w, i) => {
            const lines = pdf.splitTextToSize(`${i + 1}. ${w}`, 77)
            pdf.text(lines, 113, weaknessY)
            weaknessY += lines.length * 4
        })

        // Footer
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2])
        pdf.rect(0, 287, 210, 10, 'F')
        pdf.setTextColor(colors.white[0], colors.white[1], colors.white[2])
        pdf.setFontSize(8)
        pdf.text(`Generated by HireReady AI | ${new Date().toLocaleDateString()}`, 105, 293, { align: 'center' })

        pdf.save(`Interview_${index + 1}_${new Date(interview.createdAt).toISOString().split('T')[0]}.pdf`)
    }

    const getDecisionIcon = (decision: string) => {
        switch (decision) {
            case 'SELECTED': return <CheckCircle className="w-5 h-5" />
            case 'REJECTED': return <XCircle className="w-5 h-5" />
            case 'WAITLISTED': return <Clock className="w-5 h-5" />
            default: return null
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        )
    }

    if (!analytics || analytics.totalInterviews === 0) {
        return (
            <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No Interview Data Yet</h3>
                <p className="text-gray-400">Complete your first interview to see analytics here!</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Interviews */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200 shadow-md"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-10 h-10 text-blue-600" />
                        <span className="text-5xl font-bold text-blue-900">{analytics.totalInterviews}</span>
                    </div>
                    <p className="text-blue-800 font-semibold text-sm">Total Interviews</p>
                </motion.div>

                {/* Success Rate */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-green-50 rounded-xl p-6 border-2 border-green-200 shadow-md"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Target className="w-10 h-10 text-green-600" />
                        <span className="text-5xl font-bold text-green-900">{analytics.successRate}%</span>
                    </div>
                    <p className="text-green-800 font-semibold text-sm">Success Rate</p>
                </motion.div>

                {/* Average Score */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-amber-50 rounded-xl p-6 border-2 border-amber-200 shadow-md"
                >
                    <div className="flex items-center justify-between mb-2">
                        <Award className="w-10 h-10 text-amber-600" />
                        <span className="text-5xl font-bold text-amber-900">{analytics.averageScore}</span>
                    </div>
                    <p className="text-amber-800 font-semibold text-sm">Average Score</p>
                </motion.div>

                {/* Selected Count */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200 shadow-md"
                >
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-10 h-10 text-purple-600" />
                        <span className="text-5xl font-bold text-purple-900">{analytics.selectedCount}</span>
                    </div>
                    <p className="text-purple-800 font-semibold text-sm">Selected</p>
                </motion.div>
            </div>

            {/* Results Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md"
            >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <BarChart3 className="w-6 h-6 mr-2 text-purple-600" />
                    Results Breakdown
                </h3>
                <div className="grid grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-green-50 rounded-lg border-2 border-green-300">
                        <div className="text-5xl font-bold text-green-700 mb-2">{analytics.selectedCount}</div>
                        <div className="text-sm text-green-900 font-semibold">Selected</div>
                    </div>
                    <div className="text-center p-6 bg-amber-50 rounded-lg border-2 border-amber-300">
                        <div className="text-5xl font-bold text-amber-700 mb-2">{analytics.waitlistedCount}</div>
                        <div className="text-sm text-amber-900 font-semibold">Waitlisted</div>
                    </div>
                    <div className="text-center p-6 bg-red-50 rounded-lg border-2 border-red-300">
                        <div className="text-5xl font-bold text-red-700 mb-2">{analytics.rejectedCount}</div>
                        <div className="text-sm text-red-900 font-semibold">Rejected</div>
                    </div>
                </div>
            </motion.div>

            {/* Interview History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md"
            >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Eye className="w-6 h-6 mr-2 text-purple-600" />
                    Interview History
                </h3>
                <div className="space-y-3">
                    {analytics.interviews.map((interview, idx) => (
                        <motion.div
                            key={interview.sessionId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-all border-2 border-gray-200"
                        >
                            <div className="flex items-center space-x-4 flex-1">
                                <div className={`px-4 py-2 rounded-full border-2 flex items-center space-x-2 font-bold ${interview.decision === 'SELECTED' ? 'bg-green-100 text-green-800 border-green-400' :
                                    interview.decision === 'REJECTED' ? 'bg-red-100 text-red-800 border-red-400' :
                                        'bg-amber-100 text-amber-800 border-amber-400'
                                    }`}>
                                    {getDecisionIcon(interview.decision)}
                                    <span className="text-sm font-bold">{interview.decision}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-gray-900 font-bold">Interview #{analytics.interviews.length - idx}</div>
                                    <div className="text-sm text-gray-600 flex items-center space-x-3">
                                        <span>{new Date(interview.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="font-semibold">Score: {interview.overallScore}/100</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                {interview.overallScore >= 70 ? (
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                ) : (
                                    <TrendingDown className="w-6 h-6 text-red-600" />
                                )}
                                <span className="text-3xl font-bold text-gray-900">{interview.overallScore}</span>
                                <button
                                    onClick={() => downloadPDF(interview, idx)}
                                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg border-2 border-blue-300 transition-all"
                                    title="Download PDF"
                                >
                                    <Download className="w-5 h-5 text-blue-700" />
                                </button>
                                <button
                                    onClick={() => handleDelete(interview.sessionId)}
                                    disabled={deletingId === interview.sessionId}
                                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg border-2 border-red-300 transition-all disabled:opacity-50"
                                    title="Delete Interview"
                                >
                                    {deletingId === interview.sessionId ? (
                                        <div className="w-5 h-5 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-5 h-5 text-red-700" />
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
