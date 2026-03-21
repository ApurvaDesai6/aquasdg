'use client';

import { motion } from 'framer-motion';
import { Droplets, Github, ExternalLink, Heart } from 'lucide-react';

const dataSources = [
  { name: 'Google Groundsource', url: '#' },
  { name: 'WRI Aqueduct 4.0', url: '#' },
  { name: 'UN SDG 6 Portal', url: '#' },
  { name: 'WHO GLAAS', url: '#' },
  { name: 'BGS Groundwater Atlas', url: '#' },
];

const quickLinks = [
  { name: 'Documentation', url: '#' },
  { name: 'API Reference', url: '#' },
  { name: 'Methodology', url: '#' },
  { name: 'FAQ', url: '#' },
];

export function Footer() {
  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="mt-auto border-t bg-muted/30"
    >
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-600">
                <Droplets className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-lg">AquaSDG</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered freshwater access intelligence platform for sustainable development.
            </p>
          </div>

          {/* Data Sources */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Data Sources</h3>
            <ul className="space-y-2">
              {dataSources.slice(0, 4).map((source) => (
                <li key={source.name}>
                  <a 
                    href={source.url}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    {source.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.url}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* SDG 6 Badge */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Aligned with</h3>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
              <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                6
              </div>
              <div>
                <p className="text-xs font-medium">UN SDG 6</p>
                <p className="text-xs text-muted-foreground">Clean Water & Sanitation</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for sustainable water access
          </p>
          <div className="flex items-center gap-4">
            <span>Version 1.0.0</span>
            <span>•</span>
            <span>© 2025 AquaSDG</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
