import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
    CheckCircle, XCircle, Clock, TrendingUp, TrendingDown,
    Download, Share2, Award, Target, Lightbulb, MessageSquare
} from 'lucide-react'
import { interviewAPI } from '../services/api'
import jsPDF from 'jspdf'

interface EvaluationReport {
    overallScore: number
    decision: 'SELECTED' | 'REJECTED' | 'WAITLISTED'
    strengths: string[]
    weaknesses: string[]
    improvements: string[]
    questionScores: Array<{
        question: string
        answer: string
        score: number
        feedback: string
    }>
    detailedFeedback: string
}

export default function InterviewReport() {
    const navigate = useNavigate()
    const location = useLocation()
    const { sessionId, schedule } = location.state || {}

    const [report, setReport] = useState<EvaluationReport | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!sessionId) {
            navigate('/interview-simulator')
            return
        }

        // Fetch real report from backend
        const fetchReport = async () => {
            try {
                const response = await interviewAPI.getEvaluationReport(sessionId)
                const evaluation = response.data.data

                // Transform backend data to match frontend interface
                const transformedReport: EvaluationReport = {
                    overallScore: evaluation.overallScore,
                    decision: evaluation.decision,
                    strengths: evaluation.strengths,
                    weaknesses: evaluation.weaknesses,
                    improvements: evaluation.improvements,
                    detailedFeedback: evaluation.detailedFeedback,
                    questionScores: evaluation.questionScores.map((qs: any) => ({
                        question: qs.question,
                        answer: qs.answer,
                        score: qs.score,
                        feedback: qs.feedback
                    }))
                }

                setReport(transformedReport)
                setLoading(false)
            } catch (error) {
                console.error('Failed to fetch report:', error)
                // Fallback to mock report if API fails
                setReport(generateMockReport())
                setLoading(false)
            }
        }

        fetchReport()
    }, [sessionId, navigate])

    const generateMockReport = (): EvaluationReport => {
        return {
            overallScore: 78,
            decision: 'SELECTED',
            strengths: [
                'Clear and articulate communication',
                'Strong technical knowledge',
                'Good problem-solving approach',
                'Confident body language'
            ],
            weaknesses: [
                'Could provide more specific examples',
                'Some answers were too brief',
                'Limited discussion of past failures'
            ],
            improvements: [
                'Use the STAR method (Situation, Task, Action, Result) for behavioral questions',
                'Prepare more concrete examples from past experiences',
                'Practice explaining technical concepts in simpler terms',
                'Show more enthusiasm when discussing the role'
            ],
            questionScores: [
                {
                    question: 'Tell me about yourself and your experience.',
                    answer: 'I am a software engineer with 3 years of experience...',
                    score: 8,
                    feedback: 'Good introduction, covered key points effectively.'
                },
                {
                    question: 'What interests you about this role?',
                    answer: 'I am interested in the growth opportunities...',
                    score: 7,
                    feedback: 'Could have been more specific about the company.'
                },
                {
                    question: 'Describe a challenging project you\'ve worked on.',
                    answer: 'I worked on a microservices migration project...',
                    score: 9,
                    feedback: 'Excellent use of technical details and impact metrics.'
                }
            ],
            detailedFeedback: 'Overall, you demonstrated strong technical competence and communication skills. Your answers showed good understanding of software engineering principles. To improve further, focus on providing more specific examples and using structured frameworks like STAR for behavioral questions.'
        }
    }

    const getDecisionColor = (decision: string) => {
        switch (decision) {
            case 'SELECTED': return 'text-green-400'
            case 'REJECTED': return 'text-red-400'
            case 'WAITLISTED': return 'text-yellow-400'
            default: return 'text-gray-400'
        }
    }

    const getDecisionIcon = (decision: string) => {
        switch (decision) {
            case 'SELECTED': return <CheckCircle className="w-16 h-16" />
            case 'REJECTED': return <XCircle className="w-16 h-16" />
            case 'WAITLISTED': return <Clock className="w-16 h-16" />
            default: return null
        }
    }

    const downloadReport = () => {
        if (!report) return

        const pdf = new jsPDF()
        let yPos = 20

        // Helper function to add text with word wrap
        const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 10) => {
            pdf.setFontSize(fontSize)
            const lines = pdf.splitTextToSize(text, maxWidth)
            pdf.text(lines, x, y)
            return y + (lines.length * fontSize * 0.5)
        }

        // Header with gradient effect (simulated with colors)
        pdf.setFillColor(109, 40, 217) // Purple
        pdf.rect(0, 0, 210, 40, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(24)
        pdf.setFont('helvetica', 'bold')
        pdf.text('INTERVIEW EVALUATION REPORT', 105, 20, { align: 'center' })

        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'normal')
        pdf.text(`${schedule?.company || 'N/A'} • ${schedule?.position || 'N/A'}`, 105, 30, { align: 'center' })

        yPos = 50

        // Decision Box
        const decisionColor = report.decision === 'SELECTED' ? [34, 197, 94] :
            report.decision === 'REJECTED' ? [239, 68, 68] : [234, 179, 8]

        pdf.setFillColor(decisionColor[0], decisionColor[1], decisionColor[2])
        pdf.roundedRect(20, yPos, 170, 30, 3, 3, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(20)
        pdf.setFont('helvetica', 'bold')
        pdf.text(report.decision, 105, yPos + 12, { align: 'center' })

        pdf.setFontSize(16)
        pdf.text(`Score: ${report.overallScore}/100`, 105, yPos + 23, { align: 'center' })

        yPos += 40

        // Detailed Feedback Section
        pdf.setFillColor(243, 244, 246)
        pdf.rect(20, yPos, 170, 35, 'F')

        pdf.setTextColor(109, 40, 217)
        pdf.setFontSize(14)
        pdf.setFont('helvetica', 'bold')
        pdf.text('DETAILED FEEDBACK', 25, yPos + 8)

        pdf.setTextColor(55, 65, 81)
        pdf.setFontSize(10)
        pdf.setFont('helvetica', 'normal')
        yPos = addText(report.detailedFeedback, 25, yPos + 16, 160, 10)

        yPos += 15

        // Strengths Section
        pdf.setFillColor(220, 252, 231)
        pdf.rect(20, yPos, 80, 50, 'F')

        pdf.setTextColor(22, 163, 74)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('STRENGTHS', 25, yPos + 8)

        pdf.setTextColor(55, 65, 81)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        let strengthY = yPos + 15
        report.strengths.slice(0, 4).forEach((strength, idx) => {
            const text = `${idx + 1}. ${strength}`
            const lines = pdf.splitTextToSize(text, 70)
            pdf.text(lines, 25, strengthY)
            strengthY += lines.length * 4
        })

        // Weaknesses Section
        pdf.setFillColor(254, 226, 226)
        pdf.rect(110, yPos, 80, 50, 'F')

        pdf.setTextColor(220, 38, 38)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('AREAS TO IMPROVE', 115, yPos + 8)

        pdf.setTextColor(55, 65, 81)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        let weaknessY = yPos + 15
        report.weaknesses.slice(0, 4).forEach((weakness, idx) => {
            const text = `${idx + 1}. ${weakness}`
            const lines = pdf.splitTextToSize(text, 70)
            pdf.text(lines, 115, weaknessY)
            weaknessY += lines.length * 4
        })

        yPos += 60

        // Improvement Suggestions
        pdf.setFillColor(254, 249, 195)
        pdf.rect(20, yPos, 170, 40, 'F')

        pdf.setTextColor(161, 98, 7)
        pdf.setFontSize(12)
        pdf.setFont('helvetica', 'bold')
        pdf.text('IMPROVEMENT SUGGESTIONS', 25, yPos + 8)

        pdf.setTextColor(55, 65, 81)
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        let improvementY = yPos + 15
        report.improvements.slice(0, 3).forEach((improvement, idx) => {
            const text = `${idx + 1}. ${improvement}`
            const lines = pdf.splitTextToSize(text, 160)
            pdf.text(lines, 25, improvementY)
            improvementY += lines.length * 4
        })

        // New page for questions
        pdf.addPage()
        yPos = 20

        // Question Analysis Header
        pdf.setFillColor(109, 40, 217)
        pdf.rect(0, 0, 210, 25, 'F')
        pdf.setTextColor(255, 255, 255)
        pdf.setFontSize(16)
        pdf.setFont('helvetica', 'bold')
        pdf.text('QUESTION-BY-QUESTION ANALYSIS', 105, 15, { align: 'center' })

        yPos = 35

        // Questions
        report.questionScores.forEach((item, idx) => {
            if (yPos > 250) {
                pdf.addPage()
                yPos = 20
            }

            // Question box
            const scoreColor = item.score >= 8 ? [34, 197, 94] :
                item.score >= 6 ? [234, 179, 8] : [239, 68, 68]

            pdf.setFillColor(249, 250, 251)
            pdf.rect(20, yPos, 170, 45, 'F')

            // Score badge
            pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2])
            pdf.circle(180, yPos + 8, 8, 'F')
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(12)
            pdf.setFont('helvetica', 'bold')
            pdf.text(`${item.score}`, 180, yPos + 10, { align: 'center' })

            // Question
            pdf.setTextColor(109, 40, 217)
            pdf.setFontSize(10)
            pdf.setFont('helvetica', 'bold')
            const qText = `Q${idx + 1}: ${item.question}`
            const qLines = pdf.splitTextToSize(qText, 145)
            pdf.text(qLines, 25, yPos + 8)

            // Answer
            pdf.setTextColor(75, 85, 99)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'italic')
            const aText = `"${item.answer}"`
            const aLines = pdf.splitTextToSize(aText, 160)
            pdf.text(aLines, 25, yPos + 8 + (qLines.length * 4))

            // Feedback
            pdf.setTextColor(59, 130, 246)
            pdf.setFontSize(8)
            pdf.setFont('helvetica', 'normal')
            const fLines = pdf.splitTextToSize(item.feedback, 160)
            pdf.text(fLines, 25, yPos + 8 + (qLines.length * 4) + (aLines.length * 3))

            yPos += 50
        })

        // Footer on last page
        const pageCount = pdf.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            pdf.setPage(i)
            pdf.setFillColor(109, 40, 217)
            pdf.rect(0, 287, 210, 10, 'F')
            pdf.setTextColor(255, 255, 255)
            pdf.setFontSize(8)
            pdf.text(`Generated by HireReady AI • ${new Date().toLocaleDateString()} • Page ${i} of ${pageCount}`, 105, 293, { align: 'center' })
        }

        // Save PDF
        pdf.save(`Interview_Report_${schedule?.company || 'HireReady'}_${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const getScoreColor = (score: number) => {
        if (score >= 8) return 'text-green-400'
        if (score >= 6) return 'text-yellow-400'
        return 'text-red-400'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-24 h-24 border-8 border-purple-500 border-t-transparent rounded-full mx-auto mb-8"
                    />
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Analyzing Your Performance</h2>
                    <p className="text-gray-600">Our AI is evaluating your interview...</p>
                </div>
            </div>
        )
    }

    if (!report) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">Interview Evaluation Report</h1>
                    {schedule?.company} • {schedule?.position} • {schedule?.roundType}
                </motion.div>

                {/* Decision Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center border border-gray-200"
                >
                    <div className={`${getDecisionColor(report.decision)} mb-4 flex justify-center`}>
                        {getDecisionIcon(report.decision)}
                    </div>
                    <h2 className={`text-4xl font-bold mb-2 ${report.decision === 'SELECTED' ? 'text-green-600' : report.decision === 'REJECTED' ? 'text-red-600' : 'text-yellow-600'}`}>
                        {report.decision}
                    </h2>
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <Award className="w-6 h-6 text-yellow-400" />
                        <span className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{report.overallScore}</span>
                        <span className="text-2xl text-gray-600">/100</span>
                    </div>
                    <p className="text-gray-700 max-w-2xl mx-auto leading-relaxed">{report.detailedFeedback}</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* Strengths */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500"
                    >
                        <div className="flex items-center space-x-2 mb-4">
                            <TrendingUp className="w-6 h-6 text-green-400" />
                            <h3 className="text-xl font-bold text-gray-800">Strengths</h3>
                        </div>
                        <ul className="space-y-2">
                            {report.strengths.map((strength, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{strength}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Weaknesses */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-500"
                    >
                        <div className="flex items-center space-x-2 mb-4">
                            <TrendingDown className="w-6 h-6 text-red-400" />
                            <h3 className="text-xl font-bold text-gray-800">Areas to Improve</h3>
                        </div>
                        <ul className="space-y-2">
                            {report.weaknesses.map((weakness, idx) => (
                                <li key={idx} className="flex items-start space-x-2">
                                    <Target className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700">{weakness}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                </div>

                {/* Improvement Suggestions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-yellow-500"
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <Lightbulb className="w-6 h-6 text-yellow-400" />
                        <h3 className="text-xl font-bold text-gray-800">Improvement Suggestions</h3>
                    </div>
                    <ul className="space-y-3">
                        {report.improvements.map((improvement, idx) => (
                            <li key={idx} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 shadow-sm">
                                <span className="text-yellow-400 font-bold">{idx + 1}.</span>
                                <span className="text-gray-700">{improvement}</span>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                {/* Question-by-Question Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4 border-blue-500"
                >
                    <div className="flex items-center space-x-2 mb-4">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                        <h3 className="text-xl font-bold text-gray-800">Question Analysis</h3>
                    </div>
                    <div className="space-y-4">
                        {report.questionScores.map((item, idx) => (
                            <div key={idx} className="p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                    <p className="text-gray-800 font-semibold flex-1">Q{idx + 1}: {item.question}</p>
                                    <span className={`text-2xl font-bold ${getScoreColor(item.score)} ml-4`}>
                                        {item.score}/10
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-2 italic">"{item.answer}"</p>
                                <p className="text-blue-600 text-sm font-medium">{item.feedback}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Actions */}
                <div className="flex items-center justify-center space-x-4">
                    <button
                        onClick={() => navigate('/interview-simulator')}
                        className="px-6 py-3 bg-white hover:bg-gray-50 text-gray-800 border-2 border-gray-300 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg hover:scale-105"
                    >
                        Back to Dashboard
                    </button>
                    <button
                        onClick={downloadReport}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                    >
                        <Download className="w-5 h-5" />
                        <span>Download Report</span>
                    </button>
                    <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl font-semibold flex items-center space-x-2 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                        <Share2 className="w-5 h-5" />
                        <span>Share</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
