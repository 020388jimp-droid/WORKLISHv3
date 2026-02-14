import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, BookOpen, MessageSquare, Zap } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { LANGUAGE_LEVELS } from '../contexts/LanguageContext';

export const LevelSelector = ({ currentLevel, onSelect, showTitle = true }) => {
  const [selected, setSelected] = useState(currentLevel || 'beginner');

  const levelIcons = {
    beginner: BookOpen,
    intermediate: MessageSquare,
    advanced: Zap
  };

  const levelColors = {
    beginner: '#10b981',
    intermediate: '#f59e0b',
    advanced: '#7c3aed'
  };

  const handleSelect = (levelId) => {
    setSelected(levelId);
    if (onSelect) {
      onSelect(levelId);
    }
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">
            Selecciona tu nivel
          </h3>
          <p className="text-slate-400 text-sm">
            Esto determina el idioma de la app y retroalimentación
          </p>
        </div>
      )}

      <div className="space-y-3">
        {Object.values(LANGUAGE_LEVELS).map((level, index) => {
          const Icon = levelIcons[level.id];
          const color = levelColors[level.id];
          const isSelected = selected === level.id;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                onClick={() => handleSelect(level.id)}
                data-testid={`level-${level.id}`}
                className={`p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-[#7c3aed]/20 border-[#7c3aed]'
                    : 'bg-[#1a1a2e] border-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon size={24} style={{ color }} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-white">
                        {level.name.es}
                      </h4>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">
                      {level.description.es}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
