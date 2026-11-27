package com.hamicare.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Base dos widgets do Lumbi (galeria de widgets): cada tipo tem o seu desenho (as imagens enviadas)
 * e preenche os números com o resumo que o app guardou. Alguns respondem ao toque sem abrir o app
 * (marcar um copo de água, estourar bolhas, jogar a moeda).
 */
public abstract class LumbiWidget extends AppWidgetProvider {

    static final String ACTION = "com.hamicare.widget.ACAO";

    abstract int layout();

    /** Widgets do Lumbi+ mostram um cadeado para quem não assina (crianças não veem oferta: liberado). */
    boolean plus() { return false; }

    abstract void fill(Context c, RemoteViews v, JSONObject d);

    /** Toques que o próprio widget trata (sem abrir o app). */
    void handle(Context c, String what, int index) {}

    // ---------- dados ----------

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(HamiWidgetPlugin.PREFS, Context.MODE_PRIVATE);
    }

    static JSONObject data(Context c) {
        String raw = prefs(c).getString(HamiWidgetPlugin.KEY, null);
        if (raw != null) {
            try {
                return new JSONObject(raw);
            } catch (Exception ignored) {
                // dados quebrados: usa os padrões
            }
        }
        return new JSONObject();
    }

    static void saveData(Context c, JSONObject d) {
        prefs(c).edit().putString(HamiWidgetPlugin.KEY, d.toString()).apply();
    }

    // ---------- desenho ----------

    RemoteViews build(Context c) {
        RemoteViews v = new RemoteViews(c.getPackageName(), layout());
        JSONObject d = data(c);
        try {
            fill(c, v, d);
        } catch (Exception ignored) {
            // nunca derruba o widget por causa de um dado estranho
        }
        if (plus()) {
            boolean open = d.optBoolean("plus", false) || d.optBoolean("kid", false);
            v.setViewVisibility(R.id.w_lock, open ? View.GONE : View.VISIBLE);
        }
        v.setOnClickPendingIntent(R.id.w_root, openApp(c));
        return v;
    }

    static PendingIntent openApp(Context c) {
        Intent open = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (open == null) open = new Intent();
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(c, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Toque que volta para este mesmo widget (ação + índice). */
    PendingIntent tap(Context c, String what, int index) {
        Intent i = new Intent(c, getClass());
        i.setAction(ACTION);
        i.putExtra("what", what);
        i.putExtra("index", index);
        int req = (getClass().getName() + what + index).hashCode();
        return PendingIntent.getBroadcast(c, req, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        RemoteViews v = build(c);
        for (int id : ids) m.updateAppWidget(id, v);
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        super.onReceive(c, intent);
        if (ACTION.equals(intent.getAction())) {
            if ("pinned".equals(intent.getStringExtra("what"))) prefs(c).edit().putBoolean("pinned", true).apply();
            handle(c, intent.getStringExtra("what"), intent.getIntExtra("index", 0));
            refresh(c, getClass());
        }
    }

    static void refresh(Context c, Class<? extends LumbiWidget> cls) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(c);
            int[] ids = m.getAppWidgetIds(new ComponentName(c, cls));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = cls.getDeclaredConstructor().newInstance().build(c);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Exception ignored) {
            // widget ainda não colocado ou classe indisponível
        }
    }

    /** Redesenha todos os widgets do Lumbi (chamado quando o app manda o resumo novo). */
    static void refreshAll(Context c) {
        for (Class<? extends LumbiWidget> cls : Widgets.ALL.values()) refresh(c, cls);
    }

    // ---------- ajudas ----------

    static String plural(int n, String um, String varios) {
        return n + " " + (n == 1 ? um : varios);
    }

    /** Marca um copo de água no widget: guarda para o app somar quando abrir e já mostra no desenho. */
    static void addWater(Context c) {
        JSONObject d = data(c);
        try {
            d.put("cups", Math.min(40, d.optInt("cups", 0) + 1));
        } catch (Exception ignored) {
            return;
        }
        saveData(c, d);
        SharedPreferences p = prefs(c);
        p.edit().putInt("pending_water", p.getInt("pending_water", 0) + 1).apply();
        refresh(c, Widgets.AguaM.class);
        refresh(c, Widgets.AguaP.class);
    }

    static JSONArray arr(JSONObject d, String key) {
        JSONArray a = d.optJSONArray(key);
        return a != null ? a : new JSONArray();
    }
}
