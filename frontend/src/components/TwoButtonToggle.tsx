import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import styles from './TwoButtonToggle.module.css'

export interface ToggleOption {
  value: string
  label: string
}

export interface TwoButtonToggleProps {
  label: string
  options: [ToggleOption, ToggleOption]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export function TwoButtonToggle({
  label,
  options,
  value,
  onValueChange,
  defaultValue,
}: TwoButtonToggleProps) {
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
        <ToggleGroupItem value={options[0].value} className={styles.toggleItem}>
          {options[0].label}
        </ToggleGroupItem>
        <ToggleGroupItem value={options[1].value} className={styles.toggleItem}>
          {options[1].label}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
