import { useRef, useState } from 'react';
import { Upload, X, FileText } from 'lucide-react';
import { useChatStore } from '../../store/chatStore';
import type { AttachmentFile } from '../../types/sidebar';

const MAX_FILE_SIZE = 100 * 1024; // 100KB

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
}

export function AttachmentsSection() {
    const { sidebar, addAttachment, removeAttachment } = useChatStore();
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        setError(null);

        Array.from(files).forEach((file) => {
            const extension = file.name.split('.').pop()?.toLowerCase();

            if (extension !== 'csv' && extension !== 'txt') {
                setError('Only CSV and TXT files are supported');
                return;
            }

            if (file.size > MAX_FILE_SIZE) {
                setError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const attachment: AttachmentFile = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    content,
                    type: extension as 'csv' | 'txt',
                    size: file.size,
                };
                addAttachment(attachment);
            };
            reader.onerror = () => {
                setError(`Failed to read file: ${file.name}`);
            };
            reader.readAsText(file);
        });

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    return (
        <div className="flex flex-col gap-3">
            {/* Drop zone */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    flex flex-col items-center justify-center gap-2 p-4
                    border-2 border-dashed rounded-lg cursor-pointer
                    transition-colors duration-200
                    ${
                        isDragging
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                            : 'border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50'
                    }
                `}
            >
                <Upload
                    className={`w-6 h-6 ${isDragging ? 'text-[var(--primary)]' : 'text-neutral-400'}`}
                />
                <div className="text-center">
                    <p className="text-sm text-neutral-600">
                        Drag CSV or TXT files here
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                        or click to browse
                    </p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>

            {/* Error message */}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}

            {/* File list */}
            {sidebar.attachments.files.length > 0 && (
                <div className="flex flex-col gap-2">
                    {sidebar.attachments.files.map((file) => (
                        <div
                            key={file.id}
                            className="flex items-center gap-2 p-2 bg-neutral-50 rounded-md group"
                        >
                            <FileText className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-neutral-700 truncate">
                                    {file.name}
                                </p>
                                <p className="text-xs text-neutral-400">
                                    {formatFileSize(file.size)}
                                </p>
                            </div>
                            <button
                                onClick={() => removeAttachment(file.id)}
                                className="p-1 text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label={`Remove ${file.name}`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
