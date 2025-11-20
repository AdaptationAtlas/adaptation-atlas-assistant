import styles from './Login.module.css';
import { useAuth } from "react-oidc-context";

export function Login() {
  const { signinRedirect } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    signinRedirect();
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Adaptation Atlas Co-Pilot</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <button type="submit" className={styles.button}>
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
