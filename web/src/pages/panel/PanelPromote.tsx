import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import qrcode from 'qrcode-generator';
import { Check, Copy, Download, MessageCircle, Printer, Star } from 'lucide-react';
import { BRAND, formatRating, isReservationCategory, type PanelBusinessDTO } from '@conecta/shared';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Feedback';

/**
 * "Divulgar": cartaz com QR Code, link e textos prontos.
 * Cada cliente que a empresa traz vira usuário do app — crescimento sem gastar com anúncio.
 */
export function PanelPromotePage() {
  const b = useOutletContext<PanelBusinessDTO>();
  const url = `${window.location.origin}/empresa/${b.slug}`;
  const reservation = isReservationCategory(b.profile.categorySlug);
  const svg = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 8, margin: 2, scalable: true });
  }, [url]);

  const action = reservation ? 'reservar sua mesa' : b.profile.acceptsBooking ? 'agendar' : 'pedir orçamento';
  const texts = {
    whatsapp: `Agora você pode ${action} e ver nossas avaliações pelo ${BRAND.name}: ${url}`,
    instagram: `📍 ${reservation ? 'Reserve' : b.profile.acceptsBooking ? 'Agende' : 'Peça orçamento'} pelo ${BRAND.name} 👇\n${url}`,
    afterService: `Obrigado pela visita! Se gostou, deixe sua avaliação no ${BRAND.name} — ajuda muito: ${url}`,
  };

  return (
    <div className="space-y-4">
      <Alert tone="info" title="Traga seus clientes para cá">
        Clientes que chegam pelo seu cartaz ou link agendam sozinhos, recebem lembrete e podem avaliar depois. Mais avaliações = melhor posição na busca (o plano pago não compra posição).
      </Alert>

      <section id="print-poster" className="card mx-auto max-w-md p-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{BRAND.name}</p>
        <h2 className="mt-1 text-2xl font-bold">{b.name}</h2>
        {b.stats.average != null && b.stats.reviewCount > 0 && (
          <p className="mt-1 inline-flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-current text-star" aria-hidden="true" />
            <strong>{formatRating(b.stats.average)}</strong> · {b.stats.reviewCount} avaliações verificadas
          </p>
        )}
        <div className="mx-auto mt-4 w-56" aria-label="QR Code para o perfil" role="img" dangerouslySetInnerHTML={{ __html: svg }} />
        <p className="mt-3 text-lg font-semibold">Aponte a câmera para {action}</p>
        <p className="mt-1 text-sm text-muted">Veja preços, horários e avaliações de clientes reais.</p>
        <p className="mt-3 break-all text-xs text-muted">{url}</p>
      </section>

      <div className="flex flex-wrap justify-center gap-2">
        <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>Imprimir cartaz</Button>
        <a className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-white px-4 font-semibold text-brand-700 hover:bg-surface"
          href={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`} download={`qrcode-${b.slug}.svg`}>
          <Download className="h-4 w-4" aria-hidden="true" />Baixar QR Code
        </a>
        <a className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-white px-4 font-semibold text-brand-700 hover:bg-surface"
          href={`https://wa.me/?text=${encodeURIComponent(texts.whatsapp)}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />Enviar no WhatsApp
        </a>
      </div>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold">Textos prontos</h2>
        <CopyLine label="Seu link" text={url} />
        <CopyLine label="Status / grupos do WhatsApp" text={texts.whatsapp} />
        <CopyLine label="Bio do Instagram" text={texts.instagram} />
        <CopyLine label="Depois do atendimento (pedir avaliação)" text={texts.afterService} />
      </section>

      <section className="card p-5 text-sm">
        <h2 className="font-semibold">Onde usar</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
          <li>Cartaz no balcão, na porta, na mesa ou no cardápio.</li>
          <li>Link na bio do Instagram e no Google.</li>
          <li>Mensagem automática do WhatsApp Business (“Agende por aqui”).</li>
          <li>Em Agenda, use “Pedir avaliação” depois de cada atendimento.</li>
        </ul>
      </section>
    </div>
  );
}

function CopyLine({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem permissão de área de transferência: o texto continua visível para copiar à mão */
    }
  };
  return (
    <div>
      <p className="text-sm font-medium">{label}</p>
      <div className="mt-1 flex items-start gap-2">
        <p className="min-w-0 flex-1 whitespace-pre-line break-words rounded-xl bg-surface p-3 text-sm">{text}</p>
        <Button size="sm" variant="secondary" aria-label={`Copiar: ${label}`} icon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} onClick={copy}>{copied ? 'Copiado' : 'Copiar'}</Button>
      </div>
    </div>
  );
}
