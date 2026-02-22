import styles from './Tabs.module.css'

export default function Tabs({ tabs, activeTab, onSelect }) {
  return (
    <nav className={styles.tabs} role="tablist">
      {tabs.map(({ id, label, icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          className={activeTab === id ? styles.tabActive : styles.tab}
          onClick={() => onSelect(id)}
        >
          <span className={styles.tabIcon}>{icon}</span>
          {label}
        </button>
      ))}
    </nav>
  )
}
