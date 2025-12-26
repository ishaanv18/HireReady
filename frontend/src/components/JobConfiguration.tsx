import { useState, useEffect } from 'react'
import { Briefcase, Target, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

interface JobConfigurationProps {
    company: string
    role: string
    onNext: (position: string, roundType: string, difficulty: string) => void
    onBack: () => void
}

const ROUND_TYPES = [
    { value: 'HR', label: 'HR Round', icon: '👥', color: 'from-blue-500 to-blue-600' },
    { value: 'CODING', label: 'Coding', icon: '💻', color: 'from-green-500 to-green-600' },
    { value: 'COMMUNICATION', label: 'Communication', icon: '💬', color: 'from-purple-500 to-purple-600' },
    { value: 'PROBLEM_SOLVING', label: 'Problem Solving', icon: '🧩', color: 'from-orange-500 to-orange-600' },
    { value: 'APTITUDE', label: 'Aptitude', icon: '🎯', color: 'from-pink-500 to-pink-600' }
]

const DIFFICULTY_LEVELS = [
    { value: 'EASY', label: 'Easy', color: 'bg-green-100 text-green-700 border-green-300' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 'HARD', label: 'Hard', color: 'bg-red-100 text-red-700 border-red-300' }
]

export default function JobConfiguration({ company, role, onNext, onBack }: JobConfigurationProps) {
    const [position, setPosition] = useState('')
    const [positionSuggestions, setPositionSuggestions] = useState<string[]>([])
    const [showPositionSuggestions, setShowPositionSuggestions] = useState(false)
    const [roundType, setRoundType] = useState('')
    const [difficulty, setDifficulty] = useState('')

    // Static position list based on role
    const ALL_POSITIONS = [
        'Junior Software Engineer', 'Senior Software Engineer', 'Staff Software Engineer', 'Principal Engineer',
        'Junior Data Scientist', 'Senior Data Scientist', 'Lead Data Scientist', 'Principal Data Scientist',
        'Associate Product Manager', 'Product Manager', 'Senior Product Manager', 'Director of Product',
        'Junior DevOps Engineer', 'DevOps Engineer', 'Senior DevOps Engineer', 'DevOps Architect',
        'QA Engineer', 'Senior QA Engineer', 'QA Lead', 'QA Manager',
        'UI Designer', 'UX Designer', 'UI/UX Designer', 'Senior UI/UX Designer', 'Lead Designer',
        'Junior Frontend Developer', 'Frontend Developer', 'Senior Frontend Developer', 'Lead Frontend Developer',
        'Junior Backend Developer', 'Backend Developer', 'Senior Backend Developer', 'Lead Backend Developer',
        'Full Stack Developer', 'Senior Full Stack Developer', 'Lead Full Stack Developer',
        'iOS Developer', 'Android Developer', 'React Native Developer', 'Flutter Developer',
        'Cloud Engineer', 'Cloud Architect', 'Solutions Architect', 'Enterprise Architect',
        'Security Analyst', 'Security Engineer', 'Senior Security Engineer', 'Security Architect',
        'ML Engineer', 'Senior ML Engineer', 'ML Researcher', 'AI Engineer',
        'Data Engineer', 'Senior Data Engineer', 'Data Architect', 'Big Data Engineer',
        'Business Analyst', 'Senior Business Analyst', 'Lead Business Analyst',
        'Project Manager', 'Senior Project Manager', 'Program Manager', 'Portfolio Manager',
        'Scrum Master', 'Agile Coach', 'Release Manager',
        'Technical Writer', 'Senior Technical Writer', 'Documentation Lead',
        'SRE', 'Senior SRE', 'SRE Lead', 'Infrastructure Engineer',
        'Database Administrator', 'Senior DBA', 'Database Architect',
        'Network Engineer', 'Senior Network Engineer', 'Network Architect',
        'Systems Administrator', 'Senior Systems Administrator', 'Systems Engineer',
        'IT Support Specialist', 'IT Support Manager', 'Help Desk Manager'
    ]

    // Filter positions based on input
    useEffect(() => {
        if (position.length >= 0) {
            const filtered = position.length === 0
                ? ALL_POSITIONS // Show all positions when empty
                : ALL_POSITIONS.filter(p =>
                    p.toLowerCase().includes(position.toLowerCase())
                ) // Show matching positions
            setPositionSuggestions(filtered)
        }
    }, [position, role, company])

    const handleNext = () => {
        if (position && roundType && difficulty) {
            onNext(position, roundType, difficulty)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Job Configuration</h2>
                <p className="text-gray-600">Configure your interview details</p>
                <div className="mt-2 text-sm text-purple-600">
                    {company} • {role}
                </div>
            </div>

            {/* Position Selection */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Briefcase className="inline w-4 h-4 mr-1" />
                    Job Position *
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        onFocus={() => setShowPositionSuggestions(true)}
                        placeholder="e.g., Senior Software Engineer, Junior Data Analyst..."
                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none"
                    />
                </div>

                {/* Position Suggestions */}
                {showPositionSuggestions && positionSuggestions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute z-10 w-full mt-2 bg-white border-2 border-purple-200 rounded-xl shadow-lg max-h-60 overflow-y-auto"
                    >
                        {positionSuggestions.map((suggestion, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setPosition(suggestion)
                                    setShowPositionSuggestions(false)
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </motion.div>
                )}
            </div>

            {/* Round Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Target className="inline w-4 h-4 mr-1" />
                    Round Type *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ROUND_TYPES.map((round) => (
                        <button
                            key={round.value}
                            onClick={() => setRoundType(round.value)}
                            className={`p-4 rounded-xl border-2 transition-all ${roundType === round.value
                                ? 'border-purple-600 bg-purple-50 scale-105'
                                : 'border-gray-200 hover:border-purple-300'
                                }`}
                        >
                            <div className="text-3xl mb-2">{round.icon}</div>
                            <div className="font-semibold text-sm">{round.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Difficulty Level Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Zap className="inline w-4 h-4 mr-1" />
                    Difficulty Level *
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTY_LEVELS.map((level) => (
                        <button
                            key={level.value}
                            onClick={() => setDifficulty(level.value)}
                            className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${difficulty === level.value
                                ? `${level.color} scale-105`
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            {level.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex space-x-3">
                <button
                    onClick={onBack}
                    className="flex-1 px-6 py-4 border-2 border-purple-600 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-all"
                >
                    Back
                </button>
                <button
                    onClick={handleNext}
                    disabled={!position || !roundType || !difficulty}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    Next: Schedule Time
                </button>
            </div>
        </div>
    )
}
