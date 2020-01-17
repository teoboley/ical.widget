import typescript from '@rollup/plugin-typescript';
import jsx from 'acorn-jsx';

export default {
    external: ['./lib/config.jsx', 'react', 'react-dom'],
    input: 'src/index.tsx',
    output: {
        file: 'ical.widget/index.jsx',
        format: 'cjs'
    },
    acornInjectPlugins: [
        jsx()
    ],
    plugins: [typescript()]
};
