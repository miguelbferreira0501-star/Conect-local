package com.hamicare.widget;

import android.content.Context;
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
        JSObject ret = new JSObject();
        ret.put("saved", true);
        call.resolve(ret);
    }
}
