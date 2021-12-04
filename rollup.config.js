import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';

const plugins = [resolve(), typescript(), commonjs()];

// TODO: edit external dependencies
const external = [
  "dependency"
]

// TODO: edit name
const name = "modulename"

export default [  
  // Asynchronous Module Definition, used with module loaders like RequireJS
  {
    input: 'src/index.ts',    
    external,
    output: {      
      file: `dist/index.amd.js`,
      format: 'amd'
    },
    plugins
  },  
  // CommonJS, suitable for Node and other bundlers (alias: commonjs)
  {
    input: 'src/index.ts',    
    external,
    output: {      
      file: `dist/index.cjs`,
      format: 'cjs'
    },
    plugins
  },  
  // Keep the bundle as an ES module file, suitable for other bundlers and inclusion as a <script type=module> tag in modern browsers (alias: esm, module)
  {
    input: 'src/index.ts',
    external,
    output: {      
      file: `dist/index.es.js`,
      format: 'es'
    },
    plugins
  },    
  // A self-executing function, suitable for inclusion as a <script> tag. (If you want to create a bundle for your application, you probably want to use this.). "iife" stands for "immediately-invoked Function Expression"
  {
    input: 'src/index.ts',
    external,
    output: {
      name,
      file: `dist/index.iife.js`,
      format: 'iife'
    },
    plugins
  },  
  // Universal Module Definition, works as amd, cjs and iife all in one
  {
    input: 'src/index.ts',
    external,
    output: {
      name,
      file: `dist/index.umd.js`,
      format: 'umd'
    },
    plugins
  },      
  {
    input: 'src/index.ts',
    external,
    output: {      
      file: `dist/index.system.js`,
      format: 'system'
    },
    plugins
  },      
];