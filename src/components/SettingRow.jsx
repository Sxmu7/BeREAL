import './SettingRow.css'

export default function SettingRow({ label, description, children }) {
  return (
    <div className="setting-row">
      <div className="setting-row__label-wrap">
        <span className="setting-row__label">{label}</span>
        {description && (
          <span className="setting-row__description">{description}</span>
        )}
      </div>
      <div className="setting-row__control">{children}</div>
    </div>
  )
}
