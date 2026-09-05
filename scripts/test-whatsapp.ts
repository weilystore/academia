#!/usr/bin/env node
/**
 * CLI Test Runner for Phase 8 WhatsApp Cloud API
 * Run with: npx tsx scripts/test-whatsapp.ts
 */

import { runWhatsAppTestSuite } from '../server/services/whatsapp/whatsappTestSuite';

async function main() {
  console.log('===============================================================');
  console.log(' ACADEMIA DE ADUANAS — FASE 8: META WHATSAPP CLOUD API SUITE   ');
  console.log('===============================================================\n');

  console.log('Ejecutando las 10 pruebas de integración...\n');
  const summary = await runWhatsAppTestSuite();

  summary.results.forEach(res => {
    const icon = res.passed ? '✅' : '❌';
    console.log(`${icon} [Prueba ${res.id}] ${res.name} (${res.durationMs}ms)`);
    console.log(`   Detalle: ${res.details}`);
    if (res.error) {
      console.log(`   Error: ${res.error}`);
    }
    console.log('');
  });

  console.log('---------------------------------------------------------------');
  console.log(`Resultado final: ${summary.passed}/${summary.total} pruebas superadas (${summary.allPassed ? 'EXITOSO' : 'FALLOS DETECTADOS'})`);
  console.log('---------------------------------------------------------------');

  process.exit(summary.allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
