import { Button as ButtonPrimitive } from '@/components/ui/button'
import styles from './Button.module.css'

export interface ButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  onClick?: () => void
}

export function Button({ children, icon, variant = 'default', onClick }: ButtonProps) {
  return (
    <ButtonPrimitive
      variant={variant}
      onClick={onClick}
      className={styles.button}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </ButtonPrimitive>
  )
}
