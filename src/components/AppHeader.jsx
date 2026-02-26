import { Link } from 'react-router-dom'
import { Layout, Typography, Button } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import smashIcon from '../data/assets/smash.svg'
import './AppHeader.css'

const { Header } = Layout
const { Title } = Typography

export default function AppHeader() {
  return (
    <Header className="app-header">
      <div className="header-content">
        <img src={smashIcon} alt="" className="header-icon" />
        <Link to="/" className="header-link">
          <Title level={3} className="header-title">
            Super Smash Bros - Mini Jeux
          </Title>
        </Link>
        <Link to="/combattants" className="header-combattants-link">
          <Button type="default" icon={<TeamOutlined />} className="header-combattants-btn">
            Combattants
          </Button>
        </Link>
      </div>
    </Header>
  )
}
