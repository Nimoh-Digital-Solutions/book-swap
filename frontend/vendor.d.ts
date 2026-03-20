// Ambient declarations for packages that ship without TypeScript types.

/** open-props — CSS custom property primitives as a JS object.
 *  Used by postcss-jit-props to know the full set of available vars.
 *  Shape: { '--size-1': '.25rem', '--ease-3': 'ease(...)' ... }
 */
declare module 'open-props' {
  const props: Record<string, string>;
  export default props;
}
