// Global type declarations to resolve missing React and JSX types

declare module 'react' {
  export = React;
  export as namespace React;
  
  // Add missing exports
  export const useState: any;
  export const useEffect: any;
  export const useCallback: any;
  export const useMemo: any;
  export const useRef: any;
  export const useContext: any;
  export const useReducer: any;
  export const useLayoutEffect: any;
  export const useImperativeHandle: any;
  export const useDebugValue: any;
  export const useId: any;
  export const useTransition: any;
  export const useDeferredValue: any;
  export const useSyncExternalStore: any;
  export const useInsertionEffect: any;
}

declare module 'react/jsx-runtime' {
  export = React;
  export as namespace React;
}

declare module 'lucide-react' {
  import { ComponentType, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }
  
  export const Upload: ComponentType<IconProps>;
  export const Search: ComponentType<IconProps>;
  export const FileText: ComponentType<IconProps>;
  export const Brain: ComponentType<IconProps>;
  export const AlertTriangle: ComponentType<IconProps>;
  export const CheckCircle: ComponentType<IconProps>;
  export const Clock: ComponentType<IconProps>;
  export const Send: ComponentType<IconProps>;
  export const Download: ComponentType<IconProps>;
  export const Trash2: ComponentType<IconProps>;
  export const MessageSquare: ComponentType<IconProps>;
  export const Bot: ComponentType<IconProps>;
  export const User: ComponentType<IconProps>;
  export const Plus: ComponentType<IconProps>;
  export const Settings: ComponentType<IconProps>;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
