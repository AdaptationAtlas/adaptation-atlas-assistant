import { Slider as SliderPrimitive } from '@/components/ui/slider'
import styles from './Slider.module.css'

export interface SliderProps {
  label: string
  min: number
  max: number
  step?: number
  defaultValue?: [number, number]
  value?: [number, number]
  onValueChange?: (value: [number, number]) => void
  minLabel: string
  maxLabel: string
}

export function Slider({
  label,
  min,
  max,
  step = 1,
  defaultValue,
  value,
  onValueChange,
  minLabel,
  maxLabel,
}: SliderProps) {
  const currentValue = value || defaultValue || [min, max]
  const displayValue = currentValue.length === 2
    ? `${currentValue[0]} - ${currentValue[1]}`
    : currentValue[0]

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}: {displayValue}</span>
      </div>
      <SliderPrimitive
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        className={styles.slider}
      />
      <div className={styles.valueRow}>
        <span className={styles.value}>{minLabel}</span>
        <span className={styles.value}>{maxLabel}</span>
      </div>
    </div>
  )
}
