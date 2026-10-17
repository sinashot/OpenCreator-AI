import React from 'react';

/** Shared SVG filters and gradients for the illustration stage. */
export const Defs: React.FC = () => (
	<defs>
		{(
			[
				['glowGreen', '#9EFF00', 10],
				['glowBlue', '#00A8FF', 12],
				['glowGold', '#FFB84D', 14],
				['glowLav', '#B8A9C9', 12],
				['glowWhite', '#FFFFFF', 8],
				['glowRed', '#FF3B4E', 10],
			] as const
		).map(([id, color, sd]) => (
			<filter key={id} id={id} x="-60%" y="-60%" width="220%" height="220%">
				<feGaussianBlur in="SourceAlpha" stdDeviation={sd} result="b" />
				<feFlood floodColor={color} floodOpacity="0.9" />
				<feComposite in2="b" operator="in" result="g" />
				<feMerge>
					<feMergeNode in="g" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		))}
		<filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
			<feGaussianBlur stdDeviation="18" />
		</filter>
		<filter id="softer" x="-80%" y="-80%" width="260%" height="260%">
			<feGaussianBlur stdDeviation="40" />
		</filter>
		<filter id="whipV" x="-10%" y="-40%" width="120%" height="180%">
			<feGaussianBlur stdDeviation="0 26" />
		</filter>
		<radialGradient id="faceLight" cx="70%" cy="25%" r="85%">
			<stop offset="0%" stopColor="#2B3D7C" />
			<stop offset="60%" stopColor="#16214B" />
			<stop offset="100%" stopColor="#0C1433" />
		</radialGradient>
		<linearGradient id="beamBlue" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stopColor="#00A8FF" stopOpacity="0.85" />
			<stop offset="100%" stopColor="#00A8FF" stopOpacity="0.05" />
		</linearGradient>
		<radialGradient id="lampWarm" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stopColor="#FFB84D" stopOpacity="0.75" />
			<stop offset="45%" stopColor="#FFB84D" stopOpacity="0.22" />
			<stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
		</radialGradient>
		<radialGradient id="haloLav" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stopColor="#B8A9C9" stopOpacity="0.5" />
			<stop offset="55%" stopColor="#B8A9C9" stopOpacity="0.12" />
			<stop offset="100%" stopColor="#B8A9C9" stopOpacity="0" />
		</radialGradient>
		<radialGradient id="glowNeonDisc" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stopColor="#9EFF00" stopOpacity="0.55" />
			<stop offset="100%" stopColor="#9EFF00" stopOpacity="0" />
		</radialGradient>
		<radialGradient id="glowBlueDisc" cx="50%" cy="50%" r="50%">
			<stop offset="0%" stopColor="#00A8FF" stopOpacity="0.6" />
			<stop offset="100%" stopColor="#00A8FF" stopOpacity="0" />
		</radialGradient>
		<linearGradient id="sunRay" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stopColor="#FFB84D" stopOpacity="0.7" />
			<stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
		</linearGradient>
	</defs>
);
