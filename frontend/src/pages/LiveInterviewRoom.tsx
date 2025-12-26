import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, Video, Phone, Clock, MessageSquare, AlertCircle } from 'lucide-react'
import { interviewAPI } from '../services/api'

interface InterviewState {
    status: 'countdown' | 'active' | 'thinking' | 'listening' | 'processing' | 'completed'
    currentQuestion: string
    questionNumber: number
    totalQuestions: number
    transcript: Array<{ type: 'ai' | 'user', text: string, timestamp: Date }>
    sessionId: string | null
    timeElapsed: number
}

export default function LiveInterviewRoom() {
    const navigate = useNavigate()
    const location = useLocation()
    const schedule = location.state?.schedule

    const [state, setState] = useState<InterviewState>({
        status: 'countdown',
        currentQuestion: '',
        questionNumber: 0,
        totalQuestions: 10,
        transcript: [],
        sessionId: null,
        timeElapsed: 0
    })

    const [countdown, setCountdown] = useState(10)
    const [thinkingTimer, setThinkingTimer] = useState(15)
    const [isRecording, setIsRecording] = useState(false)
    const [userAnswer, setUserAnswer] = useState('')
    const [isMuted, setIsMuted] = useState(false)

    const recognitionRef = useRef<any>(null)
    const timerRef = useRef<any>(null)

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
            recognitionRef.current = new SpeechRecognition()
            recognitionRef.current.continuous = true
            recognitionRef.current.interimResults = true
            recognitionRef.current.lang = 'en-US'

            recognitionRef.current.onresult = (event: any) => {
                const transcript = Array.from(event.results)
                    .map((result: any) => result[0].transcript)
                    .join('')
                setUserAnswer(transcript)
            }

            recognitionRef.current.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error)
                setIsRecording(false)
            }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop()
            }
        }
    }, [])

    // Countdown timer
    useEffect(() => {
        if (state.status === 'countdown' && countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
            return () => clearTimeout(timer)
        } else if (state.status === 'countdown' && countdown === 0) {
            startInterview()
        }
    }, [countdown, state.status])

    // Interview timer
    useEffect(() => {
        if (state.status === 'active' || state.status === 'thinking' || state.status === 'listening') {
            timerRef.current = setInterval(() => {
                setState(prev => ({ ...prev, timeElapsed: prev.timeElapsed + 1 }))
            }, 1000)
        }
        return () => clearInterval(timerRef.current)
    }, [state.status])

    // Thinking timer
    useEffect(() => {
        if (state.status === 'thinking' && thinkingTimer > 0) {
            const timer = setTimeout(() => setThinkingTimer(thinkingTimer - 1), 1000)
            return () => clearTimeout(timer)
        } else if (state.status === 'thinking' && thinkingTimer === 0) {
            startListening()
        }
    }, [thinkingTimer, state.status])

    const startInterview = async () => {
        try {
            const scheduleId = schedule?.id
            if (!scheduleId) {
                console.error('No schedule ID available')
                return
            }

            const response = await interviewAPI.startLiveInterview(scheduleId)
            const session = response.data.data

            setState(prev => ({
                ...prev,
                status: 'active',
                sessionId: session.id,
                questionNumber: 1
            }))

            // Get first question
            getNextQuestion(session.id)
        } catch (error) {
            console.error('Failed to start interview:', error)
            alert('Failed to start interview. Please try again.')
        }
    }

    const getNextQuestion = async (sid: string, retryCount = 0) => {
        try {
            setState(prev => ({ ...prev, status: 'processing' }))

            // Get AI-generated question from backend
            const response = await interviewAPI.getNextQuestion(sid, userAnswer)
            const question = response.data.data

            speakQuestion(question)

            setState(prev => ({
                ...prev,
                status: 'thinking',
                currentQuestion: question,
                transcript: [...prev.transcript, { type: 'ai', text: question, timestamp: new Date() }]
            }))
            setThinkingTimer(15)
            setUserAnswer('') // Clear previous answer
        } catch (error) {
            console.error('Failed to get AI question:', error)

            // Retry up to 3 times before showing error
            if (retryCount < 3) {
                console.log(`Retrying question generation (attempt ${retryCount + 1}/3)...`)
                setTimeout(() => getNextQuestion(sid, retryCount + 1), 2000)
            } else {
                // After 3 failed attempts, show error and end interview
                alert('Failed to generate interview question. Please check your connection and try again.')
                endInterview()
            }
        }
    }

    const speakQuestion = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text)
            utterance.rate = 0.9
            utterance.pitch = 1.0
            utterance.volume = isMuted ? 0 : 1
            window.speechSynthesis.speak(utterance)
        }
    }

    const startListening = () => {
        if (recognitionRef.current && !isRecording) {
            setUserAnswer('')
            recognitionRef.current.start()
            setIsRecording(true)
            setState(prev => ({ ...prev, status: 'listening' }))
        }
    }

    const stopListening = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop()
            setIsRecording(false)
            submitAnswer()
        }
    }

    const submitAnswer = async () => {
        if (!userAnswer.trim()) return

        setState(prev => ({
            ...prev,
            transcript: [...prev.transcript, { type: 'user', text: userAnswer, timestamp: new Date() }]
        }))

        // Check if interview should continue
        if (state.questionNumber >= state.totalQuestions || state.timeElapsed >= 600) {
            endInterview()
        } else {
            setState(prev => ({ ...prev, questionNumber: prev.questionNumber + 1 }))
            getNextQuestion(state.sessionId!)
        }
    }

    const endInterview = async () => {
        setState(prev => ({ ...prev, status: 'completed' }))

        try {
            if (state.sessionId) {
                // End interview and get evaluation
                await interviewAPI.endInterview(state.sessionId)
            }
            // Navigate to report after 3 seconds
            setTimeout(() => {
                navigate('/interview-report', { state: { sessionId: state.sessionId, schedule } })
            }, 3000)
        } catch (error) {
            console.error('Failed to end interview:', error)
            // Still navigate to report even if API fails
            setTimeout(() => {
                navigate('/interview-report', { state: { sessionId: state.sessionId, schedule } })
            }, 3000)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (!schedule) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <AlertCircle className="w-16 h-16 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Interview Scheduled</h2>
                    <button
                        onClick={() => navigate('/interview-simulator')}
                        className="mt-4 px-6 py-3 bg-white text-purple-900 rounded-xl font-semibold"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
            <AnimatePresence mode="wait">
                {/* Countdown Screen */}
                {state.status === 'countdown' && (
                    <motion.div
                        key="countdown"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center min-h-screen"
                    >
                        <div className="text-center text-white">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="text-9xl font-bold mb-8"
                            >
                                {countdown}
                            </motion.div>
                            <h2 className="text-3xl font-bold mb-4">Interview Starting Soon</h2>
                            <p className="text-xl text-purple-200">Get ready! Take a deep breath.</p>
                            <div className="mt-8 space-y-2 text-purple-200">
                                <p>✓ Speak clearly and confidently</p>
                                <p>✓ Take your time to think</p>
                                <p>✓ Be yourself</p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Interview Screen */}
                {(state.status === 'active' || state.status === 'thinking' || state.status === 'listening' || state.status === 'processing') && (
                    <motion.div
                        key="interview"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="max-w-7xl mx-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2 flex items-center space-x-2">
                                    <Clock className="w-5 h-5 text-white" />
                                    <span className="text-white font-semibold">{formatTime(state.timeElapsed)}</span>
                                </div>
                                <div className="bg-white/10 backdrop-blur-lg rounded-xl px-4 py-2">
                                    <span className="text-white font-semibold">
                                        Question {state.questionNumber}/{state.totalQuestions}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={endInterview}
                                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all"
                            >
                                <Phone className="w-5 h-5" />
                                <span>End Interview</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Video Area */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* AI Avatar */}
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 aspect-video flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20" />
                                    <motion.div
                                        animate={{
                                            scale: state.status === 'listening' ? [1, 1.1, 1] : 1,
                                        }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="relative z-10"
                                    >
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                                            <MessageSquare className="w-16 h-16 text-white" />
                                        </div>
                                    </motion.div>
                                    {state.status === 'listening' && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="absolute bottom-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full flex items-center space-x-2"
                                        >
                                            <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                                            <span>Listening...</span>
                                        </motion.div>
                                    )}
                                </div>

                                {/* Current Question */}
                                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
                                    <h3 className="text-purple-200 text-sm font-semibold mb-2">Current Question:</h3>
                                    <p className="text-white text-xl font-medium">{state.currentQuestion}</p>

                                    {state.status === 'thinking' && (
                                        <div className="mt-4 flex items-center space-x-3">
                                            <Clock className="w-5 h-5 text-yellow-400" />
                                            <span className="text-yellow-400 font-semibold">
                                                Think time: {thinkingTimer}s
                                            </span>
                                        </div>
                                    )}

                                    {state.status === 'listening' && userAnswer && (
                                        <div className="mt-4 p-4 bg-white/10 rounded-xl">
                                            <p className="text-green-400 text-sm mb-1">Your answer:</p>
                                            <p className="text-white">{userAnswer}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center space-x-4">
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className="bg-white/20 hover:bg-white/30 backdrop-blur-lg text-white p-4 rounded-full transition-all"
                                    >
                                        <Video className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={isRecording ? stopListening : startListening}
                                        disabled={state.status !== 'listening' && state.status !== 'thinking'}
                                        className={`p-6 rounded-full transition-all ${isRecording
                                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                            : 'bg-green-500 hover:bg-green-600'
                                            } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                                    </button>
                                    {state.status === 'listening' && (
                                        <button
                                            onClick={stopListening}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold"
                                        >
                                            Submit Answer
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Transcript Sidebar */}
                            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-h-[600px] overflow-y-auto">
                                <h3 className="text-white text-lg font-bold mb-4 flex items-center space-x-2">
                                    <MessageSquare className="w-5 h-5" />
                                    <span>Transcript</span>
                                </h3>
                                <div className="space-y-4">
                                    {state.transcript.map((entry, idx) => (
                                        <div
                                            key={idx}
                                            className={`p-3 rounded-xl ${entry.type === 'ai'
                                                ? 'bg-purple-500/20 border-l-4 border-purple-400'
                                                : 'bg-blue-500/20 border-l-4 border-blue-400'
                                                }`}
                                        >
                                            <p className="text-xs text-purple-200 mb-1">
                                                {entry.type === 'ai' ? 'AI Interviewer' : 'You'} •{' '}
                                                {entry.timestamp.toLocaleTimeString()}
                                            </p>
                                            <p className="text-white text-sm">{entry.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Completion Screen */}
                {state.status === 'completed' && (
                    <motion.div
                        key="completed"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center justify-center min-h-screen"
                    >
                        <div className="text-center text-white">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                className="w-24 h-24 border-8 border-white border-t-transparent rounded-full mx-auto mb-8"
                            />
                            <h2 className="text-4xl font-bold mb-4">Interview Completed!</h2>
                            <p className="text-xl text-purple-200">Generating your evaluation report...</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
