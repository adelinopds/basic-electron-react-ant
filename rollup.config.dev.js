import baseConfig from './rollup.config.base'
import serve from 'rollup-plugin-serve'
import copy from 'rollup-plugin-copy'
import livereload from 'rollup-plugin-livereload'
import visualize from 'rollup-plugin-visualizer'

const PORT = 9090

export default {
	...baseConfig,
	input: 'src/index.jsx',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
    sourcemap: true
  },
	plugins: [
		...baseConfig.plugins,
		visualize(),
		copy({
				targets: [{src: 'src/index.html', dest: 'dist'}]
		}),
		serve({
		contentBase: ['dist'],
		historyApiFallback: true,
		port: PORT
		}),
		livereload({ watch: 'dist' }),
]
}
