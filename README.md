This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


Cómo AUDITOR-1581 Resuelve el Reto Empresarial CAVALTEC
El reto plantea un problema real: las organizaciones carecen de herramientas prácticas, comprensibles y accionables para evaluar su nivel de cumplimiento de la Ley 1581 de 2012. Las soluciones actuales se limitan a formularios estáticos que no orientan ni priorizan acciones. 
AUDITOR-1581 resuelve esto sustituyendo el formulario tradicional por una auditoría conversacional guiada por Inteligencia Artificial. En lugar de presentar preguntas legales en frío, el sistema actúa como un experto que: 
•	Traduce y explica cada criterio normativo en lenguaje empresarial simple. 
•	Ofrece ejemplos prácticos de controles reales si el usuario tiene dudas. 
•	Registra las respuestas automáticamente mediante tool calling al modelo de IA.
•	Recalcula el nivel de cumplimiento (%) en tiempo real. 
•	Actualiza un tablero Kanban con estrategias de mejora y tareas de mitigación específicas. 
•	Genera un informe descargable con el diagnóstico completo, brechas y un plan de acción priorizado. 
En aproximadamente 15 minutos, la empresa obtiene su nivel exacto de cumplimiento (0–100%) y un plan de mitigación accionable, cumpliendo con el objetivo principal del reto en su fase de diseño sin necesidad de consultoría externa. 
Arquitectura General y Tecnologías
La plataforma implementa una arquitectura full-stack serverless basada en el modelo App Router de Next.js. Las operaciones críticas de evaluación, generación de reportes y autenticación ocurren en el servidor, mientras el cliente recibe streams de datos optimizados y seguros.
Capa / Componente	Tecnología	Razón de Elección
Framework Base	Next.js 16.2 (App Router), TypeScript 5	SSR/CSR híbrido, API Routes nativas, tipado estricto.
Cliente / UI	React 19, Tailwind CSS v4, Zustand	Diseño responsivo eficiente y manejo de estado global liviano.
Visualización 3D	Three.js, React Three Fiber, GSAP	Renderizado y animación de modelos interactivos sin WebGL manual.
Motor LLM	API de Groq (Llama 3.3 70B), Vercel AI SDK 7	Inferencia ultrarrápida (LPU), tool calling nativo y JSON estructurado.
Voz (Entrada/Salida)	Web Speech API, ElevenLabs	Reconocimiento nativo en navegador y síntesis de voz natural.
Base de Datos	Supabase (PostgreSQL)	RLS, cliente admin server-side, control robusto multiempresa.
Autenticación	NextAuth.js v4	OAuth2 seguro (Google, Microsoft, GitHub). 
Reportes PDF	@react-pdf/renderer	Generación de reportes procesados 100% en el servidor. 
Flujo Técnico Detallado
1.	Autenticación y Autorización (RBAC): Se implementa un acceso mediante OAuth. El sistema asigna roles jerárquicos (administrador, evaluador, auditor) y un middleware intercepta cada ruta para garantizar el acceso estricto según los permisos antes de la carga de la vista. 
2.	Registro y Multiempresa: Si el usuario es nuevo, completa un onboarding capturando la información básica (Nombre, NIT, sector, tamaño). Se inicializa una evaluación en base de datos y el identificador se sincroniza con el estado global para acompañar cada interacción del chat. 
3.	Diagnóstico Conversacional: Las interacciones se procesan mediante la API de Groq utilizando el modelo Llama 3.3 70B para garantizar tiempos de respuesta casi instantáneos, ideales para la interacción por voz. El modelo evalúa las respuestas contra los tres bloques normativos exigidos por la rúbrica oficial: Política de datos (máx. 40%), Privacidad desde el diseño (máx. 36%) y Gobernanza (máx. 24%).
4.	Ejecución de Reglas y Puntuación: Cada respuesta dispara una herramienta (tool call) en el backend que guarda el dato, recalcula el puntaje aplicando la lógica condicional exacta y actualiza el tablero Kanban, sincronizando la interfaz visual del usuario de forma reactiva. 
5.	Resultados y Exportación: La vista de resultados presenta el diagnóstico visual, el porcentaje consolidado y las brechas con justificaciones generadas por IA. El informe final se genera en PDF de forma programática. 
Funcionalidades Diferenciadoras (Cumplimiento Nivel 3)
La solución va más allá de un simple dashboard, integrando innovaciones técnicas que aseguran el cumplimiento del Nivel 3 avanzado: 
•	Interfaz Conversacional Bidireccional por Voz: Integra la Web Speech API para reconocimiento nativo y ElevenLabs para sintetizar la respuesta del auditor IA en español. Incluye un modo "manos libres" que automatiza el ciclo completo de escucha y respuesta sin tocar el teclado.
•	Retroalimentación Visual 3D en Tiempo Real: El medidor de cumplimiento trasciende el indicador 2D tradicional. Se utiliza un modelo 3D dinámico que reacciona y rota según el puntaje alcanzado (0% a 100%), animado con GSAP para una experiencia inmersiva y moderna. 
•	Motor de Puntuación de Precisión Reglamentaria: La lógica de cálculo no es una estimación del LLM. Está programada rígidamente sobre la tabla de pesos del reto, incluyendo herencia de porcentajes (P1 sobre P2-P5) y saltos lógicos si un control falla. 
•	Gestión de Brechas mediante Tablero Kanban: Las recomendaciones dejan de ser un simple bloque de texto. Cada brecha identificada genera una tarjeta interactiva con pasos de mitigación clasificados por severidad y estado (Por cerrar, Mitigando, Implementado). 
•	Seguridad de Aplicación Real (OWASP): Implementación técnica profunda en lugar de declarativa. Incluye validación de entradas con Zod, 6 cabeceras HTTP de seguridad rigurosas (CSP, HSTS), JWT firmado y aislamiento total de API keys en el servidor (Groq, ElevenLabs, Supabase).
•	Cumplimiento "Privacy by Design" Integrado: La propia plataforma predica con el ejemplo. Integra una política de Habeas Data funcional, gestión de derechos ARCO y verificaciones de propiedad de datos a nivel de base de datos para garantizar la separación multiempresa. 
