import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { Newspaper, X } from 'lucide-react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
    import { ScrollArea } from '@/components/ui/scroll-area';

    const mockNews = {
      milenio: [
        { id: 1, title: 'Economía mexicana muestra signos de recuperación en el último trimestre', summary: 'El PIB creció un 1.5% superando las expectativas de los analistas.', time: 'hace 2 horas', source: 'Milenio', fullContent: 'El Instituto Nacional de Estadística y Geografía (INEGI) informó que el Producto Interno Bruto (PIB) de México experimentó un crecimiento del 1.5% durante el último trimestre, una cifra que supera las proyecciones de la mayoría de los analistas financieros, quienes anticipaban un avance cercano al 1.1%. Este crecimiento fue impulsado principalmente por el dinamismo del sector de servicios y un repunte en la actividad industrial. El consumo privado también mostró una fortaleza notable, contribuyendo positivamente al resultado. A pesar de los desafíos globales, como la inflación y las tensiones en las cadenas de suministro, la economía mexicana demuestra una resiliencia que ofrece un panorama optimista para el cierre del año.' },
        { id: 2, title: 'Nuevas regulaciones para el sector fintech entrarán en vigor en 2025', summary: 'Buscan dar mayor seguridad a los usuarios y fomentar la competencia.', time: 'hace 5 horas', source: 'Milenio', fullContent: 'La Comisión Nacional Bancaria y de Valores (CNBV) anunció un nuevo marco regulatorio para las empresas de tecnología financiera (fintech), que entrará en vigor a partir de enero de 2025. Las nuevas disposiciones buscan fortalecer la seguridad de los datos de los usuarios, establecer requisitos de capital más estrictos y promover una competencia más equitativa en el sector. Entre los cambios más importantes se encuentra la obligación para las plataformas de crowdfunding y wallets digitales de implementar autenticación de dos factores y reportes de transparencia periódicos. Con esta medida, México busca consolidarse como un líder en innovación financiera en América Latina, al tiempo que protege a los consumidores.' },
      ],
      usaToday: [
        { id: 1, title: 'Tech stocks rally as Fed holds interest rates steady', summary: 'The Nasdaq composite saw its biggest one-day gain in over a month.', time: '3 hours ago', source: 'USA Today', fullContent: 'Technology stocks led a broad market rally on Tuesday after the Federal Reserve announced its decision to keep interest rates unchanged. The Nasdaq Composite jumped 2.2%, marking its best performance in over a month. Investors reacted positively to the Fed\'s statement, which suggested a more cautious approach to future rate hikes amid signs of cooling inflation. Major tech giants like Apple, Microsoft, and Amazon all saw significant gains. The decision provides a much-needed boost of confidence to a market that has been volatile for most of the year, signaling a potential stabilization in the economic landscape.' },
        { id: 2, title: 'Future of remote work: Companies adopt hybrid models permanently', summary: 'A new survey shows over 70% of large corporations will not return to a full in-office week.', time: '8 hours ago', source: 'USA Today', fullContent: 'The debate over the future of the workplace seems to be settling on a hybrid solution. A comprehensive survey of Fortune 500 companies reveals that more than 70% have no plans to mandate a full five-day return to the office. Instead, they are embracing flexible hybrid models, typically requiring employees to be in the office two to three days a week. This shift is driven by employee demand for better work-life balance and companies\' desire to retain top talent in a competitive job market. The long-term implications for commercial real estate and urban economies are still unfolding, but it is clear that the traditional 9-to-5 office culture has been permanently altered.' },
      ],
      elFinanciero: [
        { id: 1, title: 'El superpeso: ¿Hasta dónde puede llegar la apreciación de la moneda?', summary: 'Analistas debaten sobre la sostenibilidad de la fortaleza del peso frente al dólar.', time: 'hace 1 hora', source: 'El Financiero', fullContent: 'El peso mexicano, apodado "superpeso", continúa su racha de apreciación frente al dólar, alcanzando niveles no vistos en casi una década. Este fenómeno se atribuye a una combinación de factores, incluyendo altas tasas de interés en México, un flujo constante de remesas y la confianza de los inversionistas en la estabilidad macroeconómica del país. Sin embargo, el debate entre analistas se intensifica: ¿es sostenible esta fortaleza? Algunos expertos advierten que una posible recesión en Estados Unidos o cambios en la política monetaria de la Fed podrían revertir la tendencia. Mientras tanto, el sector exportador comienza a sentir la presión de un tipo de cambio menos competitivo.' },
        { id: 2, title: 'Inversión extranjera directa en México alcanza cifra récord en el primer semestre', summary: 'El sector manufacturero y automotriz lideran la captación de capitales.', time: 'hace 4 horas', source: 'El Financiero', fullContent: 'La Secretaría de Economía reportó que la Inversión Extranjera Directa (IED) en México alcanzó una cifra récord de 29,000 millones de dólares durante el primer semestre del año. Este monto representa un aumento del 41% en comparación con el mismo período del año anterior. El nearshoring, o la relocalización de cadenas de suministro, es el principal motor de este crecimiento, con el sector manufacturero y la industria automotriz captando la mayor parte del capital. Estados Unidos y Canadá se mantienen como los principales países inversores, consolidando la posición de México como un socio estratégico clave en Norteamérica.' },
      ],
    };

    const ArticleViewerDialog = ({ article, isOpen, onClose }) => {
      if (!article) return null;

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-3xl h-[90vh] flex flex-col bg-card/80 backdrop-blur-lg border-white/10 text-foreground">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-primary text-glow">{article.title}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {article.source} - {article.time}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-grow pr-4 -mr-4">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{article.fullContent}</p>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      );
    };

    const NewsCard = ({ article, onClick }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-card/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/10 card-hover cursor-pointer"
        onClick={() => onClick(article)}
      >
        <div className="flex items-center mb-4">
          <Newspaper className="h-6 w-6 mr-4 text-primary" />
          <span className="text-sm text-muted-foreground">{article.time}</span>
        </div>
        <h3 className="text-lg font-bold text-glow mb-2">{article.title}</h3>
        <p className="text-muted-foreground text-sm">{article.summary}</p>
      </motion.div>
    );

    const NewsSection = ({ title, articles, onArticleClick }) => (
      <div className="mb-12">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-primary mb-6 flex items-center"
        >
          <Newspaper className="mr-3" /> {title}
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <NewsCard article={article} onClick={onArticleClick} />
            </motion.div>
          ))}
        </div>
      </div>
    );

    const News = () => {
      const [selectedArticle, setSelectedArticle] = useState(null);

      const handleArticleClick = (article) => {
        setSelectedArticle(article);
      };

      const handleCloseDialog = () => {
        setSelectedArticle(null);
      };

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground p-4 md:p-8">
          <Helmet>
            <title>Noticias - KYRO</title>
            <meta name="description" content="Manténgase informado con las últimas noticias de negocios y finanzas." />
          </Helmet>

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-glow mb-2">Centro de Noticias</h1>
            <p className="text-muted-foreground">Su resumen diario de los titulares más importantes.</p>
          </motion.div>

          <NewsSection title="Milenio" articles={mockNews.milenio} onArticleClick={handleArticleClick} />
          <NewsSection title="El Financiero" articles={mockNews.elFinanciero} onArticleClick={handleArticleClick} />
          <NewsSection title="USA Today" articles={mockNews.usaToday} onArticleClick={handleArticleClick} />

          <ArticleViewerDialog
            article={selectedArticle}
            isOpen={!!selectedArticle}
            onClose={handleCloseDialog}
          />
        </div>
      );
    };

    export default News;