import { Slider as SliderPrimitive } from '@/components/ui/slider'
import styles from './SliderWithSteps.module.css'

export interface Step {
  value: number
  label: string
}

export interface SingleSliderWithStepsProps {
  label: string
  steps: Step[]
  defaultValue?: number
  value?: number
  onValueChange?: (value: number) => void
}

export function SingleSliderWithSteps({
  label,
  steps,
  defaultValue,
  value,
  onValueChange,
}: SingleSliderWithStepsProps) {
  const min = steps[0]?.value ?? 0
  const max = steps[steps.length - 1]?.value ?? 0

  const currentValue = value ?? defaultValue ?? min

  // Find the step label for the current value
  const currentStepLabel = steps.find(s => s.value === currentValue)?.label ?? currentValue

  const handleValueChange = (values: number[]) => {
    if (onValueChange && values[0] !== undefined) {
      onValueChange(values[0])
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}: {currentStepLabel}</span>
      </div>
      <div className={styles.sliderWrapper}>
        <SliderPrimitive
          defaultValue={defaultValue !== undefined ? [defaultValue] : undefined}
          value={value !== undefined ? [value] : undefined}
          onValueChange={handleValueChange}
          min={min}
          max={max}
          step={1}
          className={styles.slider}
        />
        <div className={styles.steps}>
          {steps.map((step) => (
            <div key={step.value} className={styles.step}>
              <div className={styles.tick} />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.labels}>
        {steps.map((step) => (
          <span key={step.value} className={styles.stepLabel}>
            {step.label}
          </span>
        ))}
      </div>
    </div>
  )
}
