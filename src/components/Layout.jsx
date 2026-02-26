import { Outlet } from 'react-router-dom'
import { Layout as AntLayout } from 'antd'
import AppHeader from './AppHeader'
import { useHideHeader } from '../context/HideHeaderContext'
import './Layout.css'

const { Content } = AntLayout

export default function Layout() {
  const [hideHeader] = useHideHeader()
  return (
    <AntLayout className="app-layout">
      {!hideHeader && <AppHeader />}
      <Content className="app-content">
        <Outlet />
      </Content>
    </AntLayout>
  )
}
