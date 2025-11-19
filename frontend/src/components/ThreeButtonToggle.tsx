import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import styles from './ThreeButtonToggle.module.css'

export interface ToggleOption {
  value: string
  label: string
}

export interface ThreeButtonToggleProps {
  label: string
  options: [ToggleOption, ToggleOption, ToggleOption]
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

export function ThreeButtonToggle({
  label,
  options,
  value,
  onValueChange,
  defaultValue,
}: ThreeButtonToggleProps) {
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
        <ToggleGroupItem value={options[2].value} className={styles.toggleItem}>
          {options[2].label}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
