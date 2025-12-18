import styles from './Acknowledgements.module.css';

interface AcknowledgementsProps {
    className?: string;
}

export function Acknowledgements({ className }: AcknowledgementsProps) {
    return (
        <div className={`${styles.acknowledgements} ${className || ''}`}>
            <p className={styles.text}>
                The Atlas AI Assistant is part of the Africa Agriculture
                Adaptation Atlas, funded by the Gates Foundation, developed by
                Development Seed in collaboration with the Alliance of
                Bioversity International and CIAT, and supported in 2026 by the
                CGIAR Climate Action Program.
            </p>

            <div className={styles.logoContainer}>
                <img
                    src={`${import.meta.env.BASE_URL}data/image.png`}
                    alt="CGIAR Climate Action"
                    className={styles.logo}
                />
            </div>
        </div>
    );
}
