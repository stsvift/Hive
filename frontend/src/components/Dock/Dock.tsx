import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "../../store"
import { openWindow, activateWindow } from "../../store/windowsSlice"
import "./Dock.css"

const Dock = () => {
  const dispatch = useDispatch()
  const apps = useSelector((state: RootState) => state.apps.apps)
  const windows = useSelector((state: RootState) => state.windows.windows)

  const handleAppClick = (appId: string, title: string) => {
    dispatch(openWindow({ appId, title }))
  }

  const handleMinimizedWindowClick = (windowId: string) => {
    dispatch(activateWindow(windowId))
  }

  const minimizedWindows = windows.filter((window) => window.isMinimized)

  return (
    <div className="dock-container">
      <div className="dock">
        {apps.map((app) => (
          <div key={app.id} className="dock-icon" onClick={() => handleAppClick(app.id, app.title)}>
            <i className={`fas fa-${app.icon}`}></i>
            <span className="dock-icon-tooltip">{app.title}</span>
          </div>
        ))}

        {minimizedWindows.length > 0 && <div className="dock-divider"></div>}

        {minimizedWindows.map((window) => {
          const app = apps.find((app) => app.id === window.appId)
          return (
            <div
              key={window.id}
              className="dock-icon dock-icon-minimized"
              onClick={() => handleMinimizedWindowClick(window.id)}
            >
              <i className={`fas fa-${app?.icon || "window-maximize"}`}></i>
              <span className="dock-icon-tooltip">{window.title}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dock

