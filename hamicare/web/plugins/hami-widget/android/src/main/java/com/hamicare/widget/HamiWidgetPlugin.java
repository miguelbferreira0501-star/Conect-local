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

    /**
     * Pede para o celular colocar um widget na tela inicial (Android 8+). O Android sempre mostra um aviso
     * "Adicionar à tela inicial?" (não dá para pular). Roda na tela do app, que precisa estar aberta.
     * Quando o widget entra na tela, o próprio widget avisa (pinned) e o app mostra "Pronto!".
     */
    @PluginMethod
    public void pin(PluginCall call) {
        Class<? extends LumbiWidget> cls = Widgets.ALL.get(call.getString("kind", ""));
        JSObject ret = new JSObject();
        ret.put("maker", Build.MANUFACTURER == null ? "" : Build.MANUFACTURER.toLowerCase());
        if (cls == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getActivity() == null) {
            ret.put("ok", false);
            ret.put("supported", false);
            call.resolve(ret);
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Context ctx = getContext();
                AppWidgetManager m = AppWidgetManager.getInstance(ctx);
                boolean supported = m.isRequestPinAppWidgetSupported();
                boolean ok = false;
                if (supported) {
                    android.content.Intent done = new android.content.Intent(ctx, cls);
                    done.setAction(LumbiWidget.ACTION);
                    done.putExtra("what", "pinned");
                    android.app.PendingIntent cb = android.app.PendingIntent.getBroadcast(ctx, 4242, done,
                        android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_MUTABLE);
                    ok = m.requestPinAppWidget(new ComponentName(ctx, cls), null, cb);
                }
                ret.put("supported", supported);
                ret.put("ok", ok);
            } catch (Exception e) {
                ret.put("ok", false);
                ret.put("supported", false);
            }
            call.resolve(ret);
        });
    }

    /** Abre a tela de permissões do app (no Xiaomi, a que libera "Atalhos da tela inicial"). */
    @PluginMethod
    public void openPermissions(PluginCall call) {
        Context ctx = getContext();
        android.content.Intent miui = new android.content.Intent("miui.intent.action.APP_PERM_EDITOR");
        miui.putExtra("extra_pkgname", ctx.getPackageName());
        miui.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            ctx.startActivity(miui);
        } catch (Exception e) {
            android.content.Intent app = new android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                android.net.Uri.fromParts("package", ctx.getPackageName(), null));
            app.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(app);
        }
        call.resolve();
    }

    /** O último widget que entrou na tela inicial pelo botão do app (o app mostra "Pronto!" e zera). */
    @PluginMethod
    public void takePinned(PluginCall call) {
        SharedPreferences prefs = getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        boolean pinned = prefs.getBoolean("pinned", false);
        prefs.edit().putBoolean("pinned", false).apply();
        JSObject ret = new JSObject();
        ret.put("pinned", pinned);
        call.resolve(ret);
    }
}
