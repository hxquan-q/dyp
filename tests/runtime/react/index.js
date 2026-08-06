'use strict'
const React = {
  useCallback: (f) => f,
  useContext: () => ({}),
  useMemo: (f) => (typeof f === 'function' ? f() : f),
  useEffect: () => {},
  useState: (init) => [typeof init === 'function' ? init() : (init ?? []), () => {}],
  useRef: (init) => ({ current: init ?? null }),
  forwardRef: (render) => { const C = function(props) { return render(props, null) }; return C },
  createContext: (v) => ({ Provider: ({children}) => children, Consumer: () => null, _v: v }),
  createElement: () => null,
  Fragment: 'Fragment',
  useReducer: (r, init) => [typeof init === 'function' ? init() : (init ?? {}), () => {}],
}
module.exports = React
module.exports.default = React
module.exports.jsx = () => null
module.exports.jsxs = () => null
