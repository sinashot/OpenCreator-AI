/* Call to action. */
import React from 'react';
import {At, C, Fa, SceneProps, Words, clamp, inn, lineAt, lineEnd, mix, punch, spr} from '../kit';

export const Cta: React.FC<SceneProps> = ({t, sec}) => {
	const at = lineAt(sec);
	const c = at('c1');
	const cEnd = lineEnd(sec)('c1');
	const big = c + (cEnd - c) * 0.62; // «حتماً ما رو فالو کن!»
	const btn = spr(t, big + 0.2, 170, 15);
	const tap = big + 1.3;
	const cursor = inn(t, big + 0.5, 0.8);
	const done = t > tap;
	return (
		<>
			<div style={{position: 'absolute', top: 560, left: 70, width: 940}}>
				<Words text="اگه می‌خوای بیشتر راجع به داروها و سلامتِ بدن بدونی،" t={t} at={c} span={(big - c) * 0.8} size={72} weight={800} color={C.ink} />
			</div>
			<div style={{position: 'absolute', top: 900, left: 40, width: 1000, transform: `scale(${punch(t, big, 0.08)})`}}>
				<Words text="حتماً ما رو فالو کن!" t={t} at={big} span={0.5} size={120} color={C.relief} />
			</div>
			<At x={540} y={1250}>
				<div
					style={{
						transform: `scale(${mix(0.7, 1, btn) * punch(t, tap, -0.08, 0.25)})`,
						opacity: clamp(btn * 2),
						background: done ? C.bg2 : C.relief,
						border: `4px solid ${C.relief}`,
						borderRadius: 999,
						padding: '18px 90px',
					}}
				>
					<Fa size={64} weight={900} color={done ? C.relief : C.bg}>
						{done ? 'دنبال شد ✓' : 'دنبال کردن'}
					</Fa>
				</div>
			</At>
			{/* fingertip that taps the button */}
			<At x={mix(900, 600, cursor)} y={mix(1600, 1290, cursor) + (t > tap - 0.1 && t < tap + 0.15 ? 12 : 0)} style={{opacity: cursor * (1 - inn(t, tap + 0.8, 0.4))}}>
				<div style={{width: 80, height: 80, borderRadius: 999, background: 'rgba(255,244,230,0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.4)'}} />
			</At>
			<div style={{position: 'absolute', top: 1450, left: 90, width: 900, opacity: inn(t, big + 1.0)}}>
				<Fa size={34} weight={500} color={C.dim} wrap>
					این ویدیو فقط جنبه‌ی آموزشی داره؛ برای مصرفِ هر دارو با پزشک یا داروساز مشورت کن.
				</Fa>
			</div>
		</>
	);
};
