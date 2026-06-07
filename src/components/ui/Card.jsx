export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`bg-white border border-navy/10 rounded-2xl shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
