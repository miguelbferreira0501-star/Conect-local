package com.hamicare.widget;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Recebe do app o resumo do dia (nome do Hami, missões, água, ofensiva, recadinho)
 * e guarda para o widget da tela inicial; depois pede para o widget se redesenhar.
 */
@CapacitorPlugin(name = "HamiWidget")
public class HamiWidgetPlugin extends Plugin {

    static final String PREFS = "hami_widget";
    static final String KEY = "data";

    @PluginMethod
    public void update(PluginCall call) {
        Context ctx = getContext();
        JSObject data = call.getData();
        SharedPreferences prefs = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY, data.toString()).apply();
        HamiWidgetProvider.refreshAll(ctx);
        LumbiWidget.refreshAll(ctx);
        JSObject ret = new JSObject();
        ret.put("saved", true);
        call.resolve(ret);
    }

    /** Copos de água marcados pelo widget desde a última vez (o app soma e zera). */
    @PluginMethod
    public void takePending(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        int water = prefs.getInt("pending_water", 0);
        prefs.edit().putInt("pending_water", 0).apply();
        JSObject ret = new JSObject();
        ret.put("water", water);
        call.resolve(ret);
    }

    /** Pede para o celular colocar um widget na tela inicial (Android 8+, se o celular deixar). */
    @PluginMethod
    public void pin(PluginCall call) {
        JSObject ret = new JSObject();
        Class<? extends LumbiWidget> cls = Widgets.ALL.get(call.getString("kind", ""));
        if (cls == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            ret.put("ok", false);
            call.resolve(ret);
            return;
        }
        AppWidgetManager m = AppWidgetManager.getInstance(getContext());
        boolean ok = m.isRequestPinAppWidgetSupported() && m.requestPinAppWidget(new ComponentName(getContext(), cls), null, null);
        ret.put("ok", ok);
        call.resolve(ret);
    }
}
