import { BiMemoryCard } from 'react-icons/bi'
import { CgProfile } from 'react-icons/cg'
import { IoNotificationsOutline } from 'react-icons/io5'
import { RiDashboardLine } from 'react-icons/ri'
import { NavLink, useLocation } from 'react-router-dom'
import styles from '../styles/Navigation.module.css'

const Navigation = () => {
  const location = useLocation()
  const isExactPath = (path: string) => location.pathname === path

  return (
    <nav className={styles.navigation}>
      <NavLink
        to="/dashboard"
        className={`${styles.navItem} ${isExactPath('/dashboard') ? styles.active : ''}`}
        title="Dashboard"
      >
        <RiDashboardLine size={24} />
      </NavLink>
      <NavLink
        to="/memory"
        className={`${styles.navItem} ${
          isExactPath('/memory') ? styles.active : ''
        }`}
        title="Memory"
      >
        <BiMemoryCard size={24} />
      </NavLink>
      <NavLink
        to="/notification"
        className={`${styles.navItem} ${
          isExactPath('/notification') ? styles.active : ''
        }`}
        title="Notification"
      >
        <IoNotificationsOutline size={24} />
      </NavLink>
      <NavLink
        to="/profile"
        className={`${styles.navItem} ${
          isExactPath('/profile') ? styles.active : ''
        }`}
        title="Profile"
      >
        <CgProfile size={24} />
      </NavLink>
    </nav>
  )
}

export default Navigation
