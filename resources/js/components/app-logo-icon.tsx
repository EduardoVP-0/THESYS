import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <image href="/images/thesys-icon.png" width="512" height="512" />
        </svg>
    );
}
