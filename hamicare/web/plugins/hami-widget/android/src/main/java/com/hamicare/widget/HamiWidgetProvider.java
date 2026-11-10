package com.hamicare.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONObject;

/** Widget do Hami: desenha o resumo que o app guardou (ou um convite para abrir o app). */
public class HamiWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    /** Redesenha todos os widgets do Hami (chamado pelo plugin quando o app muda). */
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, HamiWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    static RemoteViews build(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.hami_widget);
        String name = "Hami";
        String line = "Abra o app para ver o seu dia";
        String tasks = "";
        String water = "";
        String streak = "";
        SharedPreferences prefs = context.getSharedPreferences(HamiWidgetPlugin.PREFS, Context.MODE_PRIVATE);
        String raw = prefs.getString(HamiWidgetPlugin.KEY, null);
        if (raw != null) {
            try {
                JSONObject d = new JSONObject(raw);
                name = d.optString("name", name);
                line = d.optString("line", line);
                int done = d.optInt("done", 0);
                int total = d.optInt("total", 0);
                tasks = total > 0 ? done + "/" + total + " missões" : "";
                water = d.optString("water", "");
                int s = d.optInt("streak", 0);
                streak = s > 0 ? "🔥 " + s + (s == 1 ? " dia" : " dias") : "";
            } catch (Exception ignored) {
                // dados antigos ou quebrados: mostra o convite para abrir o app
            }
        }
        views.setTextViewText(R.id.hami_widget_name, name);
        views.setTextViewText(R.id.hami_widget_line, line);
        views.setTextViewText(R.id.hami_widget_tasks, tasks);
        views.setTextViewText(R.id.hami_widget_water, water.isEmpty() ? "" : "💧 " + water);
        views.setTextViewText(R.id.hami_widget_streak, streak);

        // Tocar no widget abre o app.
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open != null) {
            open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.hami_widget_root, pi);
        }
        return views;
    }
}
