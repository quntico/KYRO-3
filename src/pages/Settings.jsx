import React, { useCallback, useRef, useState } from 'react';
    import { motion } from 'framer-motion';
    import { Helmet } from 'react-helmet';
    import { useTheme } from '@/contexts/ThemeContext.jsx';
    import { Sun, Moon, Sparkles, Palette, Bell, User, Shield, MessageSquare, LayoutDashboard, Zap, Gamepad2, Upload, Building } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { toast } from '@/components/ui/use-toast';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { Slider } from '@/components/ui/slider';
    import { useSettings } from '@/contexts/SettingsContext';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const Settings = () => {
      const { user } = useAuth();
      const { theme, changeTheme, themeSettings, updateThemeSettings } = useTheme();
      const { settings, setSettings, refetchSettings } = useSettings();
      const fileInputRef = useRef(null);
      const [uploading, setUploading] = useState(false);

      const settingsOptions = [
        {
          id: 'profile',
          title: 'Perfil',
          description: 'Actualiza tu información personal y de contacto.',
          icon: User,
          action: () => handleAction('Perfil'),
        },
        {
          id: 'notifications',
          title: 'Notificaciones',
          description: 'Configura cómo y cuándo recibes notificaciones.',
          icon: Bell,
          action: () => handleAction('Notificaciones'),
        },
        {
          id: 'security',
          title: 'Seguridad',
          description: 'Gestiona tu contraseña y la seguridad de tu cuenta.',
          icon: Shield,
          action: () => handleAction('Seguridad'),
        },
      ];
      
      const themeOptions = [
        { value: 'light', label: 'Claro', icon: Sun },
        { value: 'dark', label: 'Oscuro', icon: Moon },
        { value: 'futuristic', label: 'Futurista', icon: Sparkles },
        { value: 'play', label: 'MODO PLAY', icon: Gamepad2 },
      ];

      const handleAction = (action) => {
        toast({
          title: `🚧 ${action}`,
          description: "Esta función no está implementada aún—¡pero no te preocupes! Puedes solicitarla en tu próximo prompt! 🚀",
        });
      };

      const handleGreetingsChange = (e) => {
        setSettings(prev => ({ ...prev, greetings: e.target.value }));
      };

      const handleSaveGreetings = useCallback(async () => {
        if (!user) return;
        const { error } = await supabase
          .from('user_settings')
          .upsert({ id: user.id, greetings: settings.greetings }, { onConflict: 'id' });

        if (error) {
          toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "¡Guardado!", description: "Tu saludo de bienvenida ha sido actualizado." });
        }
      }, [user, settings.greetings]);

      const handleLogoUpload = async (event) => {
        const file = event.target.files[0];
        if (!file || !user) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage.from('logos').upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage.from('logos').getPublicUrl(filePath);
            
            const { error: dbError } = await supabase
                .from('user_settings')
                .upsert({ id: user.id, logo_url: publicUrl }, { onConflict: 'id' });

            if (dbError) {
                throw dbError;
            }
            
            await refetchSettings();
            
            toast({
                title: '¡Logo actualizado!',
                description: 'Tu logo de la compañía ha sido guardado.',
            });

        } catch (error) {
            toast({
                title: 'Error al subir el logo',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
      };

      const handleIntensityChange = (value) => {
        updateThemeSettings({ futuristicGlowIntensity: value[0] });
      };

      return (
        <div className="h-full overflow-y-auto scrollbar-hide bg-background text-foreground">
          <Helmet>
            <title>Ajustes - KYRO</title>
            <meta name="description" content="Personaliza tu experiencia en KYRO CRM." />
          </Helmet>
          <div className="p-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold mb-2">Ajustes</h1>
              <p className="text-muted-foreground">Personaliza tu experiencia en KYRO</p>
            </motion.div>

            <div className="max-w-4xl mx-auto space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold flex items-center">
                      <Palette className="w-6 h-6 mr-3 text-purple-500" />
                      Apariencia
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Elige tu tema preferido para la interfaz.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 mt-4 sm:mt-0 p-1 bg-secondary rounded-full">
                    {themeOptions.map((option) => {
                      const Icon = option.icon;
                      return (
                        <Button
                          key={option.value}
                          variant={theme === option.value ? 'default' : 'ghost'}
                          onClick={() => changeTheme(option.value)}
                          className={`rounded-full transition-all flex items-center space-x-2 px-3 ${
                            theme === option.value
                              ? (option.value === 'futuristic' || option.value === 'play'
                                  ? 'bg-gradient-to-r from-primary to-accent text-white'
                                  : 'bg-primary text-primary-foreground')
                              : ''
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="hidden sm:inline">{option.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
                {(theme === 'futuristic' || theme === 'play') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: '24px' }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <Label htmlFor="intensity-slider" className="flex items-center mb-3 text-muted-foreground">
                      <Zap className="w-4 h-4 mr-2" />
                      Intensidad de Brillo
                    </Label>
                    <div className="flex items-center space-x-4">
                      <Slider
                        id="intensity-slider"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[themeSettings.futuristicGlowIntensity]}
                        onValueChange={handleIntensityChange}
                      />
                      <span className="text-sm font-mono w-12 text-right">{themeSettings.futuristicGlowIntensity.toFixed(1)}</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border"
              >
                <h2 className="text-xl font-semibold flex items-center mb-4">
                  <Building className="w-6 h-6 mr-3 text-green-500" />
                  Identidad de la Compañía
                </h2>
                <div className="space-y-4">
                    <Label htmlFor="logo-upload" className="flex items-center mb-2 text-muted-foreground">
                        <Upload className="w-4 h-4 mr-2" />
                        Logo de la Compañía
                    </Label>
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-secondary rounded-md flex items-center justify-center overflow-hidden">
                            {settings.logo_url ? (
                                <img src={settings.logo_url} alt="Logo de la compañía" className="w-full h-full object-contain" />
                            ) : (
                                <Building className="w-8 h-8 text-muted-foreground" />
                            )}
                        </div>
                        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                            {uploading ? 'Subiendo...' : 'Cambiar Logo'}
                        </Button>
                        <Input
                            id="logo-upload"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleLogoUpload}
                            className="hidden"
                            accept="image/png, image/jpeg, image/svg+xml, image/webp"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Sube el logo de tu compañía para personalizar el Dashboard.
                    </p>
                </div>
              </motion.div>


              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-2xl p-6 shadow-sm border border-border"
              >
                <h2 className="text-xl font-semibold flex items-center mb-4">
                  <LayoutDashboard className="w-6 h-6 mr-3 text-blue-500" />
                  Dashboard
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="greetings-input" className="flex items-center mb-2 text-muted-foreground">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Saludos de bienvenida
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="greetings-input"
                        type="text"
                        value={settings.greetings || ''}
                        onChange={handleGreetingsChange}
                        placeholder="Escribe tus saludos, separados por comas"
                        className="bg-input"
                      />
                      <Button onClick={handleSaveGreetings}>Guardar</Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Separa cada saludo con una coma. Estos rotarán en el Dashboard.
                    </p>
                  </div>
                </div>
              </motion.div>
              
              {settingsOptions.map((option, index) => {
                const Icon = option.icon;
                return (
                  <motion.div
                    key={option.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="bg-card rounded-2xl p-6 shadow-sm border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center mr-4">
                          <Icon className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">{option.title}</h2>
                          <p className="text-muted-foreground mt-1">{option.description}</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={option.action}>
                        Gestionar
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      );
    };

    export default Settings;