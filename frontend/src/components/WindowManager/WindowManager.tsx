import { useSelector } from "react-redux"
import type { RootState } from "../../store"
import Window from "./Window"
import Explorer from "../Apps/Explorer/Explorer"
import Notes from "../Apps/Notes/Notes"
import Tasks from "../Apps/Tasks/Tasks"
import Settings from "../Apps/Settings/Settings"
import Notifications from "../Apps/Notifications/Notifications"
import "./WindowManager.css"

const WindowManager = () => {
  const windows = useSelector((state: RootState) => state.windows.windows)

  const getAppComponent = (appId: string) => {
    switch (appId) {
      case "explorer":
        return <Explorer />
      case "notes":
        return <Notes />
      case "tasks":
        return <Tasks />
      case "settings":
        return <Settings />
      case "notifications":
        return <Notifications />
      default:
        return <div>App not found</div>
    }
  }

  return (
    <div className="window-manager">
      {windows.map(
        (window) =>
          !window.isMinimized && (
            <Window key={window.id} window={window}>
              {getAppComponent(window.appId)}
            </Window>
          ),
      )}
    </div>
  )
}

export default WindowManager

