/// <reference types="vite/client" />

declare module './ziggy' {
    export const Ziggy: any;
}

declare module '@/ziggy' {
    export const Ziggy: any;
}
declare global {
    namespace JSX {
        interface Element extends React.ReactElement<any, any> {}
    }
}