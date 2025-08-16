export default function Skeleton({ height=14, style={}, className='' }){
  return <div className={['skeleton', className].join(' ')} style={{height, ...style}} />;
}
