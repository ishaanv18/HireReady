import { useState, useCallback } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { motion } from 'framer-motion'

interface FileUploadProps {
    onFileSelect: (file: File) => void
    acceptedTypes?: string[]
    maxSize?: number
    className?: string
}

const FileUpload = ({
    onFileSelect,
    acceptedTypes = ['.pdf', '.docx', '.doc', '.png', '.jpg', '.jpeg'],
    maxSize = 10 * 1024 * 1024, // 10MB
    className = ''
}: FileUploadProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [error, setError] = useState<string>('')

    const validateFile = (file: File): boolean => {
        setError('')

        // Check file size
        if (file.size > maxSize) {
            setError(`File size must be less than ${maxSize / (1024 * 1024)}MB`)
            return false
        }

        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!acceptedTypes.includes(fileExtension)) {
            setError(`File type must be one of: ${acceptedTypes.join(', ')}`)
            return false
        }

        return true
    }

    const handleFile = (file: File) => {
        if (validateFile(file)) {
            setSelectedFile(file)
            onFileSelect(file)
        }
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleFile(file)
        }
    }, [])

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }, [])

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            handleFile(file)
        }
    }

    const removeFile = () => {
        setSelectedFile(null)
        setError('')
    }

    return (
        <div className={className}>
            {!selectedFile ? (
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
            border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
            ${isDragging
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-purple-300 hover:border-purple-500 bg-purple-50/50'
                        }
          `}
                >
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept={acceptedTypes.join(',')}
                        onChange={handleFileInput}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Upload className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-gray-700 font-medium mb-2">
                            Drag and drop your resume here, or click to browse
                        </p>
                        <p className="text-sm text-gray-500">
                            Supports {acceptedTypes.join(', ')} (Max {maxSize / (1024 * 1024)}MB)
                        </p>
                    </label>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="border-2 border-purple-300 rounded-xl p-6 bg-white"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                                <p className="text-sm text-gray-500">
                                    {(selectedFile.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={removeFile}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </motion.div>
            )}

            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-600 text-sm mt-2"
                >
                    {error}
                </motion.p>
            )}
        </div>
    )
}

export default FileUpload
