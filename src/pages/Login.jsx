import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Command as KyroRune, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, user } = useAuth();
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  React.useEffect(() => { if (user) navigate('/agenda', {replace: true}); }, [user]);
  const emailAccess = async () => {
    if (!email.trim()) return toast({title: 'Escribe tu correo', variant:'destructive'});
    setLoading(true);
    try {
      const {error} = codeSent
        ? await supabase.auth.verifyOtp({email: email.trim(), token: code.trim(), type:'email'})
        : await supabase.auth.signInWithOtp({email: email.trim(), options:{shouldCreateUser:false, emailRedirectTo: window.location.origin + '/agenda'}});
      if(error) throw error;
      if(!codeSent) {setCodeSent(true); toast({title:'Revisa tu correo',description:'Abre el enlace de acceso o introduce el código si aparece en el correo.'});}
    } catch(error) {toast({title:'No se pudo iniciar sesión', description:error.message,variant:'destructive'});}
    finally {setLoading(false);}
  };
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        toast({
          variant: "destructive",
          title: "Correo no confirmado",
          description: "Por favor, revisa tu bandeja de entrada y verifica tu correo electrónico para continuar.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: "Por favor, revisa tu correo y contraseña.",
        });
      }
    } else {
      toast({
        title: "¡Bienvenido de vuelta!",
        description: "Has iniciado sesión correctamente.",
      });
      navigate('/agenda');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center">
          <KyroRune className="mx-auto h-12 w-12 text-primary text-glow" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Inicia sesión en KYRO
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tu cartera está conservada. Identifica tu cuenta una vez; la sesión permanece en este equipo.
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleLogin}>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="pl-10"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              className="pl-10 pr-10"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>
        </form>
        <div className="space-y-3 border-t border-border pt-4">
          {codeSent && <Input aria-label="Código del correo" value={code} onChange={e=>setCode(e.target.value)} placeholder="Código recibido (si está disponible)" autoComplete="one-time-code" />}
          <Button type="button" variant="outline" disabled={loading} className="w-full" onClick={emailAccess}>{codeSent ? 'Verificar código' : 'Entrar con enlace por correo'}</Button>
          {codeSent && <button onClick={()=>setCodeSent(false)} className="text-sm text-primary">Volver a solicitar enlace</button>}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;