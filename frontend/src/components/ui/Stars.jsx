export default function Stars({ value=0, onChange=null, size=18 }){
  const int = Math.round(value);
  const stars = [1,2,3,4,5];
  const style = { cursor: onChange ? 'pointer' : 'default', fontSize: size, lineHeight: 1 };
  return (
    <div aria-label={int + ' out of 5 stars'}>
      {stars.map(n => (
        <span
          key={n}
          onClick={onChange ? () => onChange(n) : undefined}
          style={{ ...style, color: n <= int ? '#fbbf24' : '#334155', marginRight: 2 }}
          role={onChange ? 'button' : undefined}
        >{n <= int ? '★' : '☆'}</span>
      ))}
    </div>
  );
}
