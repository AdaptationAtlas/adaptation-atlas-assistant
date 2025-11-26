import { Input } from '@/components/ui/input'
import styles from './SearchInput.module.css'

export interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export function SearchInput({ placeholder, value, onChange }: SearchInputProps) {
  return (
    <div className={styles.container}>
      <div className={styles.inputWrapper}>
        <svg
          className={styles.icon}
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.41-7.59 2.83-2.82M4.58 19.41l2.83-2.82m0-9.18L4.58 4.59m14.84 14.82-2.83-2.82" />
        </svg>
        <Input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={styles.input}
        />
      </div>
    </div>
  )
}
