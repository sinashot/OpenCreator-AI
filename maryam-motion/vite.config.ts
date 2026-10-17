import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

// Preview app: the film inside @remotion/player with our own transport controls.
// `public/` (font + narration) is served at the root, the same paths staticFile() uses.
export default defineConfig({
	plugins: [react()],
	root: '.',
	publicDir: 'public',
});
