/*
  VS mark — wyr.css .vs-circle
  46px circle (default), 1.5px --ink border, italic Newsreader "vs", --card bg.
  Scale via the `size` prop; font-size tracks at 41% of diameter (matches prototype).
*/
export function VS({ size = 46 }: { size?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width:          size,
        height:         size,
        borderRadius:   '50%',
        border:         '1.5px solid var(--ink)',
        background:     'var(--card)',
        color:          'var(--ink)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
        fontFamily:     'var(--serif)',
        fontStyle:      'italic',
        fontWeight:     500,
        fontSize:       Math.round(size * 0.41),
        lineHeight:     1,
        userSelect:     'none',
      }}
    >
      vs
    </div>
  )
}
