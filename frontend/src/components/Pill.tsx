import { Badge } from '@/components/ui/badge'
import { XIcon } from '../assets/icons'
import styles from './Pill.module.css'

export interface PillProps {
  children: React.ReactNode
  icon?: React.ReactNode
  onRemove?: () => void
}

export function Pill({ children, icon, onRemove }: PillProps) {
  return (
    <Badge className={styles.pill}>
      {icon && <span className={styles.leftIcon}>{icon}</span>}
      <span className={styles.text}>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={styles.removeButton}
          aria-label="Remove"
        >
          <XIcon className={styles.removeIcon} />
        </button>
      )}
    </Badge>
  )
}
