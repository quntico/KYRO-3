import React, { useState, useEffect } from 'react';
    import { useSearchParams } from 'react-router-dom';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { FileText, Link as LinkIcon, BrainCircuit } from 'lucide-react';

    const mockResults = [
      {
        title: 'Cómo la IA está transformando el CRM moderno',
        link: '#',
        snippet: 'Descubre cómo la inteligencia artificial está revolucionando la gestión de relaciones con clientes, desde la automatización de tareas hasta la predicción de ventas.',
        source: 'tech-insights.com',
      },
      {
        title: 'Estrategias de ventas B2B para el 2025',
        link: '#',
        snippet: 'Las mejores estrategias para aumentar tus ventas B2B en el próximo año. Enfócate en la personalización y el valor a largo plazo.',
        source: 'business-strategies.dev',
      },
      {
        title: 'El futuro del trabajo remoto y los equipos híbridos',
        link: '#',
        snippet: 'Un análisis profundo sobre cómo las empresas se están adaptando a los modelos de trabajo híbridos y las herramientas que facilitan la colaboración.',
        source: 'workplace-innovations.org',
      },
      {
        title: 'Guía completa de SEO para startups tecnológicas',
        link: '#',
        snippet: 'Aprende a posicionar tu startup en los motores de búsqueda con esta guía completa. Desde la investigación de palabras clave hasta el link building.',
        source: 'seo-masters.io',
      },
      {
        title: 'Tendencias en diseño de interfaces de usuario (UI) para 2025',
        link: '#',
        snippet: 'Explora las tendencias que darán forma a las interfaces de usuario, incluyendo el diseño 3D, la microinteracción y la personalización avanzada.',
        source: 'uidesign-weekly.com',
      },
    ];

    const Search = () => {
      const [searchParams] = useSearchParams();
      const query = searchParams.get('q');
      const [loading, setLoading] = useState(true);
      const [results, setResults] = useState([]);

      useEffect(() => {
        setLoading(true);
        const timer = setTimeout(() => {
          setResults(mockResults);
          setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
      }, [query]);

      const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1,
          },
        },
      };

      const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
          y: 0,
          opacity: 1,
        },
      };

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground p-4 md:p-8">
          <Helmet>
            <title>Resultados de búsqueda para "{query}"</title>
            <meta name="description" content={`Búsqueda inteligente para ${query}.`} />
          </Helmet>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <p className="text-muted-foreground">Resultados de búsqueda para:</p>
            <h1 className="text-3xl md:text-4xl font-bold text-primary text-glow">{query}</h1>
          </motion.div>

          {loading ? (
            <div className="flex flex-col items-center justify-center pt-16">
              <BrainCircuit className="w-16 h-16 animate-pulse text-primary" />
              <p className="mt-4 text-muted-foreground">Buscando con IA...</p>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {results.map((result, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10"
                >
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="group">
                    <h2 className="text-xl font-bold text-glow group-hover:text-primary transition-colors">{result.title}</h2>
                    <div className="flex items-center text-sm text-green-400 mt-1">
                      <LinkIcon className="w-4 h-4 mr-2" />
                      <span>{result.source}</span>
                    </div>
                    <p className="text-muted-foreground mt-2">{result.snippet}</p>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      );
    };

    export default Search;