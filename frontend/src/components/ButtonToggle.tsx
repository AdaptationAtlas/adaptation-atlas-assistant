import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import styles from './ButtonToggle.module.css'

export interface ToggleOption {
  value: string
  label: string
}

export interface ButtonToggleProps {
  label: string
  options: ToggleOption[]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export function ButtonToggle({
  label,
  options,
  value,
  onValueChange,
  defaultValue,
}: ButtonToggleProps) {
  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <ToggleGroup
        type="single"
        value={value}
        onValueChange={onValueChange}
        defaultValue={defaultValue}
        className={styles.toggleGroup}
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            className={styles.toggleItem}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}
