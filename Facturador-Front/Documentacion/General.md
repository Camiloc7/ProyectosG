**Henry's project para Quality Soft Service**

Tech Stack: React, Zubstand, Next y Tailwind
librerias: shadcn (estilos) y zod (validaciones)

SOLO SE USARA TAILWIND PARA EL PROYECTO NO ARCHIVOS CSS

Correr Proyecto:

1. npm i
2. npm run dev

## Antes de deployar

1. npm i
2. npm run build
3. npm start (revisar que las funciones importantes anden bien)
4. revisar siempre la pagina deployada una vez subidos los cambios

En src/app/ van todas las vistas del proyecto
En src/componentes van los componentes importantes que se usarion a lo largo del proyecto
En src/helpers van las funciones que ayudan a la store mas que todo
En src/store va la parte del zubstand todas las conexiones con el back-end
En src/types van todas las "interface" de Typescript

# COMMITS:

_tipo de commit_: _tarea realizada_

tipos de commit:
feature: nueva funcion
bugfix: arreglo de error
refactor: rehacer parte del codigo
style: cambios que ayudan a lo legible del codigo sin agregar nada de codigo en si
docs: agregar comentarios o cambiar cosas en el readme

_EJ:_
feature: nuevo formulario de registro de usuario funcionando

# RAMAS:

-main (produccion)
-develop
-ramas de features

-por cada feature en desarrollo se agrega una rama nueva y al completarlo se hace merge con la rama develop(MUCHO CUIDADO DE NO ELIMINAR EL CODIGO DE SUS COMPAÑEROS O ROMPERLO)

-al con una rama ELIMINARLA despues del merge

# FORMATO DEL CODIGO:

-En el front unicamente vamos a utilizar camelCase
-Siempre antes de guardar el codigo deben asegurarse de formatear el codigo con prettier, ya esta configurado
-Comentar partes importantes del codigo
-Usar nombres de variables entendibles
-Al hacer forms utilizar los mismos nombres en las variables en el codigo que los que se muestran a los clientes
-Solo poner los interface types de typescript en la carpeta types

# ZUBSTAND (STORE)

-Los nombres de los archivos en store van de la siguiente manera 'use + nombreDeLaVista/nombreDescriptivo + store' ejemplo: useNotasCreditoStore.
-Antes de crear una conexion con algun enpoint revisar que no exista ya, para evitar codigo duplicado.
