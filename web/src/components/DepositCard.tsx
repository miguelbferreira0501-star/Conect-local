import { useMemo, useState } from 'react';
import qrcode from 'qrcode-generator';
import { Check, Copy, QrCode } from 'lucide-react';
import { formatCents, pixPayload } from '@conecta/shared';
import { Button } from '@/components/ui/Button';

/**
 * Sinal pelo Pix: QR Code e "copia e cola" com a chave da própria empresa.
 * O dinheiro cai direto na conta dela; a empresa confirma o recebimento no painel.
 */
export function DepositCard({ cents, pixKey, businessName, city, status = 'pending', txid, title, note }: {
  cents: number; pixKey: string | null; businessName: string; city: string; status?: 'pending' | 'paid' | null; txid?: string; title?: string; note?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const code = useMemo(() => (pixKey ? pixPayload({ key: pixKey, amountCents: cents, name: businessName, city, txid }) : null), [pixKey, cents, businessName, city, txid]);
  const svg = useMemo(() => {
    if (!code || !showQr) return null;
    const qr = qrcode(0, 'M');
    qr.addData(code);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
  }, [code, showQr]);

  if (status === 'paid') {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-success-700/30 bg-success-50 px-3 py-2 text-sm text-success-700">
        <Check className="h-4 w-4" aria-hidden /> Sinal de {formatCents(cents)} confirmado pela empresa.
      </div>
    );
  }

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* sem permissão: o código continua visível para copiar à mão */ }
  };

  return (
    <div className="rounded-2xl border border-accent-600/40 bg-card p-4" data-testid="deposit-card">
      <p className="font-semibold text-brand-fg">{title ?? 'Sinal para garantir o horário'}: {formatCents(cents)}</p>
      {code ? (
        <>
          <p className="mt-1 text-sm text-muted">Pague pelo Pix direto para {businessName}. {note ?? 'O valor é descontado no dia do atendimento.'}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="accent" icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={copy}>
              {copied ? 'Código copiado' : 'Copiar Pix copia e cola'}
            </Button>
            <Button size="sm" variant="secondary" icon={<QrCode className="h-4 w-4" />} onClick={() => setShowQr((v) => !v)}>
              {showQr ? 'Esconder QR Code' : 'Mostrar QR Code'}
            </Button>
          </div>
          {svg && <div className="light-area mx-auto mt-3 w-48 rounded-xl bg-white p-2" aria-label="QR Code do Pix" dangerouslySetInnerHTML={{ __html: svg }} />}
          <p className="mt-3 break-all rounded-lg bg-brand-50 p-2 font-mono text-[11px] text-muted" aria-label="Código Pix">{code}</p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">A empresa vai combinar com você como pagar o sinal.</p>
      )}
    </div>
  );
}
