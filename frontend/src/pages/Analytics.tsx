import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, FileText, Download, Eye, Calendar, TrendingUp, Award, Trash2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Card from '../components/Card'
import ProgressBar from '../components/ProgressBar'
import { resumeAPI } from '../services/api'
import { useToast } from '../components/ToastNotification'

interface Resume {
    id: string
    fileName: string
    fileType: string
    analyzedAt: string
    atsScore: number
    skills: string[]
    skillGapAnalysis: any
    weaknesses: string[]
    recommendations: string[]
    experienceLevel?: string
    targetRole?: string
    strengths?: string[]
}

export default function Analytics() {
    const toast = useToast()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [resumes, setResumes] = useState<Resume[]>([])
    const [selectedResume, setSelectedResume] = useState<Resume | null>(null)
    const [loading, setLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        loadResumeHistory()
    }, [])

    const loadResumeHistory = async () => {
        try {
            const userId = localStorage.getItem('userId')
            if (!userId) return

            const response = await resumeAPI.getHistory(userId)
            const resumeData = response.data.data

            // Should already be an array from the history endpoint
            const resumeList = Array.isArray(resumeData) ? resumeData : [resumeData]
            setResumes(resumeList.filter(r => r !== null))
        } catch (err) {
            console.error('Failed to load resume history:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (resumeId: string) => {
        setDeletingId(resumeId)
        try {
            await resumeAPI.delete(resumeId)
            toast.success('Resume deleted successfully')
            // Remove from local state
            setResumes(resumes.filter(r => r.id !== resumeId))
            // Clear selection if deleted resume was selected
            if (selectedResume?.id === resumeId) {
                setSelectedResume(null)
            }
        } catch (error) {
            console.error('Failed to delete resume:', error)
            toast.error('Failed to delete resume')
        } finally {
            setDeletingId(null)
        }
    }

    const downloadReport = (resume: Resume) => {
        // Dynamic import to avoid SSR issues
        import('jspdf').then(({ jsPDF }) => {
            const doc = new jsPDF()

            // Colors
            const primaryColor = [147, 51, 234] // purple-600
            const textColor = [31, 41, 55] // gray-800
            const lightGray = [243, 244, 246] // gray-100

            let yPos = 20

            // Header with gradient effect
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.rect(0, 0, 210, 40, 'F')

            // Title
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('HireReady', 20, 20)

            doc.setFontSize(14)
            doc.setFont('helvetica', 'normal')
            doc.text('Resume Analysis Report', 20, 30)

            yPos = 50

            // Resume Info Section
            doc.setTextColor(textColor[0], textColor[1], textColor[2])
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('File: ' + resume.fileName, 20, yPos)
            yPos += 6
            doc.text('Analyzed: ' + formatDate(resume.analyzedAt), 20, yPos)
            yPos += 6
            doc.text('Type: ' + resume.fileType, 20, yPos)
            yPos += 6

            // Add Experience Level and Role if available
            if (resume.experienceLevel) {
                doc.text('Experience Level: ' + resume.experienceLevel, 20, yPos)
                yPos += 6
            }
            if (resume.targetRole) {
                doc.text('Target Role: ' + resume.targetRole, 20, yPos)
                yPos += 6
            }
            yPos += 10

            // ATS Score Section
            doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
            doc.roundedRect(15, yPos - 5, 180, 30, 3, 3, 'F')

            doc.setFontSize(16)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.text('ATS Compatibility Score', 20, yPos + 5)

            doc.setFontSize(32)
            doc.text((resume.atsScore?.toFixed(0) || '0') + '%', 160, yPos + 15)

            // Score bar
            const barWidth = 100
            const scoreWidth = (resume.atsScore / 100) * barWidth
            doc.setFillColor(220, 220, 220)
            doc.roundedRect(20, yPos + 20, barWidth, 4, 2, 2, 'F')
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.roundedRect(20, yPos + 20, scoreWidth, 4, 2, 2, 'F')

            yPos += 40

            // Strengths Section
            if (resume.strengths && resume.strengths.length > 0) {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(22, 163, 74) // green-600
                doc.text('Strengths', 20, yPos)
                yPos += 8

                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(textColor[0], textColor[1], textColor[2])
                resume.strengths.forEach((strength: string) => {
                    if (yPos > 270) {
                        doc.addPage()
                        yPos = 20
                    }
                    const lines = doc.splitTextToSize('+ ' + strength, 170)
                    doc.text(lines, 20, yPos)
                    yPos += lines.length * 5 + 3
                })
                yPos += 5
            }

            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage()
                yPos = 20
            }

            // Skills Section
            if (resume.skills && resume.skills.length > 0) {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(textColor[0], textColor[1], textColor[2])
                doc.text('Skills Identified', 20, yPos)
                yPos += 8

                doc.setFontSize(9)
                doc.setFont('helvetica', 'normal')
                const skillsText = resume.skills.join(', ')
                const splitSkills = doc.splitTextToSize(skillsText, 170)
                doc.text(splitSkills, 20, yPos)
                yPos += splitSkills.length * 5 + 10
            }

            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage()
                yPos = 20
            }

            // Weaknesses Section
            if (resume.weaknesses && resume.weaknesses.length > 0) {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(220, 38, 38) // red-600
                doc.text('Areas for Improvement', 20, yPos)
                yPos += 8

                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(textColor[0], textColor[1], textColor[2])
                resume.weaknesses.forEach((weakness, idx) => {
                    if (yPos > 270) {
                        doc.addPage()
                        yPos = 20
                    }
                    const lines = doc.splitTextToSize((idx + 1) + '. ' + weakness, 170)
                    doc.text(lines, 20, yPos)
                    yPos += lines.length * 5 + 3
                })
                yPos += 5
            }

            // Check if we need a new page
            if (yPos > 250) {
                doc.addPage()
                yPos = 20
            }

            // Recommendations Section
            if (resume.recommendations && resume.recommendations.length > 0) {
                doc.setFontSize(14)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
                doc.text('AI Recommendations & Tips', 20, yPos)
                yPos += 8

                doc.setFontSize(10)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(textColor[0], textColor[1], textColor[2])
                resume.recommendations.forEach((rec, idx) => {
                    if (yPos > 270) {
                        doc.addPage()
                        yPos = 20
                    }
                    const tipHeader = 'Tip #' + (idx + 1) + ':'
                    doc.setFont('helvetica', 'bold')
                    doc.text(tipHeader, 20, yPos)
                    yPos += 5

                    doc.setFont('helvetica', 'normal')
                    const lines = doc.splitTextToSize('* ' + rec, 170)
                    doc.text(lines, 20, yPos)
                    yPos += lines.length * 5 + 5
                })
            }

            // Footer on last page
            const pageCount = doc.getNumberOfPages()
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i)
                doc.setFontSize(8)
                doc.setTextColor(150, 150, 150)
                doc.text(
                    'Generated by HireReady - Page ' + i + ' of ' + pageCount,
                    105,
                    290,
                    { align: 'center' }
                )
            }

            // Save the PDF
            const fileName = resume.fileName.replace(/\.[^/.]+$/, '')
            const date = new Date().toISOString().split('T')[0]
            doc.save('HireReady-Report-' + fileName + '-' + date + '.pdf')
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div
                className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[280px]'
                    }`}
            >
                <div className="p-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <BarChart3 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">
                                    Resume <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Analytics</span>
                                </h1>
                                <p className="text-gray-600">View your past resume analysis reports</p>
                            </div>
                        </div>
                    </motion.div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="text-lg text-gray-600">Loading resume history...</div>
                        </div>
                    ) : resumes.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card variant="purple" className="p-12 text-center">
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-10 h-10 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No Resume Analysis Yet</h3>
                                <p className="text-gray-600 mb-6">Upload and analyze your first resume to see reports here</p>
                                <button
                                    onClick={() => window.location.href = '/resume'}
                                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                                >
                                    Analyze Resume
                                </button>
                            </Card>
                        </motion.div>
                    ) : (
                        <>
                            {/* Resume List */}
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {resumes.map((resume, idx) => (
                                    <motion.div
                                        key={resume.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => setSelectedResume(resume)}
                                        className="cursor-pointer"
                                    >
                                        <Card
                                            variant="purple"
                                            className={`p-6 transition-all ${selectedResume?.id === resume.id ? 'ring-2 ring-purple-600' : ''
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="text-xs font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                                                    {resume.fileType}
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-gray-900 mb-2 truncate">{resume.fileName}</h3>

                                            <div className="flex items-center text-sm text-gray-600 mb-4">
                                                <Calendar className="w-4 h-4 mr-1" />
                                                {formatDate(resume.analyzedAt)}
                                            </div>

                                            <div className="mb-3">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm text-gray-600">ATS Score</span>
                                                    <span className="text-lg font-bold text-purple-600">{resume.atsScore?.toFixed(0)}%</span>
                                                </div>
                                                <ProgressBar value={resume.atsScore || 0} showLabel={false} />
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setSelectedResume(resume)
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center justify-center space-x-1"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="text-sm">View</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        downloadReport(resume)
                                                    }}
                                                    className="flex-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center justify-center space-x-1"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    <span className="text-sm">PDF</span>
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDelete(resume.id)
                                                    }}
                                                    disabled={deletingId === resume.id}
                                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                                                >
                                                    {deletingId === resume.id ? (
                                                        <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Selected Resume Details */}
                            {selectedResume && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Card variant="purple" className="p-8">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-2xl font-bold text-gray-900">Detailed Report</h2>
                                            <button
                                                onClick={() => downloadReport(selectedResume)}
                                                className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
                                            >
                                                <Download className="w-5 h-5" />
                                                <span>Download Report</span>
                                            </button>
                                        </div>

                                        {/* ATS Score Section */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                                                <Award className="w-5 h-5 mr-2 text-purple-600" />
                                                ATS Compatibility Score
                                            </h3>
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-3">
                                                        {selectedResume.atsScore?.toFixed(0)}%
                                                    </div>
                                                    <ProgressBar value={selectedResume.atsScore || 0} />
                                                </div>
                                                <div className="flex items-center">
                                                    <p className="text-gray-600">
                                                        {selectedResume.atsScore >= 80
                                                            ? "Excellent! Your resume is highly optimized for ATS systems."
                                                            : selectedResume.atsScore >= 60
                                                                ? "Good score! A few improvements can make it even better."
                                                                : "Your resume needs optimization to pass ATS screening."}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Skills Section */}
                                        {selectedResume.skills && selectedResume.skills.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 mb-3">Skills Identified</h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {selectedResume.skills.map((skill, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                                                        >
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Weaknesses Section */}
                                        {selectedResume.weaknesses && selectedResume.weaknesses.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                                                    <TrendingUp className="w-5 h-5 mr-2 text-orange-600" />
                                                    Areas for Improvement
                                                </h3>
                                                <ul className="space-y-2">
                                                    {selectedResume.weaknesses.map((weakness, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="text-orange-600 mt-1">•</span>
                                                            <span className="text-gray-700">{weakness}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendations Section */}
                                        {selectedResume.recommendations && selectedResume.recommendations.length > 0 && (
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 mb-3">AI Recommendations</h3>
                                                <ul className="space-y-2">
                                                    {selectedResume.recommendations.map((rec, idx) => (
                                                        <li key={idx} className="flex items-start space-x-2">
                                                            <span className="text-purple-600 mt-1">✓</span>
                                                            <span className="text-gray-700">{rec}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </Card>
                                </motion.div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
