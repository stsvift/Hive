import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "../../store"
import { openWindow } from "../../store/windowsSlice"
import "./Desktop.css"

const Desktop = () => {
  const dispatch = useDispatch()
  const apps = useSelector((state: RootState) => state.apps.apps)
  useSelector((state: RootState) => state.auth)

  const handleAppClick = (appId: string, title: string) => {
    dispatch(openWindow({ appId, title }))
  }

  return (
    <div className="desktop" style={{ backgroundColor: "var(--bg-color)" }}>
      <div className="desktop-icons">
        {apps.map((app) => (
          <div key={app.id} className="desktop-icon" onDoubleClick={() => handleAppClick(app.id, app.title)}>
            <div className="desktop-icon-img">
              <i className={`fas fa-${app.icon}`}></i>
            </div>
            <div className="desktop-icon-label">{app.title}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Desktop

