package com.hamicare.widget;

import android.content.Context;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Random;

/** Os widgets da galeria do Lumbi (um por tipo: o Android pede uma classe para cada). */
public final class Widgets {

    private Widgets() {}

    /** Tipo (o mesmo nome usado no app) → classe do widget. */
    static final Map<String, Class<? extends LumbiWidget>> ALL = new LinkedHashMap<>();

    static {
        ALL.put("agua_m", AguaM.class);
        ALL.put("agua_p", AguaP.class);
        ALL.put("tarefas_g", TarefasG.class);
        ALL.put("meta_p", MetaP.class);
        ALL.put("semana_m", SemanaM.class);
        ALL.put("dias_m", DiasM.class);
        ALL.put("dias_p", DiasP.class);
        ALL.put("amigo_g", AmigoG.class);
        ALL.put("passeio_g", PasseioG.class);
        ALL.put("mov_m", MovM.class);
        ALL.put("afirm_m", AfirmM.class);
        ALL.put("bolhas_m", BolhasM.class);
        ALL.put("moeda_p", MoedaP.class);
    }

    private static final int[] CUPS = { R.id.w_cup0, R.id.w_cup1, R.id.w_cup2, R.id.w_cup3, R.id.w_cup4, R.id.w_cup5, R.id.w_cup6, R.id.w_cup7 };

    /** Água (médio): 8 copinhos; tocar neles marca mais um. */
    public static class AguaM extends LumbiWidget {
        int layout() { return R.layout.w_agua_m; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            int cups = d.optInt("cups", 0);
            int goal = Math.max(1, d.optInt("cupsGoal", 8));
            v.setTextViewText(R.id.w_count, cups + "/" + goal);
            // Os 8 copinhos mostram a proporção da meta (meta maior que 8: cada copinho vale mais de um copo).
            int lit = goal <= 8 ? cups : (int) Math.floor(cups * 8.0 / goal);
            for (int i = 0; i < CUPS.length; i++) {
                boolean show = goal >= 8 || i < goal;
                v.setViewVisibility(CUPS[i], show ? View.VISIBLE : View.GONE);
                v.setImageViewResource(CUPS[i], i < lit ? R.drawable.w_copo_cheio : R.drawable.w_copo_vazio);
            }
            v.setOnClickPendingIntent(R.id.w_cups, tap(c, "agua", 0));
        }

        void handle(Context c, String what, int index) {
            if ("agua".equals(what)) addWater(c);
        }
    }

    /** Água (pequeno): o número de copos; tocar marca mais um. */
    public static class AguaP extends LumbiWidget {
        int layout() { return R.layout.w_agua_p; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            v.setTextViewText(R.id.w_count, d.optInt("cups", 0) + "/" + d.optInt("cupsGoal", 8));
        }

        RemoteViews build(Context c) {
            RemoteViews v = super.build(c);
            v.setOnClickPendingIntent(R.id.w_root, tap(c, "agua", 0));
            return v;
        }

        void handle(Context c, String what, int index) {
            if ("agua".equals(what)) addWater(c);
        }
    }

    private static final int[] ROWS = { R.id.w_row0, R.id.w_row1, R.id.w_row2, R.id.w_row3, R.id.w_row4 };
    private static final int[] ROW_C = { R.id.w_rowc0, R.id.w_rowc1, R.id.w_rowc2, R.id.w_rowc3, R.id.w_rowc4 };
    private static final int[] ROW_T = { R.id.w_rowt0, R.id.w_rowt1, R.id.w_rowt2, R.id.w_rowt3, R.id.w_rowt4 };

    /** Tarefas de hoje (grande): a lista com o que já foi feito. */
    public static class TarefasG extends LumbiWidget {
        int layout() { return R.layout.w_tarefas_g; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            JSONArray list = arr(d, "tasks");
            v.setTextViewText(R.id.w_head, "Feito hoje  " + d.optInt("done", 0) + "/" + d.optInt("total", 0));
            for (int i = 0; i < ROWS.length; i++) {
                JSONObject t = list.optJSONObject(i);
                if (t == null && !(i == 0 && list.length() == 0)) {
                    v.setViewVisibility(ROWS[i], View.GONE);
                    continue;
                }
                v.setViewVisibility(ROWS[i], View.VISIBLE);
                if (t == null) {
                    v.setTextViewText(ROW_T[i], "Nenhuma tarefa hoje. Toque para planejar!");
                    v.setImageViewResource(ROW_C[i], R.drawable.w_check_off);
                } else {
                    v.setTextViewText(ROW_T[i], t.optString("t", ""));
                    v.setImageViewResource(ROW_C[i], t.optBoolean("d") ? R.drawable.w_check_on : R.drawable.w_check_off);
                }
            }
        }
    }

    /** Meta do dia (pequeno): anel de progresso em volta do Lumbi. */
    public static class MetaP extends LumbiWidget {
        int layout() { return R.layout.w_meta_p; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            int pct = Math.max(0, Math.min(100, d.optInt("pct", 0)));
            v.setProgressBar(R.id.w_ring, 100, pct, false);
            v.setTextViewText(R.id.w_pct, pct + "%");
        }
    }

    private static final int[] DL = { R.id.w_dl0, R.id.w_dl1, R.id.w_dl2, R.id.w_dl3, R.id.w_dl4, R.id.w_dl5, R.id.w_dl6 };
    private static final int[] DD = { R.id.w_dd0, R.id.w_dd1, R.id.w_dd2, R.id.w_dd3, R.id.w_dd4, R.id.w_dd5, R.id.w_dd6 };

    /** Metas desta semana (médio): os últimos 7 dias, com um check nos dias em que cuidou de si. */
    public static class SemanaM extends LumbiWidget {
        int layout() { return R.layout.w_semana_m; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            JSONArray week = arr(d, "week");
            int n = 0;
            for (int i = 0; i < 7; i++) {
                JSONObject day = week.optJSONObject(i);
                boolean on = day != null && day.optBoolean("d");
                if (on) n++;
                v.setTextViewText(DL[i], day != null ? day.optString("l", "") : "");
                v.setImageViewResource(DD[i], on ? R.drawable.w_dia_on : R.drawable.w_dia_off);
            }
            v.setTextViewText(R.id.w_title, "Esta semana · " + n + "/7");
        }
    }

    /** Dias juntos (médio): desde o dia em que você resgatou o Lumbi. */
    public static class DiasM extends LumbiWidget {
        int layout() { return R.layout.w_dias_m; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            int n = Math.max(1, d.optInt("together", 1));
            v.setTextViewText(R.id.w_num, String.valueOf(n));
            v.setTextViewText(R.id.w_lbl, n == 1 ? "dia juntos" : "dias juntos");
        }
    }

    public static class DiasP extends DiasM {
        int layout() { return R.layout.w_dias_p; }
    }

    /** Melhor amigo (grande, Lumbi+): o nome e o carinho do Lumbi. */
    public static class AmigoG extends LumbiWidget {
        int layout() { return R.layout.w_amigo_g; }

        boolean plus() { return true; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            int love = Math.max(0, Math.min(100, d.optInt("love", 50)));
            v.setTextViewText(R.id.w_name, d.optString("name", "Lumbi") + " · seu melhor amigo ♥");
            v.setProgressBar(R.id.w_love, 100, love, false);
        }
    }

    /** Passeio (grande, Lumbi+): o recadinho do Lumbi na praça. */
    public static class PasseioG extends LumbiWidget {
        int layout() { return R.layout.w_passeio_g; }

        boolean plus() { return true; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            v.setTextViewText(R.id.w_line, d.optString("line", "Bora cuidar de você hoje?"));
        }
    }

    /** Ponha-se em movimento (médio): a próxima tarefa de movimento. */
    public static class MovM extends LumbiWidget {
        int layout() { return R.layout.w_mov_m; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            v.setTextViewText(R.id.w_line, d.optString("move", "Que tal alongar 5 minutinhos?"));
        }
    }

    /** Afirmação do dia (médio). */
    public static class AfirmM extends LumbiWidget {
        int layout() { return R.layout.w_afirm_m; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            v.setTextViewText(R.id.w_line, d.optString("affirm", "Pequeno ainda é progresso."));
        }
    }

    private static final int[] BUBBLES = { R.id.w_b0, R.id.w_b1, R.id.w_b2, R.id.w_b3, R.id.w_b4, R.id.w_b5, R.id.w_b6, R.id.w_b7, R.id.w_b8, R.id.w_b9, R.id.w_b10, R.id.w_b11, R.id.w_b12, R.id.w_b13, R.id.w_b14, R.id.w_b15, R.id.w_b16, R.id.w_b17 };

    /** Estoure bolhas (médio, Lumbi+): plástico-bolha para os dias de ansiedade. Estourou tudo, enche de novo. */
    public static class BolhasM extends LumbiWidget {
        int layout() { return R.layout.w_bolhas_m; }

        boolean plus() { return true; }

        static String state(Context c) {
            String s = prefs(c).getString("bubbles", "");
            return s.length() == BUBBLES.length ? s : "000000000000000000";
        }

        void fill(Context c, RemoteViews v, JSONObject d) {
            String s = state(c);
            boolean open = d.optBoolean("plus", false) || d.optBoolean("kid", false);
            for (int i = 0; i < BUBBLES.length; i++) {
                v.setImageViewResource(BUBBLES[i], s.charAt(i) == '1' ? R.drawable.w_bolha_pop : R.drawable.w_bolha);
                if (open) v.setOnClickPendingIntent(BUBBLES[i], tap(c, "bolha", i));
            }
        }

        void handle(Context c, String what, int index) {
            if (!"bolha".equals(what) || index < 0 || index >= BUBBLES.length) return;
            char[] s = state(c).toCharArray();
            s[index] = '1';
            String next = new String(s);
            if (!next.contains("0")) next = "000000000000000000";
            prefs(c).edit().putString("bubbles", next).apply();
        }
    }

    private static final String[] COIN_YES = { "Sim! ✨", "Vai fundo!", "Com certeza 🐾" };
    private static final String[] COIN_NO = { "Hoje não", "Melhor não 🐾", "Espera um pouquinho" };

    /** Moeda da sorte (pequeno, Lumbi+): tocar joga a moeda e o Lumbi responde sim ou não. */
    public static class MoedaP extends LumbiWidget {
        int layout() { return R.layout.w_moeda_p; }

        boolean plus() { return true; }

        void fill(Context c, RemoteViews v, JSONObject d) {
            String ans = prefs(c).getString("coin", "");
            v.setViewVisibility(R.id.w_coin, ans.isEmpty() ? View.GONE : View.VISIBLE);
            v.setTextViewText(R.id.w_coin, ans);
        }

        RemoteViews build(Context c) {
            RemoteViews v = super.build(c);
            JSONObject d = data(c);
            if (d.optBoolean("plus", false) || d.optBoolean("kid", false)) v.setOnClickPendingIntent(R.id.w_root, tap(c, "moeda", 0));
            return v;
        }

        void handle(Context c, String what, int index) {
            if (!"moeda".equals(what)) return;
            Random r = new Random();
            String[] pool = r.nextBoolean() ? COIN_YES : COIN_NO;
            SharedPreferences p = prefs(c);
            p.edit().putString("coin", pool[r.nextInt(pool.length)]).apply();
        }
    }
}
