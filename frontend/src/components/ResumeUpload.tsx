import { useState, useCallback } from 'react'
import { Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

interface ResumeUploadProps {
    company: string
    position: string
    roundType: string
    onNext: () => void
    onBack: () => void
}

export default function ResumeUpload({ company, position, roundType, onNext, onBack }: ResumeUploadProps) {
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [analyzing, setAnalyzing] = useState(false)
    const [error, setError] = useState('')
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0])
        }
    }

    const handleFile = (selectedFile: File) => {
        // Validate file type
        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if (!validTypes.includes(selectedFile.type)) {
            setError('Please upload a PDF or Word document')
            return
        }

        // Validate file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB')
            return
        }

        setFile(selectedFile)
        setError('')
    }

    const handleUploadAndAnalyze = async () => {
        if (!file) return

        setUploading(true)
        setError('')

        try {
            const userId = localStorage.getItem('userId')
            if (!userId) {
                throw new Error('User not authenticated')
            }

            // Upload resume
            const formData = new FormData()
            formData.append('file', file)
            formData.append('userId', userId)

            const uploadResponse = await axios.post('http://localhost:8080/api/resume/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            const resumeId = uploadResponse.data.data.id
            setUploading(false)
            setAnalyzing(true)

            // Analyze resume
            const analyzeResponse = await axios.post(`http://localhost:8080/api/resume/analyze/${resumeId}`)
            const resumeText = analyzeResponse.data.data.extractedText || ''

            setAnalyzing(false)

            // Proceed to next step
            onNext()

        } catch (err: any) {
            setUploading(false)
            setAnalyzing(false)
            setError(err.response?.data?.message || 'Failed to upload and analyze resume')
            console.error('Resume upload error:', err)
        }
    }

    const handleSkip = () => {
        onNext()
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Resume (Optional)</h2>
                <p className="text-gray-600">Upload your resume for personalized interview questions</p>
                <div className="mt-2 text-sm text-purple-600">
                    {company} • {position} • {roundType}
                </div>
            </div>

            {/* Upload Area */}
            <div
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${dragActive
                    ? 'border-purple-500 bg-purple-50'
                    : file
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50 hover:border-purple-400'
                    }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    id="resume-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileInput}
                    disabled={uploading || analyzing}
                />

                {!file ? (
                    <label htmlFor="resume-upload" className="cursor-pointer">
                        <div className="flex flex-col items-center text-center">
                            <Upload className="w-12 h-12 text-purple-500 mb-4" />
                            <p className="text-lg font-semibold text-gray-700 mb-2">
                                Drop your resume here or click to browse
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports PDF, DOC, DOCX (Max 5MB)
                            </p>
                        </div>
                    </label>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-10 h-10 text-green-600" />
                            <div>
                                <p className="font-semibold text-gray-900">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>
                        {!uploading && !analyzing && (
                            <button
                                onClick={() => setFile(null)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-red-600" />
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                >
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-red-700">{error}</p>
                </motion.div>
            )}

            {/* Upload Status */}
            {(uploading || analyzing) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
                >
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-blue-700 font-medium">
                        {uploading ? 'Uploading resume...' : 'Analyzing resume with AI...'}
                    </p>
                </motion.div>
            )}

            {/* Info Box */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div className="text-sm text-purple-900">
                        <p className="font-semibold mb-1">Why upload your resume?</p>
                        <ul className="list-disc list-inside space-y-1 text-purple-800">
                            <li>Get personalized questions based on your experience</li>
                            <li>AI will ask about projects and skills mentioned in your resume</li>
                            <li>More realistic interview simulation</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
                <button
                    onClick={onBack}
                    disabled={uploading || analyzing}
                    className="flex-1 px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Back
                </button>

                {file ? (
                    <button
                        onClick={handleUploadAndAnalyze}
                        disabled={uploading || analyzing}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Upload & Continue'}
                    </button>
                ) : (
                    <button
                        onClick={handleSkip}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        Skip & Continue
                    </button>
                )}
            </div>
        </div>
    )
}
