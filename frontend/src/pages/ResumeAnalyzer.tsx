import { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Sparkles, CheckCircle, TrendingUp, AlertCircle, Loader } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import Card from '../components/Card'
import FileUpload from '../components/FileUpload'
import ProgressBar from '../components/ProgressBar'
import { resumeAPI } from '../services/api'
import { useToast } from '../components/ToastNotification'

export default function ResumeAnalyzer() {
    const toast = useToast()
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const [error, setError] = useState<string>('')
    const [experienceLevel, setExperienceLevel] = useState<string>('Entry Level (0-2 years)')
    const [targetRole, setTargetRole] = useState<string>('')

    const handleFileSelect = (file: File) => {
        setSelectedFile(file)
        setError('')
        setAnalysisResult(null)
        toast.success(`Resume "${file.name}" selected successfully!`)
    }

    const handleAnalyze = async () => {
        if (!selectedFile) return

        setIsAnalyzing(true)
        setError('')
        toast.info('Analyzing your resume... This may take a moment.')

        try {
            const userId = localStorage.getItem('userId')
            if (!userId) {
                setError('Please complete registration first')
                toast.error('Please complete registration first')
                setIsAnalyzing(false)
                return
            }

            const formData = new FormData()
            formData.append('file', selectedFile)
            formData.append('userId', userId)
            formData.append('experienceLevel', experienceLevel)
            if (targetRole) {
                formData.append('targetRole', targetRole)
            }

            const response = await resumeAPI.analyze(formData)
            setAnalysisResult(response.data.data)
            toast.success(`Analysis complete! Your ATS score: ${response.data.data.atsScore?.toFixed(0)}%`)
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to analyze resume. Please try again.'
            setError(errorMsg)
            toast.error(errorMsg)
        } finally {
            setIsAnalyzing(false)
        }
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
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gray-900">
                                    Resume <span className="bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">Analyzer</span>
                                </h1>
                                <p className="text-gray-600">Get AI-powered insights to optimize your resume</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Upload Section */}
                    {!analysisResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="mb-8"
                        >
                            <Card variant="purple" className="p-8">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Resume</h2>

                                {/* Experience Level Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Experience Level *
                                    </label>
                                    <select
                                        value={experienceLevel}
                                        onChange={(e) => setExperienceLevel(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white"
                                    >
                                        <option value="Internship">Internship</option>
                                        <option value="Entry Level (0-2 years)">Entry Level (0-2 years)</option>
                                        <option value="Mid Level (2-5 years)">Mid Level (2-5 years)</option>
                                        <option value="Senior Level (5+ years)">Senior Level (5+ years)</option>
                                    </select>
                                </div>

                                {/* Target Role Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Target Role (Optional)
                                    </label>
                                    <select
                                        value={targetRole}
                                        onChange={(e) => setTargetRole(e.target.value)}
                                        className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white"
                                    >
                                        <option value="">Select a role (optional)</option>
                                        <optgroup label="Frontend Development">
                                            <option value="Frontend Developer">Frontend Developer</option>
                                            <option value="React Developer">React Developer</option>
                                            <option value="Angular Developer">Angular Developer</option>
                                            <option value="Vue.js Developer">Vue.js Developer</option>
                                            <option value="UI/UX Developer">UI/UX Developer</option>
                                        </optgroup>
                                        <optgroup label="Backend Development">
                                            <option value="Backend Developer">Backend Developer</option>
                                            <option value="Node.js Developer">Node.js Developer</option>
                                            <option value="Java Developer">Java Developer</option>
                                            <option value="Python Developer">Python Developer</option>
                                            <option value=".NET Developer">.NET Developer</option>
                                            <option value="PHP Developer">PHP Developer</option>
                                        </optgroup>
                                        <optgroup label="Full Stack">
                                            <option value="Full Stack Developer">Full Stack Developer</option>
                                            <option value="MERN Stack Developer">MERN Stack Developer</option>
                                            <option value="MEAN Stack Developer">MEAN Stack Developer</option>
                                        </optgroup>
                                        <optgroup label="Mobile Development">
                                            <option value="Android Developer">Android Developer</option>
                                            <option value="iOS Developer">iOS Developer</option>
                                            <option value="React Native Developer">React Native Developer</option>
                                            <option value="Flutter Developer">Flutter Developer</option>
                                        </optgroup>
                                        <optgroup label="Data & AI">
                                            <option value="Data Scientist">Data Scientist</option>
                                            <option value="Data Analyst">Data Analyst</option>
                                            <option value="Machine Learning Engineer">Machine Learning Engineer</option>
                                            <option value="AI Engineer">AI Engineer</option>
                                            <option value="Data Engineer">Data Engineer</option>
                                        </optgroup>
                                        <optgroup label="DevOps & Cloud">
                                            <option value="DevOps Engineer">DevOps Engineer</option>
                                            <option value="Cloud Engineer">Cloud Engineer</option>
                                            <option value="AWS Developer">AWS Developer</option>
                                            <option value="Azure Developer">Azure Developer</option>
                                            <option value="Site Reliability Engineer">Site Reliability Engineer</option>
                                        </optgroup>
                                        <optgroup label="Other Tech Roles">
                                            <option value="Software Engineer">Software Engineer</option>
                                            <option value="QA Engineer">QA Engineer</option>
                                            <option value="Test Automation Engineer">Test Automation Engineer</option>
                                            <option value="Cybersecurity Analyst">Cybersecurity Analyst</option>
                                            <option value="Blockchain Developer">Blockchain Developer</option>
                                            <option value="Game Developer">Game Developer</option>
                                            <option value="Embedded Systems Engineer">Embedded Systems Engineer</option>
                                            <option value="Database Administrator">Database Administrator</option>
                                        </optgroup>
                                    </select>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Selecting a role helps provide more targeted recommendations
                                    </p>
                                </div>

                                <FileUpload onFileSelect={handleFileSelect} className="mb-6" />

                                {selectedFile && (
                                    <div className="flex justify-center">
                                        <button
                                            onClick={handleAnalyze}
                                            disabled={isAnalyzing}
                                            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader className="w-5 h-5 animate-spin" />
                                                    <span>Analyzing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-5 h-5" />
                                                    <span>Analyze Resume</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2"
                                    >
                                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-red-700">{error}</p>
                                    </motion.div>
                                )}
                            </Card>
                        </motion.div>
                    )}

                    {/* Analysis Results */}
                    {analysisResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {/* Analysis Info Banner */}
                            <Card variant="gradient" className="p-6 mb-6 text-white">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Analysis Parameters</h3>
                                        <div className="flex items-center space-x-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="opacity-90">Experience Level:</span>
                                                <span className="font-bold bg-white/20 px-3 py-1 rounded-full">{experienceLevel}</span>
                                            </div>
                                            {targetRole && (
                                                <div className="flex items-center space-x-2">
                                                    <span className="opacity-90">Target Role:</span>
                                                    <span className="font-bold bg-white/20 px-3 py-1 rounded-full">{targetRole}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setAnalysisResult(null)
                                            setSelectedFile(null)
                                        }}
                                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                    >
                                        Analyze Another
                                    </button>
                                </div>
                            </Card>

                            {/* ATS Score */}
                            <Card variant="purple" className="p-8 mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 mb-6">ATS Compatibility Score</h2>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent mb-4">
                                            {analysisResult.atsScore?.toFixed(0) || 0}%
                                        </div>
                                        <ProgressBar value={analysisResult.atsScore || 0} />
                                    </div>
                                    <div className="flex items-center">
                                        <p className="text-gray-600 leading-relaxed">
                                            {analysisResult.atsScore >= 80
                                                ? "Excellent! Your resume is highly optimized for ATS systems."
                                                : analysisResult.atsScore >= 60
                                                    ? "Good score! A few improvements can make it even better."
                                                    : "Your resume needs optimization to pass ATS screening."}
                                        </p>
                                    </div>
                                </div>
                            </Card>

                            {/* Strengths & Weaknesses */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                {/* Strengths */}
                                <Card variant="purple" className="p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Strengths</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysisResult.weaknesses?.slice(0, 5).map((strength: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2">
                                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700 text-sm">{strength}</span>
                                            </li>
                                        )) || (
                                                <li className="text-gray-500 text-sm">Strong resume structure and content</li>
                                            )}
                                    </ul>
                                </Card>

                                {/* Weaknesses */}
                                <Card variant="purple" className="p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                            <AlertCircle className="w-6 h-6 text-red-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Weaknesses</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {analysisResult.weaknesses?.map((weakness: string, idx: number) => (
                                            <li key={idx} className="flex items-start space-x-2">
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700 text-sm">{weakness}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </Card>
                            </div>

                            {/* Skills & Gaps */}
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <Card variant="purple" className="p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Skills Found</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.skills?.map((skill: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </Card>

                                <Card variant="purple" className="p-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">Skill Gaps</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisResult.skillGaps?.map((gap: string, idx: number) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                                            >
                                                {gap}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            </div>

                            {/* Recommendations & Tips */}
                            <Card variant="purple" className="p-6">
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <Sparkles className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">AI Recommendations & Tips</h3>
                                </div>
                                <div className="space-y-4">
                                    {analysisResult.recommendations?.map((rec: string, idx: number) => (
                                        <div key={idx} className="bg-purple-50 border-l-4 border-purple-600 p-4 rounded-r-lg">
                                            <div className="flex items-start space-x-3">
                                                <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-gray-800 font-medium mb-1">Tip #{idx + 1}</p>
                                                    <p className="text-gray-700">{rec}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {/* Features (shown when no analysis) */}
                    {!analysisResult && !isAnalyzing && (
                        <div className="grid md:grid-cols-3 gap-6">
                            {[
                                { icon: Sparkles, title: 'ATS Scoring', desc: 'Get a score from 0-100 on ATS compatibility', color: 'from-blue-500 to-purple-600' },
                                { icon: CheckCircle, title: 'Keyword Analysis', desc: 'Identify missing keywords for your target role', color: 'from-green-500 to-emerald-600' },
                                { icon: TrendingUp, title: 'Improvement Tips', desc: 'Receive actionable recommendations', color: 'from-orange-500 to-red-600' }
                            ].map((feature, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + idx * 0.1 }}
                                >
                                    <Card variant="purple" className="p-6 h-full">
                                        <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg`}>
                                            <feature.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                                        <p className="text-gray-600 text-sm">{feature.desc}</p>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
