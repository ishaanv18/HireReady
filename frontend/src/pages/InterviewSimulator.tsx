import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CheckCircle2, ArrowLeft, List } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Card from '../components/Card'
import CompanyRoleSearch from '../components/CompanyRoleSearch'
import JobConfiguration from '../components/JobConfiguration'
import ResumeUpload from '../components/ResumeUpload'
import TimeSlotPicker from '../components/TimeSlotPicker'
import ScheduledInterviewsList from '../components/ScheduledInterviewsList'
import InterviewAnalytics from '../components/InterviewAnalytics'
import { interviewAPI } from '../services/api'
import { useToast } from '../components/ToastNotification'

export default function InterviewSimulator() {
    const toast = useToast()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [activeTab, setActiveTab] = useState<'schedule' | 'view' | 'analytics'>('view') // Default to view tab
    const [currentStep, setCurrentStep] = useState(1)
    const [isScheduling, setIsScheduling] = useState(false)
    const [scheduledInterview, setScheduledInterview] = useState<any>(null)

    // Form data
    const [company, setCompany] = useState('')
    const [role, setRole] = useState('')
    const [position, setPosition] = useState('')
    const [roundType, setRoundType] = useState('')
    const [difficulty, setDifficulty] = useState('')

    const handleStep1Next = (selectedCompany: string, selectedRole: string) => {
        setCompany(selectedCompany)
        setRole(selectedRole)
        setCurrentStep(2)
    }

    const handleStep2Next = (selectedPosition: string, selectedRoundType: string, selectedDifficulty: string) => {
        setPosition(selectedPosition)
        setRoundType(selectedRoundType)
        setDifficulty(selectedDifficulty)
        setCurrentStep(3)
    }

    const handleStep3Next = () => {
        setCurrentStep(4)
    }

    const handleSchedule = async (scheduledTime: Date) => {
        setIsScheduling(true)
        toast.info('Scheduling your interview...')

        try {
            const userId = localStorage.getItem('userId')
            if (!userId) {
                toast.error('Please log in first')
                return
            }

            // Format as local datetime without timezone conversion
            const year = scheduledTime.getFullYear()
            const month = String(scheduledTime.getMonth() + 1).padStart(2, '0')
            const day = String(scheduledTime.getDate()).padStart(2, '0')
            const hours = String(scheduledTime.getHours()).padStart(2, '0')
            const minutes = String(scheduledTime.getMinutes()).padStart(2, '0')
            const seconds = '00'
            const localDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

            const response = await interviewAPI.scheduleInterview({
                userId,
                company,
                role,
                position,
                roundType,
                difficulty,
                scheduledTime: localDateTime
            })

            setScheduledInterview(response.data.data)
            setCurrentStep(5)
            toast.success(`Interview scheduled successfully for ${company}! 🎯`)
        } catch (error: any) {
            console.error('Failed to schedule interview:', error)
            const errorMsg = error.response?.data?.message || 'Failed to schedule interview'
            toast.error(errorMsg)
        } finally {
            setIsScheduling(false)
        }
    }

    const handleStartOver = () => {
        setCurrentStep(1)
        setCompany('')
        setRole('')
        setPosition('')
        setRoundType('')
        setDifficulty('')
        setScheduledInterview(null)
    }

    const steps = [
        { number: 1, title: 'Company & Role' },
        { number: 2, title: 'Job Configuration' },
        { number: 3, title: 'Schedule Time' },
        { number: 4, title: 'Confirmation' }
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

            <div className={`flex-1 transition-all duration-300 ${isCollapsed ? 'ml-20' : 'ml-[280px]'}`}>
                <div className="p-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex items-center space-x-3 mb-4">
                            <motion.div
                                animate={{ rotate: [0, 5, 0, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                className="w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl"
                            >
                                <Calendar className="w-7 h-7 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-900 bg-clip-text text-transparent">
                                    Interview <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Scheduler</span>
                                </h1>
                                <p className="text-gray-700 font-medium">Schedule and prepare for your interview with confidence</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Tab Navigation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-8"
                    >
                        <div className="flex space-x-4 border-b-2 border-gray-200">
                            <button
                                onClick={() => setActiveTab('view')}
                                className={`px-6 py-3 font-semibold transition-all rounded-t-xl ${activeTab === 'view'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                <List className="inline w-5 h-5 mr-2" />
                                My Interviews
                            </button>
                            <button
                                onClick={() => setActiveTab('schedule')}
                                className={`px-6 py-3 font-semibold transition-all rounded-t-xl ${activeTab === 'schedule'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                <Calendar className="inline w-5 h-5 mr-2" />
                                Schedule New
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`px-6 py-3 font-semibold transition-all rounded-t-xl ${activeTab === 'analytics'
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg transform scale-105'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                                    }`}
                            >
                                <CheckCircle2 className="inline w-5 h-5 mr-2" />
                                Analytics
                            </button>
                        </div>
                    </motion.div>

                    {activeTab === 'view' ? (
                        <ScheduledInterviewsList />
                    ) : activeTab === 'analytics' ? (
                        <InterviewAnalytics />
                    ) : (
                        <>
                            {/* Progress Steps */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mb-8"
                            >
                                <div className="flex items-center justify-between max-w-3xl mx-auto">
                                    {steps.map((step, idx) => (
                                        <div key={step.number} className="flex items-center flex-1">
                                            <div className="flex flex-col items-center flex-1">
                                                <div
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all transform ${currentStep >= step.number
                                                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 shadow-lg'
                                                        : 'bg-gray-200 text-gray-500 hover:scale-105'
                                                        }`}
                                                >
                                                    {currentStep > step.number ? (
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    ) : (
                                                        step.number
                                                    )}
                                                </div>
                                                <div className={`mt-2 text-xs font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
                                                    {step.title}
                                                </div>
                                            </div>
                                            {idx < steps.length - 1 && (
                                                <div className={`h-1 flex-1 mx-2 rounded transition-all ${currentStep > step.number ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-200'}`} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Wizard Content */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="max-w-3xl mx-auto"
                            >
                                <Card variant="purple" className="p-8">
                                    <AnimatePresence mode="wait">
                                        {currentStep === 1 && (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                            >
                                                <CompanyRoleSearch onNext={handleStep1Next} />
                                            </motion.div>
                                        )}

                                        {currentStep === 2 && (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                            >
                                                <JobConfiguration
                                                    company={company}
                                                    role={role}
                                                    onNext={handleStep2Next}
                                                    onBack={() => setCurrentStep(1)}
                                                />
                                            </motion.div>
                                        )}

                                        {currentStep === 3 && (
                                            <motion.div
                                                key="step3"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                            >
                                                <ResumeUpload
                                                    company={company}
                                                    position={position}
                                                    roundType={roundType}
                                                    onNext={handleStep3Next}
                                                    onBack={() => setCurrentStep(2)}
                                                />
                                            </motion.div>
                                        )}

                                        {currentStep === 4 && (
                                            <motion.div
                                                key="step4"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                            >
                                                <TimeSlotPicker
                                                    company={company}
                                                    position={position}
                                                    roundType={roundType}
                                                    difficulty={difficulty}
                                                    onSchedule={handleSchedule}
                                                    onBack={() => setCurrentStep(3)}
                                                />
                                            </motion.div>
                                        )}

                                        {currentStep === 5 && scheduledInterview && (
                                            <motion.div
                                                key="step4"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="text-center py-8"
                                            >
                                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                                </div>
                                                <h2 className="text-3xl font-bold text-gray-900 mb-3">Interview Scheduled!</h2>
                                                <p className="text-gray-600 mb-6">Your interview has been successfully scheduled</p>

                                                <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-6 mb-6 text-left shadow-lg">
                                                    <div className="space-y-2 text-sm">
                                                        <p><strong>Company:</strong> {company}</p>
                                                        <p><strong>Position:</strong> {position}</p>
                                                        <p><strong>Round Type:</strong> {roundType}</p>
                                                        <p><strong>Difficulty:</strong> {difficulty}</p>
                                                        <p><strong>Scheduled Time:</strong> {new Date(scheduledInterview.scheduledTime).toLocaleString()}</p>
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-4 mb-6 shadow-md">
                                                    <p className="text-sm text-yellow-900 font-medium">
                                                        <strong>⚠️ Important:</strong> You can only start this interview at the scheduled time. Please be ready 5 minutes before.
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={handleStartOver}
                                                    className="px-8 py-3 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                                                >
                                                    <ArrowLeft className="inline w-5 h-5 mr-2" />
                                                    Schedule Another Interview
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {isScheduling && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                                            <div className="text-center">
                                                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                                                <p className="text-gray-600">Scheduling your interview...</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

