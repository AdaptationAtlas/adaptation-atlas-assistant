import { Slider as SliderPrimitive } from '@/components/ui/slider'
import styles from './SliderWithSteps.module.css'

export interface Step {
  value: number
  label: string
}

export interface SliderWithStepsProps {
  label: string
  steps: Step[]
  defaultValue?: [number, number]
  value?: [number, number]
  onValueChange?: (value: [number, number]) => void
}

export function SliderWithSteps({
  label,
  steps,
  defaultValue,
  value,
  onValueChange,
}: SliderWithStepsProps) {
  const min = steps[0]?.value ?? 0
  const max = steps[steps.length - 1]?.value ?? 0

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
      </div>
      <div className={styles.sliderWrapper}>
        <SliderPrimitive
          defaultValue={defaultValue}
          value={value}
          onValueChange={onValueChange}
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
