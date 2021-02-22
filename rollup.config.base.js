import babel from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import replace from '@rollup/plugin-replace'
import progress from 'rollup-plugin-progress'
import postcss from 'rollup-plugin-postcss'
import filesize from 'rollup-plugin-filesize'
import json from 'rollup-plugin-json'
import reactSvg from 'rollup-plugin-react-svg'
import path from 'path'


export default {
  plugins: [
		progress({
			clearLine: false
		}),
    nodeResolve({
			browser: true,
			extensions: ['.js', '.jsx', '.json']
		}),
		json(),
		reactSvg(),
    commonjs({
      include: [ 'node_modules/**'],
			exclude: ['node_modules/process-es6/**'],
    }),
		
		postcss({
			extract: true,
			extract: path.resolve('dist/styles.css')
		}),
    babel({
			babelHelpers: 'bundled',
      exclude: 'node_modules/**' 
    }),
		filesize(),
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
  ],
	inlineDynamicImports: true,
	external:['fs', 'path']
}
