import { Spin, Typography } from 'antd'
import './PageLoader.css'

/**
 * Loader plein écran pour chargement des pages ou des données.
 * @param {string} [message='Chargement...'] - Message affiché sous le spinner
 */
export default function PageLoader({ message = 'Chargement...' }) {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <Spin size="large" />
      {message && (
        <Typography.Text type="secondary" className="page-loader-message">
          {message}
        </Typography.Text>
      )}
    </div>
  )
}
