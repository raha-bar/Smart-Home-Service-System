export default function Button({ as:Comp='button', variant='default', size='md', className='', children, ...props }){
  const base = 'btn';
  const v = variant === 'primary' ? 'btn-primary' : variant === 'ghost' ? 'btn-ghost' : '';
  const s = size === 'sm' ? 'btn-sm' : '';
  const cls = [base, v, s, className].filter(Boolean).join(' ');
  return <Comp className={cls} {...props}>{children}</Comp>;
}
