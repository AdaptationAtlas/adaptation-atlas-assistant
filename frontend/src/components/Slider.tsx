import { Slider as SliderPrimitive } from '@/components/ui/slider'
import styles from './Slider.module.css'

export interface Step {
  value: number
  label: string
}

export interface SliderProps {
  label: string
  isSingleHandle: boolean
  value?: number | [number, number]
  defaultValue?: number | [number, number]
  onValueChange?: (value: number | [number, number]) => void
  steps?: Step[]
  min?: number
  max?: number
  step?: number
  minLabel?: string
  maxLabel?: string
}

export function Slider({
  label,
  isSingleHandle,
  value,
  defaultValue,
  onValueChange,
  steps,
  min: propMin,
  max: propMax,
  step = 1,
  minLabel,
  maxLabel,
}: SliderProps) {

  // Calculate min/max from steps if provided, otherwise use props
  let min: number
  if (steps) {
    min = steps[0]?.value ?? 0
  } else {
    min = propMin ?? 0
  }

  let max: number
  if (steps) {
    max = steps[steps.length - 1]?.value ?? 0
  } else {
    max = propMax ?? 100
  }

  let currentValue: number | [number, number]
  if (value !== undefined) {
    currentValue = value
  } else if (defaultValue !== undefined) {
    currentValue = defaultValue
  } else {
    currentValue = isSingleHandle ? min : [min, max]
  }

  const getDisplayValue = () => {
    if (steps) {
      if (isSingleHandle) {
        const stepLabel = steps.find(s => s.value === currentValue)?.label ?? currentValue
        return stepLabel
      } else {
        const [minVal, maxVal] = currentValue as [number, number]
        const minStepLabel = steps.find(s => s.value === minVal)?.label ?? minVal
        const maxStepLabel = steps.find(s => s.value === maxVal)?.label ?? maxVal
        return `${minStepLabel} - ${maxStepLabel}`
      }
    } else {
      if (isSingleHandle) {
        return currentValue
      } else {
        const [minVal, maxVal] = currentValue as [number, number]
        return `${minVal} - ${maxVal}`
      }
    }
  }

  const handleValueChange = (values: number[]) => {
    if (!onValueChange) return

    if (isSingleHandle && values[0] !== undefined) {
      const singleValueCallback = onValueChange as (value: number) => void
      singleValueCallback(values[0])
    } else if (!isSingleHandle && values.length === 2) {
      const rangeValueCallback = onValueChange as (value: [number, number]) => void
      rangeValueCallback([values[0], values[1]])
    }
  }

  // Convert value/defaultValue to array format for SliderPrimitive
  const primitiveValue = value !== undefined
    ? (typeof value === 'number' ? [value] : value)
    : undefined
  const primitiveDefaultValue = defaultValue !== undefined
    ? (typeof defaultValue === 'number' ? [defaultValue] : defaultValue)
    : undefined

  if (steps) {
    return (
      <div className={styles.container}>
        <div className={styles.labelRow}>
          <span className={styles.label}>{label}: {getDisplayValue()}</span>
        </div>
        <div className={styles.sliderWrapper}>
          <SliderPrimitive
            defaultValue={primitiveDefaultValue}
            value={primitiveValue}
            onValueChange={handleValueChange}
            min={min}
            max={max}
            step={1}
            className={styles.slider}
          />
          <div className={styles.steps}>
            {steps.map((s) => (
              <div key={s.value} className={styles.step}>
                <div className={styles.tick} />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.labels}>
          {steps.map((s) => (
            <span key={s.value} className={styles.stepLabel}>
              {s.label}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // Simple slider without steps
  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}: {getDisplayValue()}</span>
      </div>
      <SliderPrimitive
        defaultValue={primitiveDefaultValue}
        value={primitiveValue}
        onValueChange={handleValueChange}
        min={min}
        max={max}
        step={step}
        className={styles.slider}
      />
      {minLabel && maxLabel && (
        <div className={styles.valueRow}>
          <span className={styles.value}>{minLabel}</span>
          <span className={styles.value}>{maxLabel}</span>
        </div>
      )}
    </div>
  )
}
