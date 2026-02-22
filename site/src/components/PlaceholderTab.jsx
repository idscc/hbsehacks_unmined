import styles from './PlaceholderTab.module.css'

export default function PlaceholderTab({ title, message }) {
  return (
    <section className={styles.placeholder}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.message}>{message}</p>
    </section>
  )
}
