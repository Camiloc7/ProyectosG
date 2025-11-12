import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    define: {
      'process.env.GH_TOKEN': JSON.stringify(process.env.GH_TOKEN)
    },
    build: {
        rollupOptions: {
            external: [
                'node-printer'
            ],
        },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
    
  }
})


// import { resolve } from 'path'
// import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
// import react from '@vitejs/plugin-react'

// export default defineConfig({
//   main: {
//     plugins: [externalizeDepsPlugin()],
//      define: {
//       'process.env.GH_TOKEN': JSON.stringify(process.env.GH_TOKEN)
//     }
//   },
//   preload: {
//     plugins: [externalizeDepsPlugin()]
//   },
//   renderer: {
//     resolve: {
//       alias: {
//         '@renderer': resolve('src/renderer/src')
//       }
//     },
//     plugins: [react()]
    
//   }
// })
