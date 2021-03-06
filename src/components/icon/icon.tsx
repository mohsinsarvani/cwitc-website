import React from 'react';
import feather from 'feather-icons';

import './icon.scss';

const Icon = ({ name, className, onClick, onMouseEnter, onMouseLeave }: IconProps) => {
    let iconHtml: string;

    try {
        iconHtml = feather.icons[name].toSvg();
    }
    catch (err) {
        // tslint:disable-next-line:no-console
        console.error(`${ name } is not a valid feather icon! https://feathericons.com/`);
        iconHtml = feather.icons.info.toSvg();
    }

    const clickHandler = () => {
        if (onClick) {
            onClick();
        }
    };

    const onMouseEnterHandler = () => {
        if (onMouseEnter) {
            onMouseEnter();
        }
    };

    const onMouseLeaveHandler = () => {
        if (onMouseLeave) {
            onMouseLeave();
        }
    };

    return (
        <span
            className={ ['icon', `icon-${ name }`, className].join(' ') }
            onClick={ clickHandler }
            onMouseEnter={ onMouseEnterHandler }
            onMouseLeave={ onMouseLeaveHandler }
            dangerouslySetInnerHTML={{ __html: iconHtml }} />);
};

export default Icon;

export type IconProps = {
    name: string,
    className?: string,
    onClick?: Function,
    onMouseEnter?: Function,
    onMouseLeave?: Function
}