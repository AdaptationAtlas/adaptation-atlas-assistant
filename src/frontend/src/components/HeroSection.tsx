import styles from './HeroSection.module.css';

interface HeroSectionProps {
  title: string;
  description: string;
  className?: string;
}

export function HeroSection({ title, description, className }: HeroSectionProps) {
  return (
    <div className={`${styles.heroSection} ${className || ''}`}>
      <div className={styles.heroImage}>
        <div className={styles.heroCircle}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>{title}</h1>
            <p className={styles.heroDescription}>{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
