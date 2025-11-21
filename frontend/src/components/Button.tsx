import { Button as ButtonPrimitive } from '@/components/ui/button'
import styles from './Button.module.css'

export interface ButtonProps {
  children: React.ReactNode
  icon?: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  onClick?: () => void
  hoverSlide?: boolean
  italic?: boolean
  align?: 'center' | 'left'
}

export function Button({
  children,
  icon,
  variant = 'default',
  onClick,
  hoverSlide = false,
  italic = false,
  align = 'center',
}: ButtonProps) {
  const className = [
    styles.button,
    hoverSlide && styles.buttonHoverSlide,
    italic && styles.buttonItalic,
    align === 'left' && styles.buttonAlignLeft,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <ButtonPrimitive
      variant={variant}
      onClick={onClick}
      className={className}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </ButtonPrimitive>
  )
}
