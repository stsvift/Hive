import { FC } from 'react';
import styles from '../styles/Widget.module.css';
import { WidgetProps } from '../types';

const DashboardWidget: FC<WidgetProps> = ({ size, title, children }) => {
  return (
    <div className={`${styles.widget} ${styles[size]}`}>
      <div className={styles.widgetHeader}>
        <h3>{title}</h3>
      </div>
      <div className={styles.widgetContent}>
        {children}
      </div>
    </div>
  );
};

export default DashboardWidget;