import { Bath, Camera, Car, CheckCircle2, DoorOpen, Footprints, Home, KeyRound, PawPrint, Scissors, Wind, type LucideIcon } from 'lucide-react';
import type { LiveStage } from '@conecta/shared';

/** Ícone de cada etapa do Pet ao Vivo (traço fino, mesmo conjunto do resto do app). */
const ICONS: Record<LiveStage, LucideIcon> = {
  checkin: PawPrint,
  bath: Bath,
  drying: Wind,
  grooming: Scissors,
  ready: CheckCircle2,
  walk_start: Footprints,
  walk_end: Home,
  visit_start: KeyRound,
  visit_end: DoorOpen,
  pickup: Car,
  dropoff: CheckCircle2,
  photo: Camera,
  done: CheckCircle2,
};

export function StageIcon({ stage, className = 'h-4 w-4' }: { stage: string; className?: string }) {
  const Icon = ICONS[stage as LiveStage] ?? PawPrint;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
