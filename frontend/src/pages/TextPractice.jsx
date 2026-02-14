import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Lightbulb,
  FileText,
  RefreshCw
} from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';
import { Sidebar } from '../components/Sidebar';
import { apiRequest, getToken, updateProgress } from '../lib/utils';
import { Toaster, toast } from 'sonner';

export const TextPractice = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [context, setContext] = useState('professional email');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const contexts = [
    { value: 'professional email', label: 'Email Profesional' },
    { value: 'business report', label: 'Reporte de Negocios' },
    { value: 'presentation script', label: 'Script de Presentación' },
    { value: 'meeting notes', label: 'Notas de Reunión' },
    { value: 'job application', label: 'Aplicación de Trabajo' },
    { value: 'LinkedIn post', label: 'Post de LinkedIn' }
  ];

  const handleSubmit = async () => {
    if (!text.trim()) {
      toast.error('Por favor escribe algo para corregir');
      return;
    }

    if (!getToken()) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await apiRequest('/practice/text', {
        method: 'POST',
        body: JSON.stringify({ text, context })
      });

      setResult(response);
      
      // Update local progress
      const avgScore = Math.round((response.grammar_score + response.vocabulary_score) / 2);
      updateProgress('text', avgScore);
      
      toast.success('¡Análisis completado!');
    } catch (error) {
      toast.error(error.message || 'Error al analizar el texto');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setText('');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a]">
      <Sidebar />
      <Toaster position="top-center" richColors />
      
      <main className="ml-64 p-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 
            data-testid="text-practice-title"
            className="text-3xl font-bold font-['Outfit'] text-white mb-2"
          >
            Práctica de Escritura
          </h1>
          <p className="text-slate-400">
            Escribe un texto en inglés y recibe correcciones y consejos profesionales.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-[#1a1a2e] border-white/5 p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#7c3aed]/20 flex items-center justify-center">
                  <FileText size={20} className="text-[#7c3aed]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Tu Texto</h2>
                  <p className="text-sm text-slate-400">Escribe en inglés</p>
                </div>
              </div>

              {/* Context selector */}
              <div className="mb-4">
                <label className="text-sm text-slate-400 mb-2 block">Contexto</label>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger 
                    data-testid="context-select"
                    className="bg-white/5 border-white/10 text-white"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a2e] border-white/10">
                    {contexts.map((ctx) => (
                      <SelectItem 
                        key={ctx.value} 
                        value={ctx.value}
                        className="text-white hover:bg-white/10"
                      >
                        {ctx.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text input */}
              <Textarea
                data-testid="text-input"
                placeholder={`Escribe tu ${contexts.find(c => c.value === context)?.label.toLowerCase() || 'texto'} aquí...

Example: "Dear Mr. Johnson, I am writing to inform you about the project status..."`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[300px] bg-white/5 border-white/10 text-white placeholder:text-slate-600 resize-none mb-4"
              />

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !text.trim()}
                  data-testid="submit-text"
                  className="flex-1 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white rounded-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={18} />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2" size={18} />
                      Analizar Texto
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="border-white/10 text-slate-300 hover:bg-white/5 rounded-full"
                >
                  <RefreshCw size={18} />
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-[#1a1a2e] border-white/5 p-6 h-full">
              {result ? (
                <>
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Gramática</span>
                        <span className={`font-bold ${
                          result.grammar_score >= 80 ? 'text-[#10b981]' : 
                          result.grammar_score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>
                          {result.grammar_score}%
                        </span>
                      </div>
                      <Progress 
                        value={result.grammar_score} 
                        className="h-2 bg-white/10"
                      />
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-400">Vocabulario</span>
                        <span className={`font-bold ${
                          result.vocabulary_score >= 80 ? 'text-[#10b981]' : 
                          result.vocabulary_score >= 60 ? 'text-[#f59e0b]' : 'text-[#ef4444]'
                        }`}>
                          {result.vocabulary_score}%
                        </span>
                      </div>
                      <Progress 
                        value={result.vocabulary_score} 
                        className="h-2 bg-white/10"
                      />
                    </div>
                  </div>

                  {/* Corrected Text */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={18} className="text-[#10b981]" />
                      <h3 className="font-semibold text-white">Texto Corregido</h3>
                    </div>
                    <div 
                      data-testid="corrected-text"
                      className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-xl p-4 text-slate-200 whitespace-pre-wrap"
                    >
                      {result.corrected_text}
                    </div>
                  </div>

                  {/* Tips */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb size={18} className="text-[#f59e0b]" />
                      <h3 className="font-semibold text-white">Consejos</h3>
                    </div>
                    <div className="space-y-2">
                      {result.tips.map((tip, index) => (
                        <div 
                          key={index}
                          data-testid={`tip-${index}`}
                          className="flex items-start gap-3 bg-white/5 rounded-xl p-3"
                        >
                          <span className="w-6 h-6 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] flex items-center justify-center text-sm font-medium flex-shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-slate-300 text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="w-20 h-20 rounded-full bg-[#7c3aed]/10 flex items-center justify-center mb-6">
                    <AlertCircle size={40} className="text-[#7c3aed]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Esperando tu texto
                  </h3>
                  <p className="text-slate-400 max-w-sm">
                    Escribe un texto en inglés en el panel izquierdo y presiona "Analizar" para recibir correcciones y consejos.
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default TextPractice;
