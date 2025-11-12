import { ORANGE } from '../OrangeButton'

const Spinner = () => (
  <div style={overlayStyle}>
    <div style={{ ...spinnerStyle, borderTopColor: ORANGE }} />
  </div>
)

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 101,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(4px)'
}

const spinnerStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  border: '4px solid #E5E7EB', // light gray
  borderRadius: '50%',
  borderTopColor: ORANGE,
  animation: 'spin 1s linear infinite'
}

export default Spinner
