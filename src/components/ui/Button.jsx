const styles = {
  primary: 'bg-navy text-white hover:bg-navy/90',
  secondary: 'bg-accent text-navy hover:bg-accent/80',
}

export default function Button({ variant = 'primary', className = '', ...props }) {
  return (
    <button
      type="button"
      className={`rounded-full font-bold py-3.5 px-7 text-base transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    />
  )
}
