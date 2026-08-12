import { ImgHTMLAttributes } from 'react';

export default function ApplicationLogo(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return <img src="/images/yousee.png" alt="Yousee Logo" {...props} />;
}
