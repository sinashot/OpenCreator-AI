import React from 'react';

type Props = React.SVGProps<SVGPathElement> & {d: string; p?: number; /** retract from the start instead of the end */ rev?: boolean};

/** A stroked path that draws itself on (p: 0 → 1) with stroke-dashoffset. */
export const Draw: React.FC<Props> = ({d, p = 1, rev = false, stroke = '#E8EEF9', strokeWidth = 4, ...rest}) => {
	if (p <= 0) return null;
	return (
		<path
			d={d}
			pathLength={1}
			strokeDasharray={p >= 1 ? undefined : '1 1'}
			strokeDashoffset={p >= 1 ? undefined : rev ? -(1 - p) : 1 - p}
			fill="none"
			stroke={stroke}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
			{...rest}
		/>
	);
};
